# Database Setup

## MongoDB Connection

This project uses MongoDB as the database. You can run MongoDB using Docker.

### Option 1: Using Docker Run Command

```bash
docker run -d \
  --name mongodb-local \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
  mongo:7.0
```

### Option 2: Using Docker Compose (Recommended)

```bash
# Start MongoDB
docker-compose up -d

# Stop MongoDB
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Verify MongoDB is Running

```bash
# Check container status
docker ps

# View MongoDB logs
docker logs mongodb-local

# Connect to MongoDB shell
docker exec -it mongodb-local mongosh -u admin -p admin123 --authenticationDatabase admin
```

### MongoDB Connection String

The connection string is configured in `.env`:

```
MONGODB_URI=mongodb://admin:admin123@localhost:27017/tripping_db?authSource=admin
```

### Database Configuration

- **Host**: localhost
- **Port**: 27017
- **Database**: tripping_db
- **Username**: admin
- **Password**: admin123
- **Auth Database**: admin

### Useful MongoDB Commands

```bash
# Show all databases
show dbs

# Use specific database
use tripping_db

# Show collections
show collections

# Create a test document
db.test.insertOne({ name: "test", createdAt: new Date() })

# Find documents
db.test.find()
```

## Connection Features

The MongoDB connection class includes:

- **Singleton Pattern**: Ensures only one connection instance
- **Auto-reconnect**: Automatically reconnects on connection loss
- **Connection Pooling**: Configured with maxPoolSize of 10
- **Graceful Shutdown**: Properly closes connections on app termination
- **Event Handling**: Logs connection events (error, disconnect, reconnect)

## Environment Variables

Make sure these are set in your `.env` file:

```env
MONGODB_URI=mongodb://admin:admin123@localhost:27017/tripping_db?authSource=admin
DB_HOST=localhost
DB_PORT=27017
DB_NAME=tripping_db
DB_USER=admin
DB_PASSWORD=admin123
```
