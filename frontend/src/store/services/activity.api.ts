import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { auth } from "@/config/firebase";

export interface ActivityLog {
  _id: string;
  action: string;
  entity: string;
  metadata: Record<string, unknown>;
  performedBy: { name: string };
  createdAt: string;
}

export const activityApi = createApi({
  reducerPath: "activityApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: async (headers) => {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getActivityLogs: builder.query<ActivityLog[], void>({
      query: () => "/activity",
    }),
  }),
});

export const { useGetActivityLogsQuery } = activityApi;
