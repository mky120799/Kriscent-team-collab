import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getMe,
  loginUser,
  registerUser,
  type AuthUser,
} from "@/services/auth.service";
import { auth } from "@/config/firebase";
import { messageApi } from "../services/message.api";
import { taskApi } from "../services/task.api";
import { projectApi } from "../services/project.api";
import { teamApi } from "../services/team.api";
import { userApi } from "../services/user.api";
import { activityApi } from "../services/activity.api";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
};

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  isInitialized: false,
};

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const user = await loginUser({ email, password });
      const token = await auth.currentUser?.getIdToken();
      if (token) localStorage.setItem("token", token);
      return user;
    } catch {
      return rejectWithValue("Invalid credentials");
    }
  },
);

export const registerThunk = createAsyncThunk(
  "auth/register",
  async (
    data: { name: string; email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const user = await registerUser(data);
      const token = await auth.currentUser?.getIdToken();
      if (token) localStorage.setItem("token", token);
      return user;
    } catch (err: any) {
      return rejectWithValue(err.message || "Registration failed");
    }
  },
);

export const rehydrateUser = createAsyncThunk(
  "auth/rehydrate",
  async (_, { rejectWithValue }) => {
    try {
      const user = await getMe();
      const token = await auth.currentUser?.getIdToken();
      if (token) localStorage.setItem("token", token);
      return user;
    } catch (err) {
      return rejectWithValue("Not logged in");
    }
  },
);

export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    await auth.signOut();
    localStorage.removeItem("token");

    // Clear all RTK Query Caches to prevent identity leaking between sessions
    dispatch(messageApi.util.resetApiState());
    dispatch(taskApi.util.resetApiState());
    dispatch(projectApi.util.resetApiState());
    dispatch(teamApi.util.resetApiState());
    dispatch(userApi.util.resetApiState());
    dispatch(activityApi.util.resetApiState());
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearUser: (state) => {
      state.user = null;
      state.isInitialized = true;
    },
    setInitialized: (state, action: { payload: boolean }) => {
      state.isInitialized = action.payload;
    },
    updateUserName: (state, action: { payload: string }) => {
      if (state.user) {
        state.user.name = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isInitialized = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(rehydrateUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isInitialized = true;
      })
      .addCase(rehydrateUser.rejected, (state) => {
        state.isInitialized = true;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(registerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isInitialized = true;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearUser, updateUserName, setInitialized } = authSlice.actions;
export default authSlice.reducer;
