# Memory Monitoring Guide

## Quick Commands

### 1. One-Time Memory Check

```bash
npm run monitor
```

Shows current memory usage for Node.js process, Docker containers, and system memory.

### 2. Continuous Monitoring (Auto-refresh every 2 seconds)

```bash
npm run monitor:watch
```

Press `Ctrl+C` to exit.

### 3. Docker Containers Only

```bash
npm run monitor:docker
```

Real-time stats for all Docker containers. Press `Ctrl+C` to exit.

### 4. API Memory Endpoint

```bash
npm run monitor:api
```

Or visit in browser: http://localhost:3001/health/memory

### 5. Direct Script Execution

```bash
./monitor-memory.sh          # One-time check
./monitor-watch.sh           # Continuous monitoring
```

## API Endpoints

### Health Check

```bash
GET http://localhost:3001/health
```

### Memory Stats

```bash
GET http://localhost:3001/health/memory
```

**Response:**

```json
{
  "status": "success",
  "message": "Memory usage statistics",
  "data": {
    "memory": {
      "rss": "150 MB",
      "heapTotal": "50 MB",
      "heapUsed": "30 MB",
      "external": "5 MB",
      "arrayBuffers": "1 MB"
    },
    "uptime": {
      "seconds": 3600,
      "formatted": "1h 0m 0s"
    },
    "timestamp": "2026-01-19T10:00:00.000Z"
  }
}
```

## Memory Metrics Explained

- **RSS (Resident Set Size)**: Total memory allocated for the process
- **Heap Total**: Total size of the allocated heap
- **Heap Used**: Actual memory used in the heap
- **External**: Memory used by C++ objects bound to JavaScript
- **Array Buffers**: Memory allocated for ArrayBuffers and SharedArrayBuffers

## Typical Memory Usage

- **Node.js Process**: 50-200 MB (depending on load)
- **MongoDB**: 100-500 MB
- **Redis**: 10-50 MB
- **MinIO**: 50-200 MB

## Troubleshooting

### High Memory Usage

1. Check for memory leaks using `npm run monitor:watch`
2. Review recent code changes
3. Check database query efficiency
4. Monitor file upload sizes

### Memory Not Showing

- Ensure server is running: `npm run dev`
- Check Docker containers: `docker ps`
- Verify port 3001 is accessible

## Advanced Monitoring

### Using htop (Install first: `brew install htop`)

```bash
htop
# Press F4 and search for "node"
```

### Using Activity Monitor (macOS)

```bash
open -a "Activity Monitor"
# Search for "node" in the search bar
```

### Docker Stats with Formatting

```bash
docker stats --format "table {{.Name}}\t{{.MemUsage}}\t{{.CPUPerc}}\t{{.NetIO}}"
```
