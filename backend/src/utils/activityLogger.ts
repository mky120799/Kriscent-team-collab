import { ActivityLog } from "../models/ActivityLog.model.js";

type Params = {
  action: string;
  entity: string;
  entityId?: any;
  performedBy: any;
  teamId: any;
  metadata?: object;
};

export const logActivity = async ({
  action,
  entity,
  entityId,
  performedBy,
  teamId,
  metadata,
}: Params) => {
  await ActivityLog.create({
    action,
    entity,
    entityId,
    performedBy,
    teamId,
    metadata,
  });
};
