import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginUser, type AuthUser } from "@/services/auth.service";
import { auth } from "@/config/firebase";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      return await loginUser({ email, password });
    } catch {
      return rejectWithValue("Invalid credentials");
    }
  },
);

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  await auth.signOut();
  localStorage.removeItem("token");
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // We can keep a simple logout for immediate UI feedback if needed
    // but the Thunk will handle the side effects
    clearUser: (state) => {
      state.user = null;
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
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { clearUser } = authSlice.actions;
export default authSlice.reducer;
