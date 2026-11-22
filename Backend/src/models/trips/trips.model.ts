import { Schema, model, Document } from "mongoose";

interface ITrip extends Document {
  host_id: Schema.Types.ObjectId;
  title: string;
  description: string;
  duration_days: number;
  duration_nights: number;
  start_location: string;
  end_location: string;
  pickup_locations: string[];
  route_summary: string;
  base_price: number;
  tax_included: boolean;
  trip_tags: string[];
  destination: string[];
  about_trip: string;
  additional_message: string;
  trip_request_description: string;
  status:
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "CHANGES_REQUESTED"
    | "REJECTED"
    | "PUBLISHED"
    | "ARCHIVED";
  approval_requests_left: number;
  is_featured: boolean;
  is_deleted: boolean;
}

const tripSchema = new Schema<ITrip>(
  {
    host_id: {
      type: Schema.Types.ObjectId,
      ref: "hosts",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration_days: {
      type: Number,
      required: true,
    },
    duration_nights: {
      type: Number,
      required: true,
    },
    start_location: {
      type: String,
      required: true,
    },
    end_location: {
      type: String,
      required: true,
    },
    pickup_locations: {
      type: Schema.Types.Mixed,
      default: [],
    },
    route_summary: {
      type: String,
      required: true,
    },
    base_price: {
      type: Number,
      required: true,
    },
    tax_included: {
      type: Boolean,
      default: false,
    },
    trip_tags: {
      type: Schema.Types.Mixed,
      default: [],
    },
    destination: {
      type: Schema.Types.Mixed,
      default: [],
    },
    about_trip: {
      type: String,
    },
    additional_message: {
      type: String,
    },
    trip_request_description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PENDING_APPROVAL", "CHANGES_REQUESTED", "REJECTED", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
    },
    approval_requests_left: {
      type: Number,
      default: 0,
    },
    is_featured: {
      type: Boolean,
      default: false,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Trip = model<ITrip>("trips", tripSchema);
