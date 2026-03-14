import mongoose, { Schema, Document } from "mongoose";
const MessageSchema = new Schema({
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
}, { timestamps: true });
export default mongoose.model("Message", MessageSchema);
//# sourceMappingURL=Message.model.js.map