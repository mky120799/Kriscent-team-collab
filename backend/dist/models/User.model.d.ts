import mongoose, { Document } from "mongoose";
export interface IUser extends Document {
    firebaseUid: string;
    email: string;
    name: string;
    role: "ADMIN" | "MANAGER" | "MEMBER";
    teamId?: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, mongoose.DefaultSchemaOptions> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser>;
export default _default;
//# sourceMappingURL=User.model.d.ts.map