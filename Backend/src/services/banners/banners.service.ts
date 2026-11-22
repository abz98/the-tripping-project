/**
 * Banner Service
 * Handles banner management business logic
 */

import mongoose from "mongoose";
import { Banner } from "../../models/banners/banners.model.js";
import { BannerValidationError, BannerNotFoundError } from "./banners.errors.js";

export interface CreateBannerDTO {
  title: string;
  subtitle: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  position: number;
  is_active?: boolean;
  start_date?: Date;
  end_date?: Date;
}

export interface UpdateBannerDTO {
  title?: string;
  subtitle?: string;
  image_url?: string;
  cta_text?: string;
  cta_link?: string;
  position?: number;
  start_date?: Date;
  end_date?: Date;
}

export interface BannerResponse {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  position: number;
  is_active: boolean;
  start_date: Date;
  end_date?: Date;
  createdAt: Date;
  updatedAt: Date;
}

function toBannerResponse(banner: any): BannerResponse {
  return {
    id: (banner._id as mongoose.Types.ObjectId).toString(),
    title: banner.title,
    subtitle: banner.subtitle,
    image_url: banner.image_url,
    cta_text: banner.cta_text,
    cta_link: banner.cta_link,
    position: banner.position,
    is_active: banner.is_active,
    start_date: banner.start_date,
    end_date: banner.end_date,
    createdAt: banner.createdAt,
    updatedAt: banner.updatedAt,
  };
}

function validateCreateBanner(data: CreateBannerDTO): void {
  const errors: Record<string, string> = {};

  if (!data.title?.trim()) errors.title = "Title is required";
  if (!data.subtitle?.trim()) errors.subtitle = "Subtitle is required";
  if (!data.image_url?.trim()) errors.image_url = "Image URL is required";
  if (!data.cta_text?.trim()) errors.cta_text = "CTA text is required";
  if (!data.cta_link?.trim()) errors.cta_link = "CTA link is required";
  if (data.position === undefined) errors.position = "Position is required";
  // start_date and end_date are now optional (defaults handled by model)

  if (Object.keys(errors).length > 0) {
    throw new BannerValidationError("Validation failed", errors);
  }
}

export const bannerService = {
  async create(data: CreateBannerDTO): Promise<BannerResponse> {
    validateCreateBanner(data);

    // Shift existing banners at or after the new position
    await Banner.updateMany({ position: { $gte: data.position } }, { $inc: { position: 1 } });

    const banner = await Banner.create(data);

    return toBannerResponse(banner);
  },

  async list(): Promise<BannerResponse[]> {
    const banners = await Banner.find().sort({ position: 1 });
    return banners.map(toBannerResponse);
  },

  async update(id: string, data: UpdateBannerDTO): Promise<BannerResponse> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BannerNotFoundError();
    }

    const banner = await Banner.findById(id);
    if (!banner) {
      throw new BannerNotFoundError();
    }

    // If position is being updated, handle position shifting
    if (data.position !== undefined && data.position !== banner.position) {
      const oldPosition = banner.position;
      const newPosition = data.position;

      if (newPosition < oldPosition) {
        // Moving up: shift banners between new and old position down
        await Banner.updateMany(
          {
            _id: { $ne: id },
            position: { $gte: newPosition, $lt: oldPosition },
          },
          { $inc: { position: 1 } },
        );
      } else {
        // Moving down: shift banners between old and new position up
        await Banner.updateMany(
          {
            _id: { $ne: id },
            position: { $gt: oldPosition, $lte: newPosition },
          },
          { $inc: { position: -1 } },
        );
      }
    }

    Object.assign(banner, data);
    await banner.save();

    return toBannerResponse(banner);
  },

  async delete(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BannerNotFoundError();
    }

    const banner = await Banner.findById(id);
    if (!banner) {
      throw new BannerNotFoundError();
    }

    const deletedPosition = banner.position;

    // Delete the banner
    await Banner.findByIdAndDelete(id);

    // Shift all banners after the deleted position up by 1
    await Banner.updateMany({ position: { $gt: deletedPosition } }, { $inc: { position: -1 } });
  },

  async toggleStatus(id: string): Promise<BannerResponse> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BannerNotFoundError();
    }

    const banner = await Banner.findById(id);
    if (!banner) {
      throw new BannerNotFoundError();
    }

    banner.is_active = !banner.is_active;
    await banner.save();

    return toBannerResponse(banner);
  },
};

export default bannerService;
