import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "MEMBER";
  teamId?: mongoose.Types.ObjectId;
}

const userSchema = new Schema<IUser>(
  {
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["ADMIN", "MANAGER", "MEMBER"],
      default: "MEMBER",
    },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
