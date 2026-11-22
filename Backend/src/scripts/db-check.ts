/**
 * Database Connection Check Script
 * Run with: npx ts-node src/scripts/db-check.ts
 */

import { mongoDBInstance } from "../database/index";
import { config } from "../config/index";

const checkDatabaseConnection = async () => {
  console.log("🔍 Checking database connection...\n");
  console.log("Configuration:");
  console.log(`  - Host: ${config.database.host}`);
  console.log(`  - Port: ${config.database.port}`);
  console.log(`  - Database: ${config.database.name}`);
  console.log(`  - User: ${config.database.user}`);
  console.log(`  - URI: ${config.database.uri}\n`);

  try {
    await mongoDBInstance.connect();

    const mongoose = mongoDBInstance.getConnection();
    const db = mongoose.connection.db;

    if (db) {
      // Get database stats
      const stats = await db.stats();
      console.log("\n📊 Database Statistics:");
      console.log(`  - Collections: ${stats.collections}`);
      console.log(`  - Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  - Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  - Indexes: ${stats.indexes}`);

      // List all collections
      const collections = await db.listCollections().toArray();
      console.log("\n📁 Collections:");
      if (collections.length === 0) {
        console.log("  - No collections found");
      } else {
        collections.forEach((col) => {
          console.log(`  - ${col.name}`);
        });
      }
    }

    console.log("\n✅ Database connection successful!");

    await mongoDBInstance.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Database connection failed:", error);
    process.exit(1);
  }
};

checkDatabaseConnection();
