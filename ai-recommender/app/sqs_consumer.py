"""
SQS consumer for CloudKitchen orders queue.

Runs as a daemon thread started at FastAPI startup.
Accumulates real order counts per menu item name so the
demand forecaster can use actual data instead of synthetic estimates.
"""

import json
import logging
import os
import threading
import time

import boto3
from botocore.exceptions import BotoCoreError, ClientError

log = logging.getLogger(__name__)


class DemandTracker:
    """Thread-safe counter — maps item name → total units ordered."""

    def __init__(self):
        self._lock = threading.Lock()
        self._counts: dict[str, int] = {}
        self._order_count = 0

    def record_order(self, items: list[dict]):
        with self._lock:
            self._order_count += 1
            for item in items:
                name = (item.get("name") or "").strip().lower()
                qty = int(item.get("quantity") or 1)
                if name:
                    self._counts[name] = self._counts.get(name, 0) + qty

    def get_demand(self, item_name: str) -> int | None:
        """Return accumulated order count for item_name, or None if no data yet."""
        key = item_name.strip().lower()
        with self._lock:
            return self._counts.get(key)

    def snapshot(self) -> dict:
        with self._lock:
            return {"total_orders_processed": self._order_count, "demand": dict(self._counts)}


# Singleton shared across all FastAPI routes
demand_tracker = DemandTracker()


def _poll_loop(queue_url: str, region: str):
    sqs = boto3.client("sqs", region_name=region)
    log.info("SQS consumer started — polling %s", queue_url)

    while True:
        try:
            resp = sqs.receive_message(
                QueueUrl=queue_url,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=20,           # long-polling — avoids busy loops
                AttributeNames=["All"],
            )
            for msg in resp.get("Messages", []):
                try:
                    body = json.loads(msg["Body"])
                    items = body.get("items", [])
                    demand_tracker.record_order(items)
                    log.info(
                        "Processed orderId=%s  items=%d",
                        body.get("orderId", "?"),
                        len(items),
                    )
                    sqs.delete_message(
                        QueueUrl=queue_url,
                        ReceiptHandle=msg["ReceiptHandle"],
                    )
                except Exception as exc:
                    log.error("Failed to process SQS message: %s", exc)
                    # Don't delete — message stays and goes to DLQ after 3 attempts

        except (BotoCoreError, ClientError) as exc:
            log.error("SQS receive error: %s — retrying in 10s", exc)
            time.sleep(10)


def start_consumer():
    """Start background SQS polling thread if queue URL is configured."""
    queue_url = os.environ.get("SQS_ORDERS_QUEUE_URL", "").strip()
    region = os.environ.get("AWS_REGION", "ap-south-1")

    if not queue_url:
        log.warning("SQS_ORDERS_QUEUE_URL not set — real-time demand tracking disabled")
        return

    thread = threading.Thread(
        target=_poll_loop,
        args=(queue_url, region),
        daemon=True,
        name="sqs-orders-consumer",
    )
    thread.start()
    log.info("SQS consumer thread started")
