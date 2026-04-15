import mongoose, { Schema, Document } from "mongoose";

export interface IReport extends Document {
  _id: mongoose.Types.ObjectId;
  reason?: string;
  userId: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reason: { type: String, default: null },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

reportSchema.index({ userId: 1, postId: 1 }, { unique: true });
reportSchema.index({ postId: 1 });

export const Report = mongoose.model<IReport>("Report", reportSchema);
