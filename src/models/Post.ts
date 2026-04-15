import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  images: string[];
  category: "EVENT" | "FOOD" | "SPORTS" | "DAYRO" | "OTHER";
  subcategory?: string;
  tags: string[];
  status: "ACTIVE" | "REMOVED";
  eventDate?: Date;
  eventVenue?: string;
  isOngoing: boolean;
  viewCount: number;
  address?: string;
  locationCoordinate?: string;
  authorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    images: { type: [String], default: [] },
    category: { type: String, enum: ["EVENT", "FOOD", "SPORTS", "DAYRO", "OTHER"], required: true },
    subcategory: { type: String, default: null },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ["ACTIVE", "REMOVED"], default: "ACTIVE" },
    eventDate: { type: Date, default: null },
    eventVenue: { type: String, default: null },
    isOngoing: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    address: { type: String, default: null },
    locationCoordinate: { type: String, default: null },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

postSchema.index({ authorId: 1 });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ category: 1 });
postSchema.index({ title: "text", content: "text" });
postSchema.index({ tags: 1 });

export const Post = mongoose.model<IPost>("Post", postSchema);
