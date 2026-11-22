/**
 * Script to create database indexes for chat system
 * Run: npm run setup:chat-indexes
 */

import mongoose from "mongoose";
import { config } from "../config/env.config.js";
import { ChatParticipant } from "../models/chatParticipant/chatParticipant.model.js";
import { ChatMessage } from "../models/chatMessage/chatMessage.model.js";
import { TripChat } from "../models/tripChat/tripChat.model.js";

async function setupChatIndexes() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(config.mongodb.uri);
    console.log("Connected to MongoDB");

    console.log("\n📊 Creating indexes for chat system...\n");

    // Create TripChat indexes
    console.log("Creating TripChat indexes...");
    await TripChat.createIndexes();
    console.log("✓ TripChat indexes created");

    // Create ChatParticipant indexes
    console.log("Creating ChatParticipant indexes...");
    await ChatParticipant.createIndexes();
    console.log("✓ ChatParticipant indexes created");

    // Create ChatMessage indexes
    console.log("Creating ChatMessage indexes...");
    await ChatMessage.createIndexes();
    console.log("✓ ChatMessage indexes created");

    // List all indexes
    console.log("\n📋 Listing all indexes:\n");

    const tripChatIndexes = await TripChat.collection.getIndexes();
    console.log("TripChat indexes:", Object.keys(tripChatIndexes));

    const participantIndexes = await ChatParticipant.collection.getIndexes();
    console.log("ChatParticipant indexes:", Object.keys(participantIndexes));

    const messageIndexes = await ChatMessage.collection.getIndexes();
    console.log("ChatMessage indexes:", Object.keys(messageIndexes));

    console.log("\n✅ All chat indexes created successfully!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
    process.exit(1);
  }
}

setupChatIndexes();
