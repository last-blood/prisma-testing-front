// src/lib/auth/authSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store"; // Make sure RootState is imported correctly

// Define ThemePreference enum - ensure this matches your Prisma schema and settingsSlice
export enum ThemePreference {
  LIGHT = "LIGHT",
  DARK = "DARK",
  CYBERPUNK = "CYBERPUNK",
  SYSTEM = "SYSTEM",
}

// Define the structure of user settings data within the AuthUser
export interface UserSettingsData {
  theme: ThemePreference;
  notificationsEnabled: boolean;
  emailMarketing: boolean;
  emailSocial: boolean;
}

// Define the interface for the user object stored in the auth state
interface AuthUser {
  id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  profileImage?: string | null;
  bannerImage?: string | null;
  bio?: string | null;
  settings?: UserSettingsData | null; // Use the specific UserSettingsData type
}

// Define the interface for the authentication state
interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
}

// Helper to provide default settings
const getDefaultUserSettings = (): UserSettingsData => ({
  theme: ThemePreference.DARK,
  notificationsEnabled: true,
  emailMarketing: false,
  emailSocial: true,
});

// Function to load initial state from localStorage
const loadInitialState = (): AuthState => {
  let token: string | null = null;
  let user: AuthUser | null = null;

  if (typeof window !== "undefined") {
    token = localStorage.getItem("authToken");
    const storedUserString = localStorage.getItem("authUser");
    if (storedUserString) {
      try {
        const parsedUser = JSON.parse(storedUserString) as AuthUser;
        // Ensure settings are initialized with defaults if missing or incomplete
        if (
          parsedUser.settings &&
          typeof parsedUser.settings.theme !== "undefined"
        ) {
          parsedUser.settings = {
            ...getDefaultUserSettings(),
            ...parsedUser.settings,
          };
        } else {
          // If settings is null, undefined, or incomplete from storage, initialize with defaults
          parsedUser.settings = getDefaultUserSettings();
        }
        user = parsedUser;
      } catch (e) {
        console.error(
          "[authSlice loadInitialState] Failed to parse stored user:",
          e
        );
        localStorage.removeItem("authUser");
        localStorage.removeItem("authToken");
        token = null;
      }
    }
  }

  const initialStateResult: AuthState = {
    token: token,
    currentUser: user,
    isAuthenticated: !!token && !!user,
  };

  console.log("[authSlice loadInitialState] Initial state loaded:", {
    tokenExists: !!initialStateResult.token,
    userExists: !!initialStateResult.currentUser,
    isAuthenticated: initialStateResult.isAuthenticated,
    settings: initialStateResult.currentUser?.settings,
  });

  return initialStateResult;
};

