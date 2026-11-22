/**
 * Seed Default Roles
 */

import mongoose from "mongoose";
import { Role } from "../models/roles/roles.model.js";
import { config } from "../config/env.config.js";

const defaultRoles = [
  {
    name: "TRAVELLER",
    permissions: {
      trips: { read: true, write: false },
      bookings: { read: true, write: true, cancel: true },
      reviews: { read: true, write: true, delete: true },
      profile: { read: true, write: true },
    },
    is_active: true,
  },
  {
    name: "HOST",
    permissions: {
      trips: { read: true, write: true, delete: true, submit: true },
      batches: { read: true, write: true, delete: true },
      itineraries: { read: true, write: true },
      inclusions: { read: true, write: true },
      media: { read: true, write: true, delete: true },
      bookings: { read: true },
      profile: { read: true, write: true },
    },
    is_active: true,
  },
  {
    name: "USER",
    permissions: {
      trips: { read: true, write: true, delete: true, submit: true },
      batches: { read: true, write: true, delete: true },
      itineraries: { read: true, write: true },
      inclusions: { read: true, write: true },
      media: { read: true, write: true, delete: true },
      bookings: { read: true, write: true, cancel: true },
      reviews: { read: true, write: true, delete: true },
      profile: { read: true, write: true },
    },
    is_active: true,
  },
  {
    name: "ADMIN",
    permissions: {
      all: true,
      users: { read: true, write: true, delete: true },
      roles: { read: true, write: true, delete: true },
      trips: { read: true, write: true, delete: true, moderate: true },
      banners: { read: true, write: true, delete: true },
      categories: { read: true, write: true, delete: true },
      bookings: { read: true, write: true },
      payments: { read: true, write: true },
      reviews: { read: true, write: true, delete: true },
    },
    is_active: true,
  },
];

async function seedRoles() {
  try {
    console.log("🌱 Starting role seeding...");

    // Connect to MongoDB
    await mongoose.connect(config.database.uri);
    console.log("✅ Connected to MongoDB");

    // Check if roles already exist
    const existingRoles = await Role.find();
    if (existingRoles.length > 0) {
      console.log("⚠️  Roles already exist. Skipping seed.");
      console.log(
        `Found ${existingRoles.length} roles:`,
        existingRoles.map((r) => r.name),
      );
      await mongoose.connection.close();
      return;
    }

    // Insert default roles
    const result = await Role.insertMany(defaultRoles);
    console.log(`✅ Successfully seeded ${result.length} roles:`);
    result.forEach((role) => {
      console.log(`   - ${role.name}`);
    });

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding roles:", error);
    process.exit(1);
  }
}

seedRoles();
