import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { socket } from "@/socket";

/* =======================
   Types
======================= */

export type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  projectId: string;
  assignedTo?: string;
}

/* =======================
   API
======================= */

export const taskApi = createApi({
  reducerPath: "taskApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL + "/api",
    credentials: "include",
  }),
  tagTypes: ["Task"],
  endpoints: (builder) => ({
    /* -----------------------
       GET TASKS BY PROJECT
    ------------------------ */
    getTasksByProject: builder.query<Task[], string>({
      query: (projectId) => `/tasks?projectId=${projectId}`,

      async onCacheEntryAdded(
        projectId,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        // wait for initial fetch
        await cacheDataLoaded;

        const handler = (updatedTask: Task) => {
          if (updatedTask.projectId !== projectId) return;

          updateCachedData((draft) => {
            const index = draft.findIndex(
              (task) => task._id === updatedTask._id
            );

            if (index !== -1) {
              draft[index] = updatedTask;
            } else {
              draft.push(updatedTask);
            }
          });
        };

        socket.on("task-updated", handler);

        await cacheEntryRemoved;
        socket.off("task-updated", handler);
      },
    }),

    /* -----------------------
       UPDATE TASK STATUS
    ------------------------ */
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

    /* -----------------------
       CREATE TASK
    ------------------------ */
    createTask: builder.mutation<Task, Partial<Task>>({
      query: (body) => ({
        url: "/tasks",
        method: "POST",
        body,
      }),
    }),

    /* -----------------------
       DELETE TASK
    ------------------------ */
    deleteTask: builder.mutation<{ message: string }, string>({
      query: (taskId) => ({
        url: `/tasks/${taskId}`,
        method: "DELETE",
      }),
    }),
  }),
});

/* =======================
   Hooks
======================= */

export const {
  useGetTasksByProjectQuery,
  useUpdateTaskStatusMutation,
  useCreateTaskMutation,
  useDeleteTaskMutation,
} = taskApi;
