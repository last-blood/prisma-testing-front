// src/lib/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { userSlice } from "./user/userSlice";
import { postSlice } from "./post/postSlice";
import authReducer from "./auth/authSlice";
import { settingsSlice } from "./settings/settingsSlice";
import { commentSlice } from "./comments/commentsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [userSlice.reducerPath]: userSlice.reducer,
    [postSlice.reducerPath]: postSlice.reducer,
    [settingsSlice.reducerPath]: settingsSlice.reducer,
    [commentSlice.reducerPath]: commentSlice.reducer, // <<<< ADD commentSlice reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      userSlice.middleware,
      postSlice.middleware,
      settingsSlice.middleware,
      commentSlice.middleware // <<<< ADD commentSlice middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
