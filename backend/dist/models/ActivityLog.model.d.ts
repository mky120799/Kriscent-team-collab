import mongoose from "mongoose";
export declare const ActivityLog: mongoose.Model<{
    action: string;
    entity: string;
    teamId?: mongoose.Types.ObjectId | null;
    entityId?: mongoose.Types.ObjectId | null;
    performedBy?: mongoose.Types.ObjectId | null;
    metadata?: any;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    action: string;
    entity: string;
    teamId?: mongoose.Types.ObjectId | null;
    entityId?: mongoose.Types.ObjectId | null;
    performedBy?: mongoose.Types.ObjectId | null;
    metadata?: any;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    action: string;
    entity: string;
    teamId?: mongoose.Types.ObjectId | null;
    entityId?: mongoose.Types.ObjectId | null;
    performedBy?: mongoose.Types.ObjectId | null;
    metadata?: any;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    action: string;
    entity: string;
    teamId?: mongoose.Types.ObjectId | null;
    entityId?: mongoose.Types.ObjectId | null;
    performedBy?: mongoose.Types.ObjectId | null;
    metadata?: any;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    action: string;
    entity: string;
    teamId?: mongoose.Types.ObjectId | null;
    entityId?: mongoose.Types.ObjectId | null;
    performedBy?: mongoose.Types.ObjectId | null;
    metadata?: any;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, mongoose.ResolveSchemaOptions<{
    timestamps: true;
}>> & Omit<{
    action: string;
    entity: string;
    teamId?: mongoose.Types.ObjectId | null;
    entityId?: mongoose.Types.ObjectId | null;
    performedBy?: mongoose.Types.ObjectId | null;
    metadata?: any;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    [path: string]: mongoose.SchemaDefinitionProperty<undefined, any, any>;
} | {
    [x: string]: mongoose.SchemaDefinitionProperty<any, any, mongoose.Document<unknown, {}, {
        action: string;
        entity: string;
        teamId?: mongoose.Types.ObjectId | null;
        entityId?: mongoose.Types.ObjectId | null;
        performedBy?: mongoose.Types.ObjectId | null;
        metadata?: any;
    } & mongoose.DefaultTimestampProps, {
        id: string;
    }, mongoose.ResolveSchemaOptions<{
        timestamps: true;
    }>> & Omit<{
        action: string;
        entity: string;
        teamId?: mongoose.Types.ObjectId | null;
        entityId?: mongoose.Types.ObjectId | null;
        performedBy?: mongoose.Types.ObjectId | null;
        metadata?: any;
    } & mongoose.DefaultTimestampProps & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, {
    action: string;
    entity: string;
    teamId?: mongoose.Types.ObjectId | null;
    entityId?: mongoose.Types.ObjectId | null;
    performedBy?: mongoose.Types.ObjectId | null;
    metadata?: any;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    action: string;
    entity: string;
    teamId?: mongoose.Types.ObjectId | null;
    entityId?: mongoose.Types.ObjectId | null;
    performedBy?: mongoose.Types.ObjectId | null;
    metadata?: any;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=ActivityLog.model.d.ts.map