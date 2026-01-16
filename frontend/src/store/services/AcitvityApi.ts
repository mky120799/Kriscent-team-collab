import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface ActivityLog {
  _id: string;
  action: string;
  entity: string;
  metadata: any;
  performedBy: { name: string };
  createdAt: string;
}

export const activityApi = createApi({
  reducerPath: "activityApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL + "/api",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getActivityLogs: builder.query<ActivityLog[], void>({
      query: () => "/activity",
    }),
  }),
});

export const { useGetActivityLogsQuery } = activityApi;
