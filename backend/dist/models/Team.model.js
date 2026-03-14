import mongoose, { Schema, Document } from "mongoose";
const teamSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
export default mongoose.model("Team", teamSchema);
//# sourceMappingURL=Team.model.js.map