import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { socket } from "@/socket";
import { auth } from "@/config/firebase";
import { API_BASE_URL } from "@/config/api";

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
  teamId: string;
  createdAt: string;
};

/**
 * RTK Query API
 */
export const messageApi = createApi({
  reducerPath: "messageApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
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
    getMessages: builder.query<Message[], { teamId: string }>({
      query: ({ teamId }) => `/messages?teamId=${teamId}`,

      async onCacheEntryAdded(
        { teamId: currentTeamId },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        await cacheDataLoaded;

        const handler = (message: Message) => {
          // Verify if message belongs to current team room
          if (message.teamId !== currentTeamId) return;

          updateCachedData((draft) => {
            if (!draft.find((m) => m._id === message._id)) {
              draft.push(message);
            }
          });
        };

        socket.on("new-message", handler);

        await cacheEntryRemoved;
        socket.off("new-message", handler);
      },
    }),

    sendMessage: builder.mutation<Message, { content: string; teamId: string }>(
      {
        query: (body) => ({
          url: "/messages",
          method: "POST",
          body,
        }),
      },
    ),
  }),
});

/**
 * Hooks
 */
export const { useGetMessagesQuery, useSendMessageMutation } = messageApi;
