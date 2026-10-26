#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
echo "=========================================================="
echo " Starting MyBIZ - Personal & Business Financial Platform"
echo " (FastAPI + MongoDB + React)"
echo "=========================================================="


# Determine python binary
PYTHON_BIN="python3"
if [ -f "$DIR/backend/.venv/bin/python" ]; then
    PYTHON_BIN="$DIR/backend/.venv/bin/python"
fi

# Check and ensure MongoDB is running
if "$PYTHON_BIN" -c "import socket; s = socket.socket(); s.settimeout(1); s.connect(('127.0.0.1', 27017)); s.close()" 2>/dev/null; then
    echo "[INFO] MongoDB is already active and responsive on port 27017."
elif command -v docker >/dev/null 2>&1; then
    echo "[INFO] Starting MongoDB container via Docker Compose..."
    (cd "$DIR" && docker compose up -d mongodb)
fi

# Cleanup handler on exit
cleanup() {
    echo ""
    echo "Stopping MyBIZ services..."
    if [ -n "$BACKEND_PID" ]; then
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill -TERM "$FRONTEND_PID" 2>/dev/null || true
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT


# 1. Launch FastAPI backend
echo "[1/2] Starting FastAPI Backend on http://0.0.0.0:8000..."
cd "$DIR/backend"
PYTHONPATH="$DIR/backend" "$PYTHON_BIN" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait briefly for backend socket
sleep 1.5

# 2. Launch React frontend dev server
echo "[2/2] Starting React Frontend on http://0.0.0.0:5173..."
cd "$DIR/frontend"
"$DIR/frontend/node_modules/.bin/vite" --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

echo "=========================================================="
echo " MyBIZ is running with MongoDB!"
echo " - Frontend Dashboard : http://localhost:5173"
echo " - Backend REST API   : http://localhost:8000"
echo " - API Documentation  : http://localhost:8000/api/v1/docs"
echo " - MongoDB Database   : mongodb://localhost:27017/mybiz"
echo "=========================================================="

wait
