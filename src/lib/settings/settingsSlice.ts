// settingsSlice.ts
// src/lib/settings/settingsSlice.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import { userSlice } from "../user/userSlice"; // To invalidate User cache

// Define the UserSettings structure based on your Prisma schema
// Ensure ThemePreference enum is available or redefined here if not imported globally
export enum ThemePreference {
  LIGHT = "LIGHT",
  DARK = "DARK",
  CYBERPUNK = "CYBERPUNK",
}

export interface UserSettings {
  id: string;
  theme: ThemePreference;
  notificationsEnabled: boolean;
  emailMarketing: boolean;
  emailSocial: boolean;
  userId: string;
  updatedAt: string; // Or Date
}

interface UpdateSettingsPayload
  extends Partial<Omit<UserSettings, "id" | "userId" | "updatedAt">> {}

interface UpdateSettingsResponse {
  success: boolean;
  message: string;
  settings: UserSettings;
}

export const settingsSlice = createApi({
  reducerPath: "settingsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL, // Your API base URL
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["UserSettings", "User"], // User tag for invalidating getMe

  endpoints: (builder) => ({
    // Optional: If you want a dedicated endpoint to GET settings
    // though useGetMeQuery might already provide this via user.settings
    getUserSettings: builder.query<UserSettings, void>({
      query: () => "/settings", // Assuming GET /api/settings returns current user's settings
      providesTags: ["UserSettings"],
    }),

    updateUserSettings: builder.mutation<
      UpdateSettingsResponse,
      UpdateSettingsPayload
    >({
      query: (settingsData) => ({
        url: "/settings", // Matches PATCH /api/settings in your settings.routes.ts
        method: "PATCH",
        body: settingsData,
      }),
      // After settings are updated, invalidate the 'User' cache for 'ME'
      // This will cause useGetMeQuery to refetch, updating currentUser.settings
      invalidatesTags: (result, error, arg) =>
        result
          ? [{ type: "User", id: "ME" }, "UserSettings"]
          : ["UserSettings"],
      async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
        try {
          await queryFulfilled;
          // Optionally dispatch an action to update settings in authSlice directly for immediate UI update
          // before getMe refetches, though getMe refetch is more robust.
          // Example: dispatch(authSlice.actions.updateUserSettingsInCurrentUser(updatedSettingsData));
          // This would require a new reducer in authSlice.
          // For now, relying on getMe invalidation is cleaner.
        } catch (error) {
          console.error("Failed to update user settings via API:", error);
        }
      },
    }),
  }),
});

export const {
  useGetUserSettingsQuery, // Export if you implement the GET endpoint
  useUpdateUserSettingsMutation,
} = settingsSlice;
