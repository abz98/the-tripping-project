#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Memory Monitoring Dashboard ===${NC}\n"

# Node.js Process Memory
echo -e "${BLUE}📊 Node.js Process Memory:${NC}"
NODE_PROCESSES=$(ps aux | grep "node" | grep -v grep | grep -v "monitor-memory")
if [ -z "$NODE_PROCESSES" ]; then
    echo "  ⚠️  No Node.js processes running"
else
    echo "$NODE_PROCESSES" | awk '{printf "  PID: %-8s | Memory: %6.2f MB | CPU: %5s%%\n", $2, $6/1024, $3}'
fi

echo ""

# Docker Containers Memory
echo -e "${BLUE}🐳 Docker Containers Memory:${NC}"
if command -v docker &> /dev/null; then
    DOCKER_RUNNING=$(docker ps -q 2>/dev/null | wc -l | tr -d ' ')
    if [ "$DOCKER_RUNNING" -gt 0 ]; then
        docker stats --no-stream --format "  {{.Name}}\t{{.MemUsage}}\t{{.CPUPerc}}" 2>/dev/null
    else
        echo "  ⚠️  No Docker containers running"
    fi
else
    echo "  ⚠️  Docker not installed or not running"
fi

echo ""

# System Memory (macOS)
echo -e "${BLUE}💻 System Memory (macOS):${NC}"
if command -v vm_stat &> /dev/null; then
    vm_stat | perl -ne '/page size of (\d+)/ and $size=$1; /Pages\s+([^:]+)[^\d]+(\d+)/ and printf("  %-20s % 10.2f MB\n", "$1:", $2 * $size / 1048576);'
else
    echo "  ⚠️  vm_stat not available"
fi

echo ""

# API Memory Endpoint (if server is running)
echo -e "${BLUE}🌐 API Memory Stats:${NC}"
if curl -s http://localhost:3001/health/memory > /dev/null 2>&1; then
    MEMORY_DATA=$(curl -s http://localhost:3001/health/memory)
    echo "  RSS:          $(echo $MEMORY_DATA | grep -o '"rss":"[^"]*"' | cut -d'"' -f4)"
    echo "  Heap Total:   $(echo $MEMORY_DATA | grep -o '"heapTotal":"[^"]*"' | cut -d'"' -f4)"
    echo "  Heap Used:    $(echo $MEMORY_DATA | grep -o '"heapUsed":"[^"]*"' | cut -d'"' -f4)"
    echo "  External:     $(echo $MEMORY_DATA | grep -o '"external":"[^"]*"' | cut -d'"' -f4)"
    echo "  Uptime:       $(echo $MEMORY_DATA | grep -o '"formatted":"[^"]*"' | cut -d'"' -f4)"
else
    echo "  ⚠️  Server not running on http://localhost:3001"
fi

echo ""
echo -e "${YELLOW}💡 Tip: Run 'npm run monitor:watch' for continuous monitoring${NC}"
