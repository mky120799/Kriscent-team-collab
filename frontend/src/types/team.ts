export type TeamMember = {
  _id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "MEMBER";
};

export type Activity = {
  _id: string;
  action: string;
  entity: string;
  entityId?: string;
  performedBy?: { _id: string; name: string; email: string };
  teamId?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
};
