---
description: "B5 — Docker + Nginx + Deployment script for DigitalOcean"
depends_on: [backend-1-scaffold, backend-2-auth, backend-3-backup, backend-4-ai]
agent: agent-b5
---

# B5 — Deployment Setup

## Objective

Create the Dockerfiles, Docker Compose config, Nginx config, and deploy script to allow 1-click deployment on the DigitalOcean droplet.

## Files to Create

### `backend/Dockerfile`
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Expose port and run uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### `backend/docker-compose.yml`
```yaml
services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: reflector
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: reflector
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U reflector"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build: .
    restart: always
    depends_on:
      db:
        condition: service_healthy
    env_file: .env
    ports:
      - "8000:8000"

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api

volumes:
  pgdata:
```

### `backend/nginx.conf`
Configure a reverse proxy listening on port 80 routing to `api:8000`. Include basic rate limiting and gzip compression.

### `backend/deploy.sh`
```bash
#!/bin/bash
set -e

echo "Deploying The Reflector Backend..."

# 1. Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file missing. Copy .env.example to .env and configure it."
    exit 1
fi

# 2. Build and start containers
echo "Starting Docker containers..."
sudo docker compose up -d --build

# 3. Wait for DB to be ready
echo "Waiting for database..."
sleep 10

# 4. Run Alembic migrations
echo "Running migrations..."
sudo docker compose exec api alembic upgrade head

echo "Deployment complete! Checking health..."
curl -s http://localhost/health || echo "Health check failed."
```
Make the script executable.

## Done Criteria

Write completion report to `.agents/messages/from-agent-b5/done.md` confirming:
- Dockerfile builds successfully.
- `docker-compose.yml` is valid.
- `deploy.sh` is executable.
