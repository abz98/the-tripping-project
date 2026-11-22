#!/bin/bash

echo "🛑 Stopping Docker services for Tripping Project..."
echo ""

# Stop and remove containers
docker-compose down

# Remove any orphaned containers
echo "🗑️  Cleaning up orphaned containers..."
docker rm -f mongodb-local 2>/dev/null
docker rm -f redis-local 2>/dev/null
docker rm -f minio-local 2>/dev/null

echo ""
echo "✅ All Docker services stopped and removed!"
echo ""
echo "💡 To start again, run: ./docker-start.sh"
