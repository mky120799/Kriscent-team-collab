import mongoose, { Document } from "mongoose";
export interface IProject extends Document {
    name: string;
    description?: string;
    teamId: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<IProject, {}, {}, {}, mongoose.Document<unknown, {}, IProject, {}, mongoose.DefaultSchemaOptions> & IProject & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IProject>;
export default _default;
//# sourceMappingURL=Project.model.d.ts.map