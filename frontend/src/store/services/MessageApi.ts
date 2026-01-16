import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { socket } from "@/socket";

export interface Message {
  _id: string;
  content: string;
  senderId: string;
  teamId: string;
  createdAt: string;
}

export const messageApi = createApi({
  reducerPath: "messageApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL + "/api",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getMessages: builder.query<Message[], string>({
      query: (teamId) => `/messages?teamId=${teamId}`,

      async onCacheEntryAdded(
        teamId,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        await cacheDataLoaded;

        const handler = (message: Message) => {
          if (message.teamId === teamId) {
            updateCachedData((draft) => {
              draft.push(message);
            });
          }
        };

        socket.on("message:new", handler);

        await cacheEntryRemoved;
        socket.off("message:new", handler);
      },
    }),

    sendMessage: builder.mutation<Message, Partial<Message>>({
      query: (body) => ({
        url: "/messages",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useGetMessagesQuery, useSendMessageMutation } = messageApi;
