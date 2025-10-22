#!/bin/bash

echo "========================================"
echo "   CSProfAlign Local LLM Backend Server"
echo "========================================"
echo

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker found"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running"
    echo "Please start Docker and try again"
    exit 1
fi

echo "✅ Docker is running"

# Stop any existing containers
echo
echo "🛑 Stopping existing containers..."
docker-compose down &> /dev/null

# Start the backend
echo
echo "🚀 Starting CSProfAlign backend server..."
docker-compose up -d

# Wait for container to start
echo
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Check if container is running
if ! docker-compose ps | grep -q "csprofalign-vllm.*Up"; then
    echo "❌ Backend failed to start"
    echo
    echo "📋 Container logs:"
    docker-compose logs --tail=20
    echo
    echo "💡 Try running: docker-compose up --build"
    exit 1
fi

echo "✅ Backend started successfully"
echo
echo "📊 Backend Status:"
docker-compose ps

echo
echo "🌐 Backend URL: http://localhost:8000"
echo "📋 Health Check: http://localhost:8000/health"
echo
echo "💡 To view logs: docker-compose logs -f"
echo "💡 To stop backend: docker-compose down"
echo
echo "✅ Ready! You can now start the frontend with ./start.sh"
echo
