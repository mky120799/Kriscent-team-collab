import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { socket } from "@/socket";
import { auth } from "@/config/firebase";

/**
 * Types
 */
export type Message = {
  _id: string;
  content: string;
  senderId: {
    _id: string;
    name: string;
  };
  createdAt: string;
};

/**
 * RTK Query API
 */
export const messageApi = createApi({
  reducerPath: "messageApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: async (headers) => {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
    credentials: "include",
  }),
  tagTypes: ["Messages"],
  endpoints: (builder) => ({
    /**
     * 1️⃣ Get all messages for the team (teamId comes from auth token)
     */
    getMessages: builder.query<Message[], { teamId: string }>({
      query: () => "/messages",

      async onCacheEntryAdded(
        _,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        // Wait for initial fetch to complete
        await cacheDataLoaded;

        // Socket handler
        const handler = (message: Message) => {
          updateCachedData((draft) => {
            draft.push(message);
          });
        };

        // Subscribe - backend emits "new-message"
        socket.on("new-message", handler);

        // Cleanup on unmount
        await cacheEntryRemoved;
        socket.off("new-message", handler);
      },
    }),

    /**
     * 2️⃣ Send message (HTTP fallback / persistence)
     */
    sendMessage: builder.mutation<Message, { content: string }>({
      query: (body) => ({
        url: "/messages",
        method: "POST",
        body,
      }),
    }),
  }),
});

/**
 * Hooks
 */
export const { useGetMessagesQuery, useSendMessageMutation } = messageApi;
