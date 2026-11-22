import express, { Application, Request, Response } from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { config } from "./config/index";
import { HTTP_STATUS, MESSAGES } from "./constants/index";
import { mongoDBInstance } from "./database/index";
import { initializeSocketService } from "./services/socket/socket.service";
import {
  roleRoutes,
  bannerRoutes,
  categoryRoutes,
  tripAdminRoutes,
  adminUserRoutes,
  adminBookingRoutes,
  adminPaymentRoutes,
  hostTripRoutes,
  hostBatchRoutes,
  hostTripContentRoutes,
  hostBookingRoutes,
  publicRoutes,
  citiesRoutes,
  tripsRoutes,
  bookingsRoutes,
  paymentsRoutes,
  reviewsRoutes,
  supportRoutes,
  authRoutes,
  userRoutes,
  chatRoutes,
} from "./routes/index";
import uploadRoutes from "./routes/upload/upload.routes.js";

const app: Application = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({ origin: config.nodeEnv === "development" ? "*" : config.cors.origin }));
app.use(compression());
app.use(morgan(config.nodeEnv === "development" ? "dev" : "combined"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
// app.use(`/${config.api.prefix}/${config.api.version}`);
// Health check route
app.get("/health", (_req: Request, res: Response) => {
  const dbStatus = mongoDBInstance.getConnectionStatus();

  res.status(HTTP_STATUS.OK).json({
    status: "success",
    message: "Server is running",
    data: {
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      database: dbStatus ? "connected" : "disconnected",
    },
  });
});

// Memory usage endpoint
app.get("/health/memory", (_req: Request, res: Response) => {
  const usage = process.memoryUsage();
  const uptime = process.uptime();

  res.status(HTTP_STATUS.OK).json({
    status: "success",
    message: "Memory usage statistics",
    data: {
      memory: {
        rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(usage.external / 1024 / 1024)} MB`,
        arrayBuffers: `${Math.round(usage.arrayBuffers / 1024 / 1024)} MB`,
      },
      raw: {
        rss: usage.rss,
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external,
        arrayBuffers: usage.arrayBuffers,
      },
      uptime: {
        seconds: Math.round(uptime),
        formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      },
      timestamp: new Date().toISOString(),
    },
  });
});
const version = `${config.api.prefix}/${config.api.version}`;
// Routes
app.use(version, authRoutes);
app.use(version, userRoutes);
app.use(version, roleRoutes);
app.use(version, bannerRoutes);
app.use(version, categoryRoutes);
app.use(version, tripAdminRoutes);
app.use(version, adminUserRoutes);
app.use(version, adminBookingRoutes);
app.use(version, adminPaymentRoutes);
app.use(version, hostTripRoutes);
app.use(version, hostBatchRoutes);
app.use(version, hostTripContentRoutes);
app.use(version, hostBookingRoutes);
app.use(version, publicRoutes);
app.use(version, citiesRoutes);
app.use(version, tripsRoutes);
app.use(version, bookingsRoutes);
app.use(version, paymentsRoutes);
app.use(version, reviewsRoutes);
app.use(version, supportRoutes);
app.use(version, uploadRoutes);
app.use(version, chatRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    status: "error",
    message: MESSAGES.ERROR.NOT_FOUND,
  });
});

// Start server function
const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoDBInstance.connect();

    // Initialize Socket.IO
    initializeSocketService(httpServer);
    console.log("✅ Socket.IO initialized");

    // Start Express server
    const PORT = config.port;
    const HOST = config.host;

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://${HOST}:${PORT}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log(`🔗 API Prefix: ${config.api.prefix}/${config.api.version}`);
      console.log(`💬 Socket.IO ready for real-time chat`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
