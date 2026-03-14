import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { auth } from "@/config/firebase";
import type { User } from "@/types/user";

export const userApi = createApi({
  reducerPath: "userApi",
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
    getUsersByProject: builder.query<User[], string>({
      query: (projectId) => `/users?projectId=${projectId}`,
    }),
    searchUsers: builder.query<User[], string>({
      query: (search) => `/users?search=${search}`,
    }),
  }),
});

export const { useGetUsersByProjectQuery, useSearchUsersQuery } = userApi;