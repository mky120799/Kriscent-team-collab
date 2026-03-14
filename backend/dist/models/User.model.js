import mongoose, { Document, Schema } from "mongoose";
const userSchema = new Schema({
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: {
        type: String,
        enum: ["ADMIN", "MANAGER", "MEMBER"],
        default: "MEMBER",
    },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
}, { timestamps: true });
export default mongoose.model("User", userSchema);
//# sourceMappingURL=User.model.js.map