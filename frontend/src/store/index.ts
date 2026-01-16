import { configureStore } from "@reduxjs/toolkit";
import { messageApi } from "./services/MessageApi";
import { taskApi } from "./services/TaskApi";
// import other reducers if any

export const store = configureStore({
  reducer: {
    [messageApi.reducerPath]: messageApi.reducer,
    [taskApi.reducerPath]: taskApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(messageApi.middleware, taskApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
