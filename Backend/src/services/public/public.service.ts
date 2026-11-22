/**
 * Public Service - No auth required
 */

import mongoose from "mongoose";
import { Banner } from "../../models/banners/banners.model.js";
import { Category } from "../../models/category/category.model.js";
import { Trip } from "../../models/trips/trips.model.js";

export interface PublicBannerResponse {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  position: number;
}

export interface PublicCategoryResponse {
  id: string;
  name: string;
  type: string;
  icon_url: string;
}

export interface PublicTripResponse {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  duration_nights: number;
  start_location: string;
  end_location: string;
  base_price: number;
  is_featured: boolean;
}

export const publicService = {
  async getActiveBanners(): Promise<PublicBannerResponse[]> {
    const now = new Date();
    const banners = await Banner.find({
      is_active: true,
      start_date: { $lte: now },
      $or: [{ end_date: { $gte: now } }, { end_date: null }],
    }).sort({ position: 1 });

    return banners.map((b) => ({
      id: (b._id as mongoose.Types.ObjectId).toString(),
      title: b.title,
      subtitle: b.subtitle,
      image_url: b.image_url,
      cta_text: b.cta_text,
      cta_link: b.cta_link,
      position: b.position,
    }));
  },

  async getCategories(): Promise<PublicCategoryResponse[]> {
    const categories = await Category.find({ is_active: true }).sort({ display_order: 1 });

    return categories.map((c) => ({
      id: (c._id as mongoose.Types.ObjectId).toString(),
      name: c.name,
      type: c.type,
      icon_url: c.icon_url
    }));
  },

  async getFeaturedTrips(): Promise<PublicTripResponse[]> {
    const trips = await Trip.find({
      status: "PUBLISHED",
      is_featured: true,
      is_deleted: false,
    }).sort({ createdAt: -1 });

    return trips.map((t) => ({
      id: (t._id as mongoose.Types.ObjectId).toString(),
      title: t.title,
      description: t.description,
      duration_days: t.duration_days,
      duration_nights: t.duration_nights,
      start_location: t.start_location,
      end_location: t.end_location,
      base_price: t.base_price,
      is_featured: t.is_featured,
    }));
  },
};

export default publicService;
