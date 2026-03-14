import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { socket } from "@/socket";
import { auth } from "@/config/firebase";

/* =======================
   Types
======================= */

export type TaskStatus = "todo" | "in-progress" | "done";

export interface UserSubset {
  _id: string;
  name: string;
  email: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  projectId: string;
  assignedTo?: string | UserSubset;
}

/* =======================
   API
======================= */

export const taskApi = createApi({
  reducerPath: "taskApi",
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
  tagTypes: ["Task"],
  endpoints: (builder) => ({
    getTasksByProject: builder.query<Task[], string>({
      query: (projectId) => `/tasks?projectId=${projectId}`,
      async onCacheEntryAdded(
        projectId,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        await cacheDataLoaded;
        const handler = (updatedTask: Task) => {
          if (updatedTask.projectId !== projectId) return;
          updateCachedData((draft) => {
            const index = draft.findIndex((t) => t._id === updatedTask._id);
            if (index !== -1) draft[index] = updatedTask;
            else draft.push(updatedTask);
          });
        };
        socket.on("task-updated", handler);
        await cacheEntryRemoved;
        socket.off("task-updated", handler);
      },
    }),
    updateTask: builder.mutation<
      Task,
      { taskId: string; payload: Partial<Task> }
    >({
      query: ({ taskId, payload }) => ({
        url: `/tasks/${taskId}`,
        method: "PUT",
        body: payload,
      }),
    }),
    updateTaskStatus: builder.mutation<
      Task,
      { taskId: string; status: TaskStatus }
    >({
      query: ({ taskId, status }) => ({
        url: `/tasks/${taskId}`,
        method: "PUT",
        body: { status },
      }),
    }),
    createTask: builder.mutation<Task, Partial<Task>>({
      query: (body) => ({
        url: "/tasks",
        method: "POST",
        body,
      }),
    }),
    deleteTask: builder.mutation<{ message: string }, string>({
      query: (taskId) => ({
        url: `/tasks/${taskId}`,
        method: "DELETE",
      }),
    }),
    parseAssistantCommand: builder.mutation<
      {
        action: "create" | "update" | null;
        title?: string;
        status?: TaskStatus;
      },
      { prompt: string }
    >({
      query: (body) => ({
        url: "/assistant/parse",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetTasksByProjectQuery,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useParseAssistantCommandMutation,
} = taskApi;
