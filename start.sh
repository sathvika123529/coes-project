#!/bin/bash
# Start both backend and frontend

echo "=========================================="
echo "  Policy Document Topic Modeler - LDA"
echo "=========================================="

# Start backend
echo ""
echo "[1/2] Starting FastAPI backend..."
cd backend
pip3 install -r requirements.txt -q
python3 main.py &
BACKEND_PID=$!
echo "    ✓ Backend running at http://localhost:8000 (PID: $BACKEND_PID)"

sleep 2

# Start frontend
echo ""
echo "[2/2] Starting React frontend..."
cd ../frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
echo "    ✓ Frontend running at http://localhost:3000 (PID: $FRONTEND_PID)"

echo ""
echo "=========================================="
echo "  Open: http://localhost:3000"
echo "  API:  http://localhost:8000/docs"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop both servers"

wait
