import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { socket } from "@/socket";

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
    baseUrl: "http://localhost:5555/api",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Messages"],
  endpoints: (builder) => ({
    /**
     * 1️⃣ Get all messages for the team
     */
    getMessages: builder.query<Message[], void>({
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

        // Subscribe
        socket.on("message:new", handler);

        // Cleanup on unmount
        await cacheEntryRemoved;
        socket.off("message:new", handler);
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
