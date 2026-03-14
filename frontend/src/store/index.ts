import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth.slice";
import { taskApi } from "./services/task.api";
import { messageApi } from "./services/message.api";
import { projectApi } from "./services/project.api";
import { teamApi } from "./services/team.api";
import { userApi } from "./services/user.api";
import { activityApi } from "./services/activity.api";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [taskApi.reducerPath]: taskApi.reducer,
    [messageApi.reducerPath]: messageApi.reducer,
    [projectApi.reducerPath]: projectApi.reducer,
    [teamApi.reducerPath]: teamApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [activityApi.reducerPath]: activityApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(taskApi.middleware)
      .concat(messageApi.middleware)
      .concat(projectApi.middleware)
      .concat(teamApi.middleware)
      .concat(userApi.middleware)
      .concat(activityApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Optional: typed hooks
import { type TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;