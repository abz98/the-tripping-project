/**
 * Example: How to integrate Socket.IO chat system into your Express server
 *
 * This file shows the minimal changes needed to add chat to your existing server
 */

import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { config } from "./config/env.config.js";
import { connectDB } from "./database/index.js";
import { initializeSocketService } from "./services/socket/socket.service.js";

// Import routes
import authRoutes from "./routes/auth/auth.routes.js";
import chatRoutes from "./routes/chat/chat.routes.js";
// ... other routes

async function startServer() {
  // Connect to database
  await connectDB();

  // Create Express app
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.frontend.url,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Register routes
  app.use("/api/auth", authRoutes);
  app.use("/api", chatRoutes); // Chat routes
  // ... other routes

  // Error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  });

  // IMPORTANT: Create HTTP server (not just Express app)
  const httpServer = createServer(app);

  // Initialize Socket.IO
  const socketService = initializeSocketService(httpServer);
  console.log("✓ Socket.IO initialized");

  // Start server
  const PORT = config.port || 3000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.IO ready for connections`);
    console.log(`🌐 Frontend URL: ${config.frontend.url}`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully...");
    httpServer.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
}

// Start the server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

/**
 * KEY CHANGES FROM STANDARD EXPRESS:
 *
 * 1. Use createServer(app) instead of app.listen()
 * 2. Call initializeSocketService(httpServer)
 * 3. Use httpServer.listen() instead of app.listen()
 * 4. Add chat routes to your route registration
 *
 * That's it! The chat system is now integrated.
 */
