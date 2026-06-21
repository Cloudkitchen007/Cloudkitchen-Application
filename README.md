# cloudkitchen-app

Application source for the CloudKitchen platform.

## Services
| Dir | Stack | Port | Notes |
|---|---|---|---|
| `menu-service` | Spring Boot / Java 17 | 8080 | Owns DB schema (Flyway). Multistage + non-root. |
| `order-service` | Spring Boot / Java 17 | 8082 | Publishes `OrderPlaced` → SQS. Multistage + non-root. |
| `auth-service` | Spring Boot / Java 17 | 8001 | Cognito auth. Multistage + non-root. |
| `ai-recommender` | FastAPI / Python 3.12 | 8000 | LangChain + ChromaDB + HF API. **Multistage + non-root (UID 1000)**. |
| `frontend` | React + Nginx | 8080 | Multistage + **non-root (nginx-unprivileged)**. |

## Security (rubric)
- All Dockerfiles are **multistage** and run as a **non-root** numeric UID
  (so Kubernetes `runAsNonRoot` validates them).

## CI (to add — priority 2)
`.github/workflows/build.yml`: lint → unit test → Trivy scan → docker build →
push to ECR → bump image tag in `cloudkitchen-gitops` (GitOps trigger).

## Push to the org
```bash
cd cloudkitchen-app && git init && git add . \
  && git commit -m "Application source" \
  && git remote add origin https://github.com/<ORG>/cloudkitchen-app.git \
  && git push -u origin main
```
