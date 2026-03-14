import mongoose, { Schema, Document } from "mongoose";
const projectSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
}, { timestamps: true });
export default mongoose.model("Project", projectSchema);
//# sourceMappingURL=Project.model.js.map