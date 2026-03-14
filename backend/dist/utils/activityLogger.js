import { ActivityLog } from "../models/ActivityLog.model.js";
export const logActivity = async ({ action, entity, entityId, performedBy, teamId, metadata, }) => {
    await ActivityLog.create({
        action,
        entity,
        entityId,
        performedBy,
        teamId,
        metadata,
    });
};
//# sourceMappingURL=activityLogger.js.map