import mongoose, { Schema, Document } from "mongoose";

export interface ITeam extends Document {
  name: string;
  description?: string;
  adminId: mongoose.Types.ObjectId;
}

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true },
    description: { type: String },
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ITeam>("Team", teamSchema);
