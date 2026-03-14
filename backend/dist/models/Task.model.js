import mongoose, { Schema, Document } from "mongoose";
const taskSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: {
        type: String,
        enum: ["todo", "in-progress", "done"],
        default: "todo",
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
}, { timestamps: true });
export default mongoose.model("Task", taskSchema);
//# sourceMappingURL=Task.model.js.map