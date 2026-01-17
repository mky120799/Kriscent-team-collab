import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth.slice";
import { taskApi } from "./services/task.api";
import { messageApi } from "./services/message.api";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [taskApi.reducerPath]: taskApi.reducer,
    [messageApi.reducerPath]: messageApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(taskApi.middleware, messageApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
