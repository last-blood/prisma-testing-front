// src/lib/post/postSlice.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store"; // Adjust path to your Redux store

// --- Type Definitions ---

interface BackendAuthor {
  id: string;
  name: string | null;
  profileImage?: string | null;
  email?: string | null;
  username?: string | null;
}

export interface BackendPost {
  id: string;
  title: string;
  description: string;
  content: string;
  postImages: string[];
  postTags: string[];
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: BackendAuthor;
  likesCount?: number;
  viewsCount?: number; // Already here, good!
  savedCount?: number;
  sharesCount?: number;
  commentsCount?: number;
}

interface GetAllPostsResponse {
  success: boolean;
  posts: BackendPost[];
}

interface GetPostByIdResponse {
  success: boolean;
  post: BackendPost;
}

interface CreatePostResponse {
  success: boolean;
  message: string;
  newPost: BackendPost;
}

interface UpdatePostResponse {
  success: boolean;
  message: string;
  post: BackendPost;
}

interface UpdatePostPayload {
  postId: string;
  formData: FormData;
}

interface DeletePostResponse {
  success: boolean;
  message: string;
}

export interface GetAllPostsParams {
  search?: string;
  dateFilter?: string;
  tag?: string;
  authorId?: string;
}

interface PostSaveRecord {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
}

interface SavePostResponse {
  success: boolean;
  message: string;
  postSave: PostSaveRecord;
  savedCount: number;
}

interface UnsavePostResponse {
  success: boolean;
  message: string;
  savedCount: number;
}

interface GetMySavedPostsApiResponse {
  success: boolean;
  posts: BackendPost[];
}

interface PostLikeRecord {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
}

interface LikePostResponse {
  success: boolean;
  message: string;
  postLike: PostLikeRecord;
  likesCount: number;
}

interface UnlikePostResponse {
  success: boolean;
  message: string;
  likesCount: number;
}

interface GetMyLikedPostsApiResponse {
  success: boolean;
  posts: BackendPost[];
}

export type SharePlatformValue =
  | "TWITTER"
  | "FACEBOOK"
  | "LINKEDIN"
  | "EMAIL"
  | "WHATSAPP"
  | "REDDIT"
  | "LINK_COPIED"
  | "INTERNAL_MESSAGE"
  | "OTHER";

interface PostShareRecord {
  id: string;
  postId: string;
  sharerId: string;
  platform: SharePlatformValue;
  createdAt: string;
}

interface SharePostMutationArg {
  postId: string;
  platform: SharePlatformValue;
}

interface SharePostResponse {
  success: boolean;
  message: string;
  postShare: PostShareRecord;
  sharesCount: number;
}

// --- NEW Types for Recording Post View ---
interface RecordPostViewResponse {
  success: boolean;
  message: string;
  postViewId: string;
  userSpecificViewCount: number;
  lastViewedAt: string; // Date will be stringified from backend
  totalUniqueViews: number; // This is the updated Post.viewsCount
}

// --- API Slice Definition ---