const initialState: AuthState = loadInitialState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; token: string }>
    ) => {
      const { user: incomingUser, token } = action.payload;

      // Create a new user object for the state, merging incoming user with default settings
      const userForState: AuthUser = {
        ...incomingUser, // Spread incoming user data first
        settings: {
          // Then define settings, ensuring defaults
          ...getDefaultUserSettings(),
          ...(incomingUser.settings || {}), // Override defaults with any settings from payload
        },
      };

      state.currentUser = userForState;
      state.token = token;
      state.isAuthenticated = true;

      console.log("[authSlice setCredentials] State updated:", {
        userId: userForState.id,
        tokenExists: !!token,
        isAuthenticated: state.isAuthenticated,
        settings: userForState.settings,
      });

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("authToken", token);
          localStorage.setItem("authUser", JSON.stringify(userForState)); // Store the augmented user
          console.log(
            "[authSlice setCredentials] authToken and authUser set in localStorage."
          );
        } catch (e) {
          console.error(
            "[authSlice setCredentials] Error setting localStorage:",
            e
          );
        }
      }
    },
    clearCredentials: (state) => {
      state.currentUser = null;
      state.token = null;
      state.isAuthenticated = false;

      console.log("[authSlice clearCredentials] State cleared.");

      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        console.log(
          "[authSlice clearCredentials] authToken and authUser removed from localStorage."
        );
      }
    },
    setCurrentUserFromGetMe: (state, action: PayloadAction<AuthUser>) => {
      const userFromGetMe = action.payload;

      // Ensure settings object has defaults or merges correctly
      const mergedSettings = {
        ...getDefaultUserSettings(),
        ...(state.currentUser?.settings || {}), // Persist any existing client-side settings not overwritten
        ...(userFromGetMe.settings || {}), // Apply settings from getMe payload
      };

      const updatedUser: AuthUser = {
        ...(state.currentUser || {}), // Persist other existing currentUser fields if any
        ...userFromGetMe, // Apply all fields from getMe payload
        settings: mergedSettings, // Set the carefully merged settings
      };

      state.currentUser = updatedUser;

      if (state.token) {
        // Re-affirm authentication status if token exists from a previous session
        state.isAuthenticated = true;
        if (typeof window !== "undefined" && state.currentUser) {
          localStorage.setItem("authUser", JSON.stringify(state.currentUser));
          console.log(
            "[authSlice setCurrentUserFromGetMe] Updated localStorage authUser."
          );
        }
      } else {
        // This means getMe succeeded (e.g. cookie auth) but no token was in Redux state yet.
        // Depending on app logic, you might set isAuthenticated based on currentUser existence.
        // For now, if token is missing in Redux state, isAuthenticated remains false or becomes true based on currentUser
        state.isAuthenticated = !!state.currentUser;
        if (!state.isAuthenticated) {
          console.warn(
            "[authSlice setCurrentUserFromGetMe] Token missing in Redux state. User data received but isAuthenticated may be false if token isn't set elsewhere."
          );
        }
      }
      console.log(
        "[authSlice setCurrentUserFromGetMe] Current user updated. IsAuthenticated:",
        state.isAuthenticated,
        "Settings:",
        state.currentUser?.settings
      );
    },
    updateCurrentUserDetails: (
      state,
      action: PayloadAction<Partial<AuthUser>>
    ) => {
      if (state.currentUser) {
        const payloadSettings = action.payload.settings;
        // Create a new object for the merged user to avoid direct state mutation outside of Immer's draft
        let updatedUserDetails = { ...state.currentUser, ...action.payload };

        // If settings are part of the payload, merge them carefully
        if (payloadSettings) {
          updatedUserDetails.settings = {
            ...(state.currentUser.settings || getDefaultUserSettings()), // Ensure current settings exist or use defaults
            ...payloadSettings, // Apply updates from payload's settings
          };
        } else if (!state.currentUser.settings) {
          // If current user has no settings object at all, initialize it
          updatedUserDetails.settings = getDefaultUserSettings();
        }
        // Assign the fully constructed new object to the state draft
        state.currentUser = updatedUserDetails;

        if (typeof window !== "undefined") {
          localStorage.setItem("authUser", JSON.stringify(state.currentUser));
          console.log(
            "[authSlice updateCurrentUserDetails] User details updated in state and localStorage. Settings:",
            state.currentUser.settings
          );
        }
      } else {
        console.warn(
          "[authSlice updateCurrentUserDetails] Cannot update user details, currentUser is null."
        );
      }
    },
  },
});

export const {
  setCredentials,
  clearCredentials,
  setCurrentUserFromGetMe,
  updateCurrentUserDetails,
} = authSlice.actions;

export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectCurrentUser = (state: RootState) => state.auth.currentUser;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectCurrentUserId = (state: RootState): string | undefined =>
  state.auth.currentUser?.id;

// Selector for user settings with defaults
export const selectCurrentUserSettings = (
  state: RootState
): UserSettingsData => {
  return state.auth.currentUser?.settings || getDefaultUserSettings();
};

export default authSlice.reducer;
