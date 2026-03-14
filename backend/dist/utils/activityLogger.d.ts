type Params = {
    action: string;
    entity: string;
    entityId?: any;
    performedBy: any;
    teamId: any;
    metadata?: object;
};
export declare const logActivity: ({ action, entity, entityId, performedBy, teamId, metadata, }: Params) => Promise<void>;
export {};
//# sourceMappingURL=activityLogger.d.ts.map