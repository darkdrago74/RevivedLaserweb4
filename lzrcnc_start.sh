#!/bin/bash
# LzrCnc Smart Startup Script

# Hardcoded Project Path
PROJECT_DIR="/home/roro/Documents/LzrCnc"
PORT=3000
HEALTH_URL="http://localhost:$PORT/ping"

# Ensure tools are available
if ! command -v curl &> /dev/null || ! command -v lsof &> /dev/null; then
    echo "Error: Required tools 'curl' or 'lsof' not found."
    exit 1
fi

cd "$PROJECT_DIR" || { echo "Error: Project directory not found."; exit 1; }

# Check if Port 3000 is in use
PID=$(lsof -t -i:$PORT -sTCP:LISTEN)

if [ -n "$PID" ]; then
    echo "Port $PORT is currently in use by PID $PID."
    
    echo "Checking server health..."
    # Try to ping the server (timeout 2s)
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "$HEALTH_URL")
    
    if [ "$HTTP_STATUS" == "200" ]; then
        echo "✅ Server is already running and HEALTHY (PID $PID)."
        echo "Access it at: http://localhost:$PORT"
        
        # Interactive Prompt
        read -p "Do you want to STOP this instance and START a fresh one? (y/N): " choice
        case "$choice" in 
          y|Y ) 
            echo "Stopping existing server (PID $PID)..."
            kill -9 "$PID"
            sleep 1
            echo "Previous instance stopped."
            ;;
          * ) 
            echo "Keeping existing server running."
            exit 0
            ;;
        esac
    else
        echo "⚠️  Server is unresponsive (Status: $HTTP_STATUS). It might be a zombie process."
        echo "Attempting to clean up..."
        kill -9 "$PID"
        sleep 1
        echo "Cleanup complete. Starting new instance..."
    fi
fi

echo "Starting LzrCnc Server..."
npm start
