import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { TeamMember, Activity } from "@/types/team";
import { auth } from "@/config/firebase";

export const teamApi = createApi({
  reducerPath: "teamApi",
  baseQuery: fetchBaseQuery({ 
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: async (headers) => {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getTeamMembers: builder.query<TeamMember[], string>({
      query: (teamId) => `/teams/${teamId}/members`,
    }),
    addTeamMember: builder.mutation<
      { message: string; user: TeamMember },
      { teamId: string; userId: string; role?: string }
    >({
      query: ({ teamId, userId, role }) => ({
        url: `/teams/${teamId}/members`,
        method: "POST",
        body: { userId, role },
      }),
    }),
    getActivityLogs: builder.query<Activity[], string>({
      query: (teamId) => `/activity?teamId=${teamId}`,
    }),
  }),
});

export const { useGetTeamMembersQuery, useGetActivityLogsQuery, useAddTeamMemberMutation } = teamApi;