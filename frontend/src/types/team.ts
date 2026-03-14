export type TeamMember = {
  _id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "MEMBER";
};

export type Activity = {
  _id: string;
  message: string;
  timestamp: string;
};