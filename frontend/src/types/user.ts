export type UserRole = "ADMIN" | "MANAGER" | "MEMBER";

export type User = {
  _id: string;
  name: string;
  email: string;
  role?: UserRole;
  teamId?: string;
};