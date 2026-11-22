# The Tripping Project

Travel and trip management application built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/abz98/the-tripping-project.git
   cd the-tripping-project
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB with Docker**

   ```bash
   # Using Docker Compose (recommended)
   npm run docker:up

   # Or using Docker run command
   docker run -d \
     --name mongodb-local \
     -p 27017:27017 \
     -v mongodb_data:/data/db \
     -e MONGO_INITDB_ROOT_USERNAME=admin \
     -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
     mongo:7.0
   ```

5. **Verify database connection**

   ```bash
   npm run db:check
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The server will be running at `http://localhost:3000`

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run db:check` - Check database connection
- `npm run docker:up` - Start MongoDB container
- `npm run docker:down` - Stop MongoDB container
- `npm run docker:logs` - View MongoDB logs

## 🏗️ Project Structure

```
the-tripping-project/
├── src/
│   ├── config/          # Configuration files
│   ├── constants/       # Constants and static values
│   ├── database/        # Database connection
│   ├── middlewares/     # Express middlewares
│   ├── modules/         # Feature modules
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── validators/      # Input validation
│   └── index.ts         # Application entry point
├── .env                 # Environment variables
├── .env.example         # Environment variables template
├── docker-compose.yml   # Docker Compose configuration
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

```env
# Server
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
MONGODB_URI=mongodb://admin:admin123@localhost:27017/tripping_db?authSource=admin
DB_NAME=tripping_db

# JWT
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

### MongoDB Configuration

- **Host**: localhost
- **Port**: 27017
- **Database**: tripping_db
- **Username**: admin
- **Password**: admin123

## 🔌 API Endpoints

### Health Check

```
GET /health
```

Returns server and database status.

### Root

```
GET /
```

Returns API information.

## 🛠️ Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Building for Production

```bash
npm run build
npm start
```

## 🐳 Docker

### Start MongoDB

```bash
docker-compose up -d
```

### Stop MongoDB

```bash
docker-compose down
```

### View Logs

```bash
docker logs mongodb-local
```

### Connect to MongoDB Shell

```bash
docker exec -it mongodb-local mongosh -u admin -p admin123 --authenticationDatabase admin
```

## 📦 Dependencies

### Production

- express - Web framework
- mongoose - MongoDB ODM
- cors - CORS middleware
- helmet - Security headers
- morgan - HTTP logger
- compression - Response compression
- dotenv - Environment variables

### Development

- typescript - TypeScript compiler
- ts-node-dev - Development server
- eslint - Code linting
- jest - Testing framework

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

ISC

## 👥 Authors

Your Name - [@abz98](https://github.com/abz98)
