// src/lib/user/userSlice.ts

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  setCredentials,
  clearCredentials,
  setCurrentUserFromGetMe,
  updateCurrentUserDetails,
} from "../auth/authSlice"; // Actions from your auth slice
import type { RootState } from "../store"; // Ensure RootState is correctly typed

// --- Interfaces (Ensure these match your actual data structures) ---

interface User {
  id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  role?: string; // Consider using the Role enum if available client-side
  profileImage?: string | null;
  bannerImage?: string | null;
  bio?: string | null;
  settings?: any; // Define more specifically if possible
  createdAt?: string | Date; // Allow Date type too
  updatedAt?: string | Date;
}

// ADDED: Interface for the data structure of a public user profile
export interface PublicUserProfile {
  id: string;
  name?: string | null;
  username?: string | null;
  bio?: string | null;
  profileImage?: string | null;
  bannerImage?: string | null;
  createdAt?: string; // As selected in your backend controller
}

// ADDED: Interface for the raw API response when fetching a public profile
interface GetUserPublicProfileApiResponse {
  success: boolean;
  user: PublicUserProfile;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

interface UpdateProfileResponse {
  success: boolean;
  message: string;
  user: User; // Expect the updated user object back
}

// Define specific DTOs for mutations if possible
interface LoginCredentials {
  email: string;
  password: string;
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// --- API Slice Definition ---

export const userSlice = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState, endpoint }) => {
      if (endpoint !== "updateProfile") {
        const token = (getState() as RootState).auth?.token;
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  // ADDED 'UserProfile' to tagTypes
  tagTypes: ["User", "Auth", "UserPosts", "Projects", "UserProfile"],

  endpoints: (builder) => ({
    // --- Authentication Endpoints ---
    signup: builder.mutation<AuthResponse, Partial<User>>({
      query: (userData) => ({
        url: "/users/signup",
        method: "POST",
        body: userData,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.user && data?.token) {
            dispatch(setCredentials({ user: data.user, token: data.token }));
          }
        } catch (error) {
          console.log("[userSlice signup onQueryStarted] Error:", error);
        }
      },
      invalidatesTags: (result) => (result ? ["Auth"] : []),
    }),

    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: "/users/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.user && data?.token) {
            dispatch(setCredentials({ user: data.user, token: data.token }));
          }
        } catch (error) {
          console.log("[userSlice login onQueryStarted] Error:", error);
        }
      },
      invalidatesTags: (result) =>
        result
          ? [
              "Auth",
              { type: "User", id: "ME" },
              { type: "UserPosts", id: "ME" },
              { type: "Projects", id: "LIST" },
            ]
          : [],
    }),

    logoutUser: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: "/users/logout",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          console.log(
            "[userSlice logoutUser onQueryStarted] Server logout error:",
            error
          );
        } finally {
          dispatch(clearCredentials());
        }
      },
      invalidatesTags: [
        "Auth",
        { type: "User", id: "ME" },
        { type: "UserPosts", id: "ME" },
        { type: "Projects", id: "LIST" },
      ],
    }),

    // --- Current User ("ME") Endpoints ---
    getMe: builder.query<User, void>({
      query: () => "/users/me",
      providesTags: (result) =>
        result
          ? [
              { type: "Auth" },
              { type: "User", id: "ME" },
              { type: "User", id: result.id },
              { type: "UserPosts", id: "ME" },
              { type: "UserPosts", id: result.id },
            ]
          : ["Auth"],
      async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
        try {
          const { data: userFromGetMe } = await queryFulfilled;
          if (userFromGetMe && (getState() as RootState).auth.token) {
            dispatch(setCurrentUserFromGetMe(userFromGetMe));
          }
        } catch (error: any) {
          console.log("[userSlice getMe onQueryStarted] Error:", error);
          const status = error?.error?.status ?? error?.status;
          if (status === 401 || status === 403) {
            dispatch(clearCredentials());
          }
        }
      },
    }),

    updateProfile: builder.mutation<UpdateProfileResponse, FormData>({
      queryFn: async (formData, queryApi, _extraOptions) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = (queryApi.getState() as RootState).auth?.token;
        if (!baseUrl) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "API Base URL is not configured.",
            },
          };
        }
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PATCH", `${baseUrl}/users/me`);
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round(
                (event.loaded / event.total) * 100
              );
              console.log(
                `[userSlice updateProfile] Upload Progress: ${percentComplete}%`
              );
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve({
                  data: JSON.parse(xhr.responseText) as UpdateProfileResponse,
                });
              } catch (e) {
                reject({
                  error: {
                    status: xhr.status,
                    data: "Malformed JSON response",
                  },
                });
              }
            } else {
              try {
                const errorData = JSON.parse(xhr.responseText);
                reject({ error: { status: xhr.status, data: errorData } });
              } catch (e) {
                reject({
                  error: {
                    status: xhr.status,
                    data:
                      xhr.responseText ||
                      `Request failed with status ${xhr.status}`,
                  },
                });
              }
            }
          };
          xhr.onerror = () => {
            reject({
              error: { status: "FETCH_ERROR", error: "Network request failed" },
            });
          };
          xhr.send(formData);
        });
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.user) {
            dispatch(updateCurrentUserDetails(data.user));
          }
        } catch (error) {
          console.log(
            "[userSlice updateProfile onQueryStarted] Query failed:",
            error
          );
        }
      },
      invalidatesTags: (result) =>
        result ? [{ type: "User", id: "ME" }, { type: "Auth" }] : [],
    }),

    changePassword: builder.mutation<
      { message: string },
      ChangePasswordPayload
    >({
      query: (data) => ({
        url: `/users/me/change-password`,
        method: "PATCH",
        body: data,
      }),
    }),

    deleteMyProfile: builder.mutation<
      { success: boolean; message: string },
      void
    >({
      query: () => ({ url: "/users/me", method: "DELETE" }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(clearCredentials());
        } catch (error) {
          console.log(
            "[userSlice deleteMyProfile onQueryStarted] Error:",
            error
          );
        }
      },
      invalidatesTags: [
        "Auth",
        { type: "User", id: "ME" },
        { type: "UserPosts", id: "ME" },
      ],
    }),

    // --- Other User/Profile Endpoints ---
    getUserById: builder.query<User, string>({
      // This is your existing one, returns full User
      query: (userId) => `/users/${userId}`,
      providesTags: (result, error, userId) =>
        result
          ? [
              { type: "User", id: userId },
              { type: "UserPosts", id: userId },
            ]
          : [],
    }),

    // --- NEWLY ADDED ENDPOINT for public profiles ---
    getUserPublicProfile: builder.query<PublicUserProfile, string>({
      query: (userId) => `/users/${userId}/public`, // Ensure this matches your backend route
      transformResponse: (response: GetUserPublicProfileApiResponse) => {
        // Extracts the nested 'user' object from the API response
        // so the component hook gets PublicUserProfile directly.
        console.log(
          "[userSlice] getUserPublicProfile raw API response:",
          response
        );
        return response.user;
      },
      providesTags: (result, error, userId) =>
        result ? [{ type: "UserProfile", id: userId }] : [],
    }),
    // --- END OF NEWLY ADDED ENDPOINT ---

    getUserPosts: builder.query<any[], string>({
      query: (userId) => `/posts?authorId=${userId}`,
      providesTags: (result, error, userId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Projects" as const, id })),
              { type: "UserPosts", id: userId },
            ]
          : [{ type: "UserPosts", id: userId }],
    }),
  }),
});

// Export hooks generated by RTK Query
export const {
  useSignupMutation,
  useLoginMutation,
  useLogoutUserMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useDeleteMyProfileMutation,
  useGetUserByIdQuery, // Your existing hook
  useGetUserPostsQuery,
  useGetUserPublicProfileQuery, // <-- EXPORT FOR THE NEW HOOK
} = userSlice;
