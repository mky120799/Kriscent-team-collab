import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  content: string;
  senderId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  timestamp: Date;
}

const messageSchema = new Schema<IMessage>({
  content: { type: String, required: true },
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
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<IMessage>("Message", messageSchema);
