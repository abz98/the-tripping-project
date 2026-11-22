#!/bin/bash

echo "🧹 Cleaning up Docker services and data..."
echo ""
echo "⚠️  WARNING: This will delete ALL data (MongoDB, Redis, MinIO)!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cleanup cancelled."
    exit 0
fi

echo ""
echo "🛑 Stopping containers..."
docker-compose down

echo "🗑️  Removing containers..."
docker rm -f mongodb-local 2>/dev/null
docker rm -f redis-local 2>/dev/null
docker rm -f minio-local 2>/dev/null

echo "💾 Removing volumes (data)..."
docker-compose down -v

echo "🧹 Removing unused images..."
docker image prune -f

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "💡 To start fresh, run: ./docker-start.sh"
