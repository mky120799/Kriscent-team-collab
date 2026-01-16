import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    entity: { type: String, required: true }, // TASK, PROJECT, MESSAGE
    entityId: { type: mongoose.Schema.Types.ObjectId },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    metadata: { type: Object },
  },
  { timestamps: true }
);

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
