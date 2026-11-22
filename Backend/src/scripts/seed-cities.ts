/**
 * Seed Cities from JSON file
 */

import mongoose from "mongoose";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { City } from "../models/cities/cities.model.js";
import { config } from "../config/env.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seedCities() {
  try {
    console.log("🌱 Starting cities seeding...");

    // Connect to MongoDB
    await mongoose.connect(config.database.uri);
    console.log("✅ Connected to MongoDB");

    // Check if cities already exist
    const existingCities = await City.countDocuments();
    if (existingCities > 0) {
      console.log(`⚠️  Cities already exist (${existingCities} records). Skipping seed.`);
      await mongoose.connection.close();
      return;
    }

    // Read cities.json file
    const citiesFilePath = join(__dirname, "../data/cities.json");
    console.log(`📖 Reading cities from: ${citiesFilePath}`);

    const citiesFileData = JSON.parse(readFileSync(citiesFilePath, "utf-8"));
    const citiesData = citiesFileData.cities;

    if (!Array.isArray(citiesData) || citiesData.length === 0) {
      throw new Error("Invalid cities data: expected non-empty array");
    }

    console.log(`📊 Found ${citiesData.length} cities to insert`);

    // Insert cities in batches for better performance
    const batchSize = 1000;
    let insertedCount = 0;

    for (let i = 0; i < citiesData.length; i += batchSize) {
      const batch = citiesData.slice(i, i + batchSize);
      await City.insertMany(batch, { ordered: false });
      insertedCount += batch.length;
      console.log(`   ✓ Inserted ${insertedCount}/${citiesData.length} cities`);
    }

    console.log(`✅ Successfully seeded ${insertedCount} cities`);

    // Create indexes
    console.log("🔍 Creating indexes...");
    await City.createIndexes();
    console.log("✅ Indexes created successfully");

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding cities:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedCities();
