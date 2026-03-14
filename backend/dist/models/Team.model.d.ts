import mongoose, { Document } from "mongoose";
export interface ITeam extends Document {
    name: string;
    description?: string;
    adminId: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<ITeam, {}, {}, {}, mongoose.Document<unknown, {}, ITeam, {}, mongoose.DefaultSchemaOptions> & ITeam & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ITeam>;
export default _default;
//# sourceMappingURL=Team.model.d.ts.map