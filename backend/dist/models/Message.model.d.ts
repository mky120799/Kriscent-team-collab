import mongoose, { Document } from "mongoose";
export interface IMessage extends Document {
    content: string;
    senderId: mongoose.Types.ObjectId;
    teamId: mongoose.Types.ObjectId;
    createdAt: Date;
}
declare const _default: mongoose.Model<IMessage, {}, {}, {}, mongoose.Document<unknown, {}, IMessage, {}, mongoose.DefaultSchemaOptions> & IMessage & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IMessage>;
export default _default;
//# sourceMappingURL=Message.model.d.ts.map