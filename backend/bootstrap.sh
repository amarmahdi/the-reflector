#!/bin/bash
# =====================================================
# The Reflector — Droplet Bootstrap Script
# Run ONCE on a fresh DigitalOcean Ubuntu droplet
# Usage: bash bootstrap.sh
# =====================================================
set -e

echo "=== 1. System packages ==="
apt-get update -y
apt-get install -y python3 python3-pip python3-venv git curl nginx

echo "=== 2. Clone the repo ==="
mkdir -p /opt/the-reflector
cd /opt/the-reflector

if [ -d ".git" ]; then
  echo "Repo already cloned, pulling..."
  git pull origin main
else
  git clone https://github.com/amarmahdi/the-reflector.git .
fi

echo "=== 3. Setup Python virtualenv ==="
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install psycopg2-binary  # for Alembic sync migrations

# ⚠️  Fill in your real values below before running on the server
DB_USER="doadmin"
DB_PASS="YOUR_DB_PASSWORD_HERE"
DB_HOST="YOUR_DB_HOST_HERE"
DB_PORT="25060"
DB_NAME="defaultdb"
GEMINI_KEY="YOUR_GEMINI_API_KEY_HERE"
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")

echo "=== 4. Write .env file ==="
cat > /opt/the-reflector/backend/.env << EOF
DATABASE_URL=postgresql+asyncpg://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?ssl=require
SECRET_KEY=${SECRET_KEY}
GEMINI_API_KEY=${GEMINI_KEY}
GEMINI_MODEL=gemini-3-pro-preview
EOF

echo "=== 5. Run DB migrations ==="
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require" \
  alembic upgrade head

echo "=== 6. Create systemd service ==="
cat > /etc/systemd/system/reflector-api.service << 'EOF'
[Unit]
Description=The Reflector FastAPI Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/the-reflector/backend
Environment=PATH=/opt/the-reflector/backend/venv/bin
ExecStart=/opt/the-reflector/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable reflector-api
systemctl start reflector-api

echo "=== 7. Configure Nginx reverse proxy ==="
cat > /etc/nginx/sites-available/reflector << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/reflector /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo ""
echo "✅ Bootstrap complete!"
echo "   API running at: http://142.93.148.160/health"
echo ""
echo "⚠️  IMPORTANT: Edit /opt/the-reflector/backend/.env and replace SECRET_KEY with a real 64-char random string"
echo "   Run: python3 -c \"import secrets; print(secrets.token_hex(32))\""
