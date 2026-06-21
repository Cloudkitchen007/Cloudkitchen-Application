package com.cloudkitchen.order.event;

import com.cloudkitchen.order.model.Order;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderEventPublisher {

    private final SqsClient sqsClient;
    private final ObjectMapper objectMapper;

    @Value("${aws.sqs.orders-queue-url:}")
    private String ordersQueueUrl;

    public void publishOrderPlaced(Order order) {
        if (ordersQueueUrl == null || ordersQueueUrl.isBlank()) {
            log.debug("SQS queue URL not configured — skipping event publish");
            return;
        }
        try {
            OrderPlacedEvent event = OrderPlacedEvent.from(order);
            String body = objectMapper.writeValueAsString(event);

            sqsClient.sendMessage(SendMessageRequest.builder()
                    .queueUrl(ordersQueueUrl)
                    .messageBody(body)
                    .build());

            log.info("Published OrderPlaced event for orderId={} items={}",
                    order.getId(), order.getOrderItems().size());
        } catch (Exception e) {
            // Order is already saved — SQS failure must not roll back the order
            log.error("Failed to publish OrderPlaced event for orderId={}: {}",
                    order.getId(), e.getMessage());
        }
    }
}
