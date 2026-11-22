/**
 * Seed Travel Categories
 */

import mongoose from "mongoose";
import { Category } from "../models/category/category.model.js";
import { config } from "../config/env.config.js";

const travelCategories = [
  // EXPERIENCE Categories
  {
    name: "Adventure",
    type: "EXPERIENCE",
    icon_url: "https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=400&h=400&fit=crop",
  },
  {
    name: "Beach & Island",
    type: "EXPERIENCE",
    icon_url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop",
  },
  {
    name: "Wildlife Safari",
    type: "EXPERIENCE",
    icon_url: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=400&fit=crop",
  },
  {
    name: "Trekking & Hiking",
    type: "EXPERIENCE",
    icon_url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=400&fit=crop",
  },
  {
    name: "Cultural Heritage",
    type: "EXPERIENCE",
    icon_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&h=400&fit=crop",
  },
  {
    name: "Spiritual & Pilgrimage",
    type: "EXPERIENCE",
    icon_url: "https://images.unsplash.com/photo-1609920658906-8223bd289001?w=400&h=400&fit=crop",
  },
  {
    name: "Luxury & Wellness",
    type: "EXPERIENCE",
    icon_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=400&fit=crop",
  },
  {
    name: "Food & Culinary",
    type: "EXPERIENCE",
    icon_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop",
  },
  {
    name: "Photography Tour",
    type: "EXPERIENCE",
    icon_url: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=400&fit=crop",
  },
  {
    name: "Road Trip",
    type: "EXPERIENCE",
    icon_url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=400&fit=crop",
  },

  // DESTINATION Categories
  {
    name: "Mountains",
    type: "DESTINATION",
    icon_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
  },
  {
    name: "Desert",
    type: "DESTINATION",
    icon_url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=400&fit=crop",
  },
  {
    name: "Coastal",
    type: "DESTINATION",
    icon_url: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=400&fit=crop",
  },
  {
    name: "Hill Stations",
    type: "DESTINATION",
    icon_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
  },
  {
    name: "Historical Cities",
    type: "DESTINATION",
    icon_url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=400&fit=crop",
  },
  {
    name: "Countryside",
    type: "DESTINATION",
    icon_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=400&fit=crop",
  },
  {
    name: "Islands",
    type: "DESTINATION",
    icon_url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop",
  },

  // SEASON Categories
  {
    name: "Summer Getaway",
    type: "SEASON",
    icon_url: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400&h=400&fit=crop",
  },
  {
    name: "Winter Wonderland",
    type: "SEASON",
    icon_url: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=400&h=400&fit=crop",
  },
  {
    name: "Monsoon Special",
    type: "SEASON",
    icon_url: "https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=400&h=400&fit=crop",
  },
  {
    name: "Spring Bloom",
    type: "SEASON",
    icon_url: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop",
  },
  {
    name: "Autumn Colors",
    type: "SEASON",
    icon_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
  },
  {
    name: "Festival Season",
    type: "SEASON",
    icon_url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=400&fit=crop",
  },
];

async function seedCategories() {
  try {
    console.log("🌱 Starting category seeding...");

    // Connect to MongoDB
    await mongoose.connect(config.database.uri);
    console.log("✅ Connected to MongoDB");

    // Check if categories already exist
    const existingCategories = await Category.countDocuments();
    if (existingCategories > 0) {
      console.log(`⚠️  Categories already exist (${existingCategories} records). Skipping seed.`);
      await mongoose.connection.close();
      return;
    }

    console.log(`📊 Preparing to insert ${travelCategories.length} categories`);

    // Insert categories
    const result = await Category.insertMany(travelCategories);
    console.log(`✅ Successfully seeded ${result.length} categories:`);

    // Group by type for display
    const byType = result.reduce((acc: any, cat: any) => {
      if (!acc[cat.type]) acc[cat.type] = [];
      acc[cat.type].push(cat.name);
      return acc;
    }, {});

    Object.entries(byType).forEach(([type, names]) => {
      console.log(`\n   ${type}:`);
      (names as string[]).forEach((name) => console.log(`      - ${name}`));
    });

    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedCategories();
