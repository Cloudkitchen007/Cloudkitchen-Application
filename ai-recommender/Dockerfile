# ── Stage 1: build dependencies (has compilers) ──────────────────────────────
FROM python:3.12-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# Build everything into an isolated venv we can copy to a clean runtime image.
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY requirements.txt .
# CPU-only torch first so sentence-transformers doesn't pull the ~9 GB CUDA build.
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

# ── Stage 2: runtime (slim, NON-ROOT — no build tools) ───────────────────────
FROM python:3.12-slim
WORKDIR /app

# Non-root user with a numeric UID so Kubernetes `runAsNonRoot` can verify it.
RUN groupadd -g 1000 appuser && useradd -u 1000 -g 1000 -m appuser

COPY --from=builder /opt/venv /opt/venv
COPY . .
ENV PATH="/opt/venv/bin:$PATH" \
    HF_HOME=/home/appuser/.cache/huggingface

USER 1000
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
