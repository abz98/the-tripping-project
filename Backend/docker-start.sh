#!/bin/bash

echo "🐳 Starting Docker services for Tripping Project..."
echo ""

# Stop and remove existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null

# Remove any orphaned containers with the same names
echo "🗑️  Removing orphaned containers..."
docker rm -f mongodb-local 2>/dev/null
docker rm -f redis-local 2>/dev/null
docker rm -f minio-local 2>/dev/null

echo ""
echo "🚀 Starting fresh containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

echo ""
echo "✅ Docker services status:"
docker-compose ps

echo ""
echo "📋 Service URLs:"
echo "   MongoDB:      mongodb://admin:admin123@localhost:27017/tripping"
echo "   Redis:        redis://localhost:6379"
echo "   MinIO API:    http://localhost:9000"
echo "   MinIO Console: http://localhost:9001 (minioadmin / minioadmin123)"
echo ""
echo "🎉 All services are running!"
echo ""
echo "💡 Useful commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop all:     docker-compose down"
echo "   Restart:      ./docker-start.sh"
