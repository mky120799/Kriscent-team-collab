import mongoose, { Document } from "mongoose";
export interface ITask extends Document {
    title: string;
    description?: string;
    status: "todo" | "in-progress" | "done";
    projectId: mongoose.Types.ObjectId;
    assignedTo?: mongoose.Types.ObjectId;
    teamId: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<ITask, {}, {}, {}, mongoose.Document<unknown, {}, ITask, {}, mongoose.DefaultSchemaOptions> & ITask & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ITask>;
export default _default;
//# sourceMappingURL=Task.model.d.ts.map