export const postSlice = createApi({
  reducerPath: "postApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth?.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    "Projects",
    "UserPosts",
    "User",
    "Post",
    "SavedPosts",
    "LikedPosts",
  ],

  endpoints: (builder) => ({
    createPost: builder.mutation<CreatePostResponse, FormData>({
      query: (formData) => ({
        url: "/posts",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result) =>
        result ? [{ type: "Projects", id: "LIST" }, "UserPosts"] : [],
    }),

    getAllPosts: builder.query<BackendPost[], GetAllPostsParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          if (params.search) queryParams.append("search", params.search);
          if (params.dateFilter)
            queryParams.append("dateFilter", params.dateFilter);
          if (params.tag) queryParams.append("tag", params.tag);
          if (params.authorId) queryParams.append("authorId", params.authorId);
        }
        const queryString = queryParams.toString();
        return `/posts${queryString ? `?${queryString}` : ""}`;
      },
      transformResponse: (response: GetAllPostsResponse) => response.posts,
      providesTags: (result, error, arg) => {
        const params = arg as GetAllPostsParams | void;
        const tags: any[] = [{ type: "Projects", id: "LIST" }];
        if (result) {
          result.forEach(({ id }) => tags.push({ type: "Projects", id }));
        }
        if (params && params.authorId) {
          tags.push({ type: "UserPosts", id: params.authorId });
        }
        return tags;
      },
    }),

    getPostById: builder.query<BackendPost, string>({
      query: (postId) => `/posts/${postId}`,
      transformResponse: (response: GetPostByIdResponse) => response.post,
      providesTags: (result, error, postId) =>
        result
          ? [
              { type: "Post", id: postId },
              { type: "Projects", id: postId },
            ]
          : [],
    }),

    updatePost: builder.mutation<UpdatePostResponse, UpdatePostPayload>({
      query: ({ postId, formData }) => ({
        url: `/posts/${postId}`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: (result, error, { postId }) => [
        { type: "Post", id: postId },
        { type: "Projects", id: postId },
        { type: "Projects", id: "LIST" },
        "UserPosts",
      ],
    }),

    deletePost: builder.mutation<DeletePostResponse, string>({
      query: (postId) => ({
        url: `/posts/${postId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, postId) => [
        { type: "Post", id: postId },
        { type: "Projects", id: postId },
        { type: "Projects", id: "LIST" },
        "UserPosts",
        "SavedPosts",
        "LikedPosts",
      ],
    }),

    savePost: builder.mutation<SavePostResponse, string>({
      query: (postId) => ({
        url: `/posts/${postId}/save`,
        method: "POST",
      }),
      invalidatesTags: (result, error, postId) =>
        result
          ? [
              { type: "Post", id: postId },
              { type: "Projects", id: postId },
              "SavedPosts",
            ]
          : [],
      async onQueryStarted(postId, { dispatch, queryFulfilled, getState }) {
        try {
          const { data: saveData } = await queryFulfilled;
          dispatch(
            postSlice.util.updateQueryData(
              "getPostById",
              postId,
              (draftPost) => {
                if (draftPost) draftPost.savedCount = saveData.savedCount;
              }
            )
          );
          const currentParams = (getState() as RootState).postApi.queries[
            `getAllPosts(undefined)`
          ]?.originalArgs as GetAllPostsParams | void;
          dispatch(
            postSlice.util.updateQueryData(
              "getAllPosts",
              currentParams || undefined,
              (draftList) => {
                const post = draftList.find((p) => p.id === postId);
                if (post) post.savedCount = saveData.savedCount;
              }
            )
          );
          const currentUserId = (getState() as RootState).auth.currentUser?.id;
          if (currentUserId) {
            const userPostsParams = (getState() as RootState).postApi.queries[
              `getAllPosts({"authorId":"${currentUserId}"})`
            ]?.originalArgs as GetAllPostsParams | void;
            dispatch(
              postSlice.util.updateQueryData(
                "getAllPosts",
                userPostsParams || { authorId: currentUserId },
                (draftList) => {
                  const post = draftList.find((p) => p.id === postId);
                  if (post) post.savedCount = saveData.savedCount;
                }
              )
            );
          }
        } catch {}
      },
    }),

    unsavePost: builder.mutation<UnsavePostResponse, string>({
      query: (postId) => ({
        url: `/posts/${postId}/save`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, postId) =>
        result
          ? [
              { type: "Post", id: postId },
              { type: "Projects", id: postId },
              "SavedPosts",
            ]
          : [],
      async onQueryStarted(postId, { dispatch, queryFulfilled, getState }) {
        try {
          const { data: unsaveData } = await queryFulfilled;
          dispatch(
            postSlice.util.updateQueryData(
              "getPostById",
              postId,
              (draftPost) => {
                if (draftPost) draftPost.savedCount = unsaveData.savedCount;
              }
            )
          );
          const currentParams = (getState() as RootState).postApi.queries[
            `getAllPosts(undefined)`
          ]?.originalArgs as GetAllPostsParams | void;
          dispatch(
            postSlice.util.updateQueryData(
              "getAllPosts",
              currentParams || undefined,
              (draftList) => {
                const post = draftList.find((p) => p.id === postId);
                if (post) post.savedCount = unsaveData.savedCount;
              }
            )
          );
          const currentUserId = (getState() as RootState).auth.currentUser?.id;
          if (currentUserId) {
            const userPostsParams = (getState() as RootState).postApi.queries[
              `getAllPosts({"authorId":"${currentUserId}"})`
            ]?.originalArgs as GetAllPostsParams | void;
            dispatch(
              postSlice.util.updateQueryData(
                "getAllPosts",
                userPostsParams || { authorId: currentUserId },
                (draftList) => {
                  const post = draftList.find((p) => p.id === postId);
                  if (post) post.savedCount = unsaveData.savedCount;
                }
              )
            );
          }
        } catch {}
      },
    }),

    getMySavedPosts: builder.query<BackendPost[], void>({
      query: () => "/posts/saved/my",
      transformResponse: (response: GetMySavedPostsApiResponse) =>
        response.posts,
      providesTags: (result) =>
        result
          ? [
              { type: "SavedPosts", id: "LIST" },
              ...result.map(({ id }) => ({ type: "Projects" as const, id })),
            ]
          : [{ type: "SavedPosts", id: "LIST" }],
    }),

    likePost: builder.mutation<LikePostResponse, string>({
      query: (postId) => ({
        url: `/posts/${postId}/like`,
        method: "POST",
      }),
      invalidatesTags: (result, error, postId) =>
        result
          ? [
              { type: "Post", id: postId },
              { type: "Projects", id: postId },
              "LikedPosts",
            ]
          : [],
      async onQueryStarted(postId, { dispatch, queryFulfilled, getState }) {
        try {
          const { data: likeData } = await queryFulfilled;
          dispatch(
            postSlice.util.updateQueryData(
              "getPostById",
              postId,
              (draftPost) => {
                if (draftPost) draftPost.likesCount = likeData.likesCount;
              }
            )
          );
          const currentParams = (getState() as RootState).postApi.queries[
            `getAllPosts(undefined)`
          ]?.originalArgs as GetAllPostsParams | void;
          dispatch(
            postSlice.util.updateQueryData(
              "getAllPosts",
              currentParams || undefined,
              (draftList) => {
                const post = draftList.find((p) => p.id === postId);
                if (post) post.likesCount = likeData.likesCount;
              }
            )
          );
          const currentUserId = (getState() as RootState).auth.currentUser?.id;
          if (currentUserId) {
            const userPostsParams = (getState() as RootState).postApi.queries[
              `getAllPosts({"authorId":"${currentUserId}"})`
            ]?.originalArgs as GetAllPostsParams | void;
            dispatch(
              postSlice.util.updateQueryData(
                "getAllPosts",
                userPostsParams || { authorId: currentUserId },
                (draftList) => {
                  const post = draftList.find((p) => p.id === postId);
                  if (post) post.likesCount = likeData.likesCount;
                }
              )
            );
          }
        } catch {}
      },
    }),

    unlikePost: builder.mutation<UnlikePostResponse, string>({
      query: (postId) => ({
        url: `/posts/${postId}/like`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, postId) =>
        result
          ? [
              { type: "Post", id: postId },
              { type: "Projects", id: postId },
              "LikedPosts",
            ]
          : [],
      async onQueryStarted(postId, { dispatch, queryFulfilled, getState }) {
        try {
          const { data: unlikeData } = await queryFulfilled;
          dispatch(
            postSlice.util.updateQueryData(
              "getPostById",
              postId,
              (draftPost) => {
                if (draftPost) draftPost.likesCount = unlikeData.likesCount;
              }
            )
          );
          const currentParams = (getState() as RootState).postApi.queries[
            `getAllPosts(undefined)`
          ]?.originalArgs as GetAllPostsParams | void;
          dispatch(
            postSlice.util.updateQueryData(
              "getAllPosts",
              currentParams || undefined,
              (draftList) => {
                const post = draftList.find((p) => p.id === postId);
                if (post) post.likesCount = unlikeData.likesCount;
              }
            )
          );
          const currentUserId = (getState() as RootState).auth.currentUser?.id;
          if (currentUserId) {
            const userPostsParams = (getState() as RootState).postApi.queries[
              `getAllPosts({"authorId":"${currentUserId}"})`
            ]?.originalArgs as GetAllPostsParams | void;
            dispatch(
              postSlice.util.updateQueryData(
                "getAllPosts",
                userPostsParams || { authorId: currentUserId },
                (draftList) => {
                  const post = draftList.find((p) => p.id === postId);
                  if (post) post.likesCount = unlikeData.likesCount;
                }
              )
            );
          }
        } catch {}
      },
    }),

    getMyLikedPosts: builder.query<BackendPost[], void>({
      query: () => "/posts/liked/my",
      transformResponse: (response: GetMyLikedPostsApiResponse) =>
        response.posts,
      providesTags: (result) =>
        result
          ? [
              { type: "LikedPosts", id: "LIST" },
              ...result.map(({ id }) => ({ type: "Projects" as const, id })),
            ]
          : [{ type: "LikedPosts", id: "LIST" }],
    }),

    sharePost: builder.mutation<SharePostResponse, SharePostMutationArg>({
      query: ({ postId, platform }) => ({
        url: `/posts/${postId}/share`,
        method: "POST",
        body: { platform },
      }),
      invalidatesTags: (result, error, { postId }) =>
        result
          ? [
              { type: "Post", id: postId },
              { type: "Projects", id: postId },
            ]
          : [],
      async onQueryStarted({ postId }, { dispatch, queryFulfilled, getState }) {
        try {
          const { data: shareData } = await queryFulfilled;
          dispatch(
            postSlice.util.updateQueryData(
              "getPostById",
              postId,
              (draftPost) => {
                if (draftPost) draftPost.sharesCount = shareData.sharesCount;
              }
            )
          );
          const currentParams = (getState() as RootState).postApi.queries[
            `getAllPosts(undefined)`
          ]?.originalArgs as GetAllPostsParams | void;
          dispatch(
            postSlice.util.updateQueryData(
              "getAllPosts",
              currentParams || undefined,
              (draftList) => {
                const post = draftList.find((p) => p.id === postId);
                if (post) post.sharesCount = shareData.sharesCount;
              }
            )
          );
          const currentUserId = (getState() as RootState).auth.currentUser?.id;
          if (currentUserId) {
            const userPostsParams = (getState() as RootState).postApi.queries[
              `getAllPosts({"authorId":"${currentUserId}"})`
            ]?.originalArgs as GetAllPostsParams | void;
            dispatch(
              postSlice.util.updateQueryData(
                "getAllPosts",
                userPostsParams || { authorId: currentUserId },
                (draftList) => {
                  const post = draftList.find((p) => p.id === postId);
                  if (post) post.sharesCount = shareData.sharesCount;
                }
              )
            );
          }
        } catch {}
      },
    }),

    // --- NEW ENDPOINT for RECORDING A POST VIEW ---
    recordPostView: builder.mutation<RecordPostViewResponse, string>({
      // Argument is postId
      query: (postId) => ({
        url: `/posts/${postId}/view`,
        method: "POST",
        // No body needed, userId comes from token, postId from URL
      }),
      invalidatesTags: (result, error, postId) =>
        result
          ? [
              { type: "Post", id: postId },
              { type: "Projects", id: postId },
            ]
          : [],
      async onQueryStarted(postId, { dispatch, queryFulfilled, getState }) {
        try {
          const { data: viewData } = await queryFulfilled;
          // Optimistically update the specific post's viewsCount
          // The backend returns `totalUniqueViews` which is the new Post.viewsCount
          dispatch(
            postSlice.util.updateQueryData(
              "getPostById",
              postId,
              (draftPost) => {
                if (draftPost) draftPost.viewsCount = viewData.totalUniqueViews;
              }
            )
          );
          // Optimistically update viewsCount in relevant getAllPosts cached lists
          const currentParams = (getState() as RootState).postApi.queries[
            `getAllPosts(undefined)`
          ]?.originalArgs as GetAllPostsParams | void;
          dispatch(
            postSlice.util.updateQueryData(
              "getAllPosts",
              currentParams || undefined,
              (draftList) => {
                const post = draftList.find((p) => p.id === postId);
                if (post) post.viewsCount = viewData.totalUniqueViews;
              }
            )
          );
          const currentUserId = (getState() as RootState).auth.currentUser?.id;
          if (currentUserId) {
            const userPostsParams = (getState() as RootState).postApi.queries[
              `getAllPosts({"authorId":"${currentUserId}"})`
            ]?.originalArgs as GetAllPostsParams | void;
            dispatch(
              postSlice.util.updateQueryData(
                "getAllPosts",
                userPostsParams || { authorId: currentUserId },
                (draftList) => {
                  const post = draftList.find((p) => p.id === postId);
                  if (post) post.viewsCount = viewData.totalUniqueViews;
                }
              )
            );
          }
          // Note: The response also contains userSpecificViewCount and lastViewedAt.
          // These are not directly part of the BackendPost.viewsCount, but might be useful
          // if you had a more detailed view tracking state for the current user on a specific post.
          // For now, we only update the total viewsCount.
        } catch {
          // Errors are typically handled by the component calling the mutation hook
        }
      },
    }),
  }),
});

export const {
  useCreatePostMutation,
  useGetAllPostsQuery,
  useGetPostByIdQuery,
  useUpdatePostMutation,
  useDeletePostMutation,
  useSavePostMutation,
  useUnsavePostMutation,
  useGetMySavedPostsQuery,
  useLikePostMutation,
  useUnlikePostMutation,
  useGetMyLikedPostsQuery,
  useSharePostMutation,
  useRecordPostViewMutation, // Export the new view recording hook
} = postSlice;
