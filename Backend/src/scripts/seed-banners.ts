/**
 * Seed Travel Banners
 */

import mongoose from "mongoose";
import { Banner } from "../models/banners/banners.model.js";
import { config } from "../config/env.config.js";

const travelBanners = [
  {
    title: "Explore the Himalayas",
    subtitle: "Discover breathtaking mountain adventures and serene landscapes",
    image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80",
    cta_text: "Book Now",
    cta_link: "/trips?category=mountains",
    position: 1,
    is_active: true,
    start_date: new Date(),
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
  },
  {
    title: "Beach Paradise Awaits",
    subtitle: "Relax on pristine beaches and enjoy tropical sunsets",
    image_url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=80",
    cta_text: "Explore Beaches",
    cta_link: "/trips?category=beach",
    position: 2,
    is_active: true,
    start_date: new Date(),
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
  {
    title: "Desert Safari Experience",
    subtitle: "Experience the magic of golden dunes and starlit nights",
    image_url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920&q=80",
    cta_text: "Discover Desert",
    cta_link: "/trips?category=desert",
    position: 3,
    is_active: true,
    start_date: new Date(),
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
  {
    title: "Cultural Heritage Tours",
    subtitle: "Immerse yourself in rich history and ancient traditions",
    image_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1920&q=80",
    cta_text: "Explore Heritage",
    cta_link: "/trips?category=cultural-heritage",
    position: 4,
    is_active: true,
    start_date: new Date(),
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
  {
    title: "Wildlife Safari Adventures",
    subtitle: "Get up close with nature's most magnificent creatures",
    image_url: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1920&q=80",
    cta_text: "Book Safari",
    cta_link: "/trips?category=wildlife",
    position: 5,
    is_active: true,
    start_date: new Date(),
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
  {
    title: "Trekking & Hiking Trails",
    subtitle: "Challenge yourself on scenic mountain trails and valleys",
    image_url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920&q=80",
    cta_text: "Start Trekking",
    cta_link: "/trips?category=trekking",
    position: 6,
    is_active: true,
    start_date: new Date(),
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
  {
    title: "Luxury Wellness Retreats",
    subtitle: "Rejuvenate your mind, body, and soul in serene locations",
    image_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&q=80",
    cta_text: "Book Retreat",
    cta_link: "/trips?category=wellness",
    position: 7,
    is_active: true,
    start_date: new Date(),
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
  {
    title: "Island Hopping Adventures",
    subtitle: "Explore exotic islands and crystal-clear waters",
    image_url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=80",
    cta_text: "Explore Islands",
    cta_link: "/trips?category=islands",
    position: 8,
    is_active: true,
    start_date: new Date(),
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
  {
    title: "Road Trip Escapes",
    subtitle: "Hit the open road and discover hidden gems along the way",
    image_url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80",
    cta_text: "Plan Road Trip",
    cta_link: "/trips?category=road-trip",
    position: 9,
    is_active: true,
    start_date: new Date(),
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
  {
    title: "Spiritual Journeys",
    subtitle: "Find peace and enlightenment on sacred pilgrimages",
    image_url: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=1920&q=80",
    cta_text: "Begin Journey",
    cta_link: "/trips?category=spiritual",
    position: 10,
    is_active: true,
    start_date: new Date(),
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
];

async function seedBanners() {
  try {
    console.log("🌱 Starting banner seeding...");

    // Connect to MongoDB
    await mongoose.connect(config.database.uri);
    console.log("✅ Connected to MongoDB");

    // Check if banners already exist
    const existingBanners = await Banner.countDocuments();
    if (existingBanners > 0) {
      console.log(`⚠️  Banners already exist (${existingBanners} records). Skipping seed.`);
      await mongoose.connection.close();
      return;
    }

    console.log(`📊 Preparing to insert ${travelBanners.length} banners`);

    // Insert banners
    const result = await Banner.insertMany(travelBanners);
    console.log(`✅ Successfully seeded ${result.length} banners:`);

    result.forEach((banner: any, index: number) => {
      console.log(`   ${index + 1}. ${banner.title}`);
      console.log(`      Position: ${banner.position} | Active: ${banner.is_active}`);
    });

    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding banners:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedBanners();
