import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  content: string;
  senderId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>("Message", MessageSchema);
