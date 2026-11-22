import mongoose from "mongoose";
import { config } from "../config/index";

class MongoDB {
  private static instance: MongoDB;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): MongoDB {
    if (!MongoDB.instance) {
      MongoDB.instance = new MongoDB();
    }
    return MongoDB.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log("📦 MongoDB is already connected");
      return;
    }

    try {
      const options = {
        autoIndex: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      await mongoose.connect(config.database.uri, options);

      this.isConnected = true;
      console.log("✅ MongoDB connected successfully");
      console.log(`📊 Database: ${config.database.name}`);

      // Handle connection events
      mongoose.connection.on("error", (error) => {
        console.error("❌ MongoDB connection error:", error);
        this.isConnected = false;
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("⚠️  MongoDB disconnected");
        this.isConnected = false;
      });

      mongoose.connection.on("reconnected", () => {
        console.log("🔄 MongoDB reconnected");
        this.isConnected = true;
      });

      // Graceful shutdown
      process.on("SIGINT", async () => {
        await this.disconnect();
        process.exit(0);
      });
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error);
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log("👋 MongoDB disconnected gracefully");
    } catch (error) {
      console.error("❌ Error disconnecting from MongoDB:", error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getConnection(): typeof mongoose {
    return mongoose;
  }
}

export const mongoDBInstance = MongoDB.getInstance();
export default mongoDBInstance;
