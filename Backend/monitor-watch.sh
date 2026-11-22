#!/bin/bash

# Continuous monitoring with auto-refresh every 2 seconds
watch -n 2 -c '
echo "=== Node.js Memory ==="
ps aux | grep "node" | grep -v grep | grep -v monitor | awk "{printf \"PID: %-8s | Memory: %6.2f MB | CPU: %5s%%\n\", \$2, \$6/1024, \$3}"

echo ""
echo "=== Docker Containers ==="
docker stats --no-stream --format "{{.Name}}\t{{.MemUsage}}\t{{.CPUPerc}}" 2>/dev/null || echo "No containers running"

echo ""
echo "=== API Memory (http://localhost:3001/health/memory) ==="
curl -s http://localhost:3001/health/memory 2>/dev/null | grep -o "\"rss\":\"[^\"]*\"" | cut -d"\"" -f4 | xargs -I {} echo "RSS: {}" || echo "Server not running"
'
