import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { TeamMember, Activity } from "@/types/team";
import { auth } from "@/config/firebase";

export interface Team {
  _id: string;
  name: string;
  description?: string;
  adminId: string;
}

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
  tagTypes: ["Team", "TeamMember"],
  endpoints: (builder) => ({
    getTeams: builder.query<Team[], void>({
      query: () => "/teams",
      providesTags: ["Team"],
    }),
    createTeam: builder.mutation<Team, { name: string; description?: string }>({
      query: (body) => ({
        url: "/teams",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Team"],
    }),
    getTeamMembers: builder.query<TeamMember[], string>({
      query: (teamId) => `/teams/${teamId}/members`,
      providesTags: ["TeamMember"],
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
      invalidatesTags: ["TeamMember"],
    }),
    getActivityLogs: builder.query<Activity[], string>({
      query: (teamId) => `/activity?teamId=${teamId}`,
    }),
    updateMemberRole: builder.mutation<void, { userId: string; role: string }>({
      query: ({ userId, role }) => ({
        url: `/users/${userId}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: ["TeamMember"],
    }),
  }),
});

export const {
  useGetTeamsQuery,
  useCreateTeamMutation,
  useGetTeamMembersQuery,
  useGetActivityLogsQuery,
  useAddTeamMemberMutation,
  useUpdateMemberRoleMutation,
} = teamApi;
