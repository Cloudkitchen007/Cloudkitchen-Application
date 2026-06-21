# ── Stage 1: Build React App ────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./
RUN npm ci --silent

# Copy source and build
COPY . .

# Pass API URL as build arg → becomes env variable
ARG REACT_APP_API_URL=http://localhost:8080
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# ── Stage 2: Serve with Nginx (NON-ROOT, unprivileged) ──────────────────────
# nginx-unprivileged runs as UID 101 (non-root) and listens on 8080 by default,
# satisfying the "non-root container" requirement without manual chown gymnastics.
FROM nginxinc/nginx-unprivileged:alpine

# Custom nginx config (must listen on 8080 — a non-root user cannot bind :80)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React app
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 8080

# Image already sets USER 101; declared explicitly for clarity.
USER 101
CMD ["nginx", "-g", "daemon off;"]