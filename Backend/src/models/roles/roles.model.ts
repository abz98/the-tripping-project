import { Schema, model, Document } from "mongoose";

interface IRole extends Document {
  name: string;
  permissions: Record<string, unknown>;
  is_active: boolean;
}

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    permissions: {
      type: Schema.Types.Mixed,
      required: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Role = model<IRole>("Role", roleSchema);
