// src/lib/comment/commentSlice.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store"; // Adjust path to your Redux store
import { QueryStatus } from "@reduxjs/toolkit/query"; // For checking cache entry status

// --- Type Definitions (ensure these match your backend) ---
interface CommentAuthorFrontend {
  id: string;
  username: string | null;
  profileImage?: string | null;
}

export interface BackendComment {
  id: string;
  text: string;
  postId: string;
  authorId: string | null;
  parentId: string | null;
  level: number;
  createdAt: string;
  updatedAt: string;
  author?: CommentAuthorFrontend;
  likes: number;
  dislikes: number;
  isLikedByCurrentUser: boolean;
  isDislikedByCurrentUser: boolean;
  directRepliesCount: number;
  children: BackendComment[];
  totalDescendantRepliesCount?: number;
}

export interface GetCommentsForPostParams {
  postId: string;
  skip?: number;
  take?: number;
  sortBy?: "createdAt" | "likes";
  order?: "asc" | "desc";
}

interface GetCommentsForPostResponse {
  success: boolean;
  comments: BackendComment[];
  pagination: {
    skip: number;
    take: number;
    totalTopLevelItems: number;
    grandTotalAllItems: number;
    hasMore: boolean;
    currentFetchDepth: number;
  };
}

export interface GetRepliesForCommentParams {
  parentId: string;
  skip: number;
  take: number;
}

export interface GetRepliesForCommentResponse {
  success: boolean;
  comments: BackendComment[];
  pagination: {
    skip: number;
    take: number;
    total: number;
    hasMore: boolean;
  };
}

interface CreateCommentPayload {
  postId: string;
  text: string;
}

interface ReplyToCommentPayload {
  parentCommentId: string;
  postId: string;
  text: string;
}

interface MutateCommentResponse {
  success: boolean;
  message: string;
  comment: BackendComment;
}

interface UpdateCommentPayload {
  commentId: string;
  postId: string;
  text: string;
  parentId?: string | null; // For more targeted invalidation
}

interface DeleteCommentPayload {
  commentId: string;
  postId: string;
  parentId?: string | null;
}

interface DeleteCommentResponse {
  success: boolean;
  message: string;
}

export type CommentReactionType = "LIKED" | "DISLIKED";

interface ToggleCommentReactionPayload {
  commentId: string;
  reaction: CommentReactionType;
  postId: string;
  parentId?: string | null; // For more targeted invalidation
}

interface ToggleCommentReactionResponse {
  success: boolean;
  message: string;
  likes: number;
  dislikes: number;
  isLikedByCurrentUser: boolean;
  isDislikedByCurrentUser: boolean;
}

interface PatchResult {
  undo: () => void;
}

const updateCommentInListRecursively = (
  comments: BackendComment[],
  commentId: string,
  updateFn: (comment: BackendComment) => void
): boolean => {
  for (let i = 0; i < comments.length; i++) {
    if (comments[i].id === commentId) {
      updateFn(comments[i]);
      return true;
    }
    if (comments[i].children && comments[i].children.length > 0) {
      if (
        updateCommentInListRecursively(
          comments[i].children,
          commentId,
          updateFn
        )
      ) {
        return true;
      }
    }
  }
  return false;
};

const deleteCommentInListRecursively = (
  comments: BackendComment[],
  commentId: string
): BackendComment[] => {
  return comments.filter((comment) => {
    if (comment.id === commentId) {
      return false;
    }
    if (comment.children && comment.children.length > 0) {
      comment.children = deleteCommentInListRecursively(
        comment.children,
        commentId
      );
    }
    return true;
  });
};

type CommentTagID = string | "LIST";
type CommentCacheTagType =
  | "Comment"
  | "PostCommentsList"
  | "Post"
  | "CommentReplies";

export const commentSlice = createApi({
  reducerPath: "commentApi",
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
    "Comment",
    "PostCommentsList",
    "Post",
    "CommentReplies",
  ] as CommentCacheTagType[],

  endpoints: (builder) => ({
    getCommentsForPost: builder.query<
      GetCommentsForPostResponse,
      GetCommentsForPostParams
    >({
      query: ({
        postId,
        skip = 0,
        take = 10,
        sortBy = "createdAt",
        order = "desc",
      }) => {
        const params = new URLSearchParams({
          skip: skip.toString(),
          take: take.toString(),
          sortBy,
          order,
        });
        return `/posts/${postId}/comments?${params.toString()}`;
      },
      transformResponse: (response: GetCommentsForPostResponse) => {
        const processComments = (
          comments: BackendComment[]
        ): BackendComment[] => {
          return comments.map((comment) => ({
            ...comment,
            isLikedByCurrentUser: !!comment.isLikedByCurrentUser,
            isDislikedByCurrentUser: !!comment.isDislikedByCurrentUser,
            children: comment.children ? processComments(comment.children) : [],
          }));
        };
        return {
          ...response,
          comments: processComments(response.comments),
        };
      },
      providesTags: (result, error, { postId }) => {
        const tags: { type: CommentCacheTagType; id: CommentTagID }[] = [
          { type: "PostCommentsList" as const, id: postId },
        ];
        if (result?.comments) {
          const tagChildrenRecursively = (comments: BackendComment[]) => {
            comments.forEach((comment) => {
              tags.push({ type: "Comment" as const, id: comment.id });
              if (comment.children && comment.children.length > 0) {
                tagChildrenRecursively(comment.children);
              }
            });
          };
          tagChildrenRecursively(result.comments);
        }
        return tags;
      },
    }),

    getRepliesForComment: builder.query<
      GetRepliesForCommentResponse,
      GetRepliesForCommentParams
    >({
      query: ({ parentId, skip, take }) => {
        const params = new URLSearchParams({
          skip: String(skip),
          take: String(take),
        });
        return `/comments/${parentId}/replies?${params.toString()}`;
      },
      providesTags: (result, error, { parentId }) => {
        const tags: { type: CommentCacheTagType; id: CommentTagID }[] = [
          { type: "CommentReplies" as const, id: parentId },
        ];
        if (result?.comments) {
          result.comments.forEach((reply) => {
            tags.push({ type: "Comment" as const, id: reply.id });
          });
        }
        return tags;
      },
      transformResponse: (response: GetRepliesForCommentResponse) => {
        const processComments = (
          comments: BackendComment[]
        ): BackendComment[] => {
          return comments.map((comment) => ({
            ...comment,
            isLikedByCurrentUser: !!comment.isLikedByCurrentUser,
            isDislikedByCurrentUser: !!comment.isDislikedByCurrentUser,
            children: [],
          }));
        };
        return {
          ...response,
          comments: processComments(response.comments || []),
        };
      },
    }),

    createCommentOnPost: builder.mutation<
      MutateCommentResponse,
      CreateCommentPayload
    >({
      query: ({ postId, text }) => ({
        url: `/posts/${postId}/comments`,
        method: "POST",
        body: { text },
      }),
      invalidatesTags: (result, error, { postId }) => [
        { type: "PostCommentsList", id: postId },
        { type: "Post", id: postId },
      ],
      async onQueryStarted(
        { postId, text },
        { dispatch, queryFulfilled, getState }
      ) {
        const currentRootState = getState() as RootState;
        const currentUser = currentRootState.auth.currentUser;
        let patchResult: PatchResult | undefined;

        for (const key in currentRootState.commentApi.queries) {
          const queryState =
            currentRootState.commentApi.queries[
              key as keyof typeof currentRootState.commentApi.queries
            ];
          if (
            queryState &&
            queryState.endpointName === "getCommentsForPost" &&
            queryState.status === QueryStatus.fulfilled
          ) {
            const originalArgs =
              queryState.originalArgs as GetCommentsForPostParams;
            if (
              originalArgs.postId === postId &&
              (originalArgs.skip === 0 || originalArgs.skip === undefined)
            ) {
              patchResult = dispatch(
                commentSlice.util.updateQueryData(
                  "getCommentsForPost",
                  originalArgs,
                  (draft) => {
                    const newComment: BackendComment = {
                      id: `temp-${Date.now()}`,
                      text,
                      postId,
                      authorId: currentUser?.id || null,
                      author: currentUser
                        ? {
                            id: currentUser.id,
                            username: currentUser.username || null,
                            profileImage: currentUser.profileImage,
                          }
                        : undefined,
                      parentId: null,
                      level: 0,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      likes: 0,
                      dislikes: 0,
                      isLikedByCurrentUser: false,
                      isDislikedByCurrentUser: false,
                      directRepliesCount: 0,
                      children: [],
                      totalDescendantRepliesCount: 0,
                    };
                    draft.comments.unshift(newComment);
                    if (draft.pagination) {
                      draft.pagination.totalTopLevelItems += 1;
                      draft.pagination.grandTotalAllItems += 1;
                    }
                  }
                )
              );
              break;
            }
          }
        }
        try {
          await queryFulfilled;
        } catch (err) {
          patchResult?.undo();
        }
      },
    }),

    replyToComment: builder.mutation<
      MutateCommentResponse,
      ReplyToCommentPayload
    >({
      query: ({ parentCommentId, text }) => ({
        url: `/comments/${parentCommentId}/replies`,
        method: "POST",
        body: { text },
      }),
      invalidatesTags: (result, error, { postId, parentCommentId }) => {
        const tags: Array<{ type: CommentCacheTagType; id?: string | "LIST" }> =
          [
            { type: "PostCommentsList", id: postId },
            { type: "Comment", id: parentCommentId },
            { type: "CommentReplies", id: parentCommentId },
            { type: "Post", id: postId },
          ];
        if (result?.comment) {
          tags.push({ type: "Comment", id: result.comment.id });
        }
        return tags;
      },
    }),

    updateComment: builder.mutation<
      MutateCommentResponse,
      UpdateCommentPayload
    >({
      query: ({ commentId, text }) => ({
        url: `/comments/${commentId}`,
        method: "PUT",
        body: { text },
      }),
      invalidatesTags: (result, error, { commentId, postId, parentId }) => {
        const tagsToInvalidate: Array<{
          type: CommentCacheTagType;
          id?: string | "LIST";
        }> = [
          { type: "Comment", id: commentId },
          { type: "PostCommentsList", id: postId },
        ];
        if (parentId) {
          tagsToInvalidate.push({ type: "CommentReplies", id: parentId });
        }
        return tagsToInvalidate;
      },
      async onQueryStarted(
        { commentId, text, postId, parentId },
        { dispatch, queryFulfilled, getState }
      ) {
        const currentRootState = getState() as RootState;
        const gCfpPatchResults: PatchResult[] = [];

        for (const key in currentRootState.commentApi.queries) {
          const queryState =
            currentRootState.commentApi.queries[
              key as keyof typeof currentRootState.commentApi.queries
            ];
          if (
            queryState &&
            queryState.endpointName === "getCommentsForPost" &&
            queryState.status === QueryStatus.fulfilled &&
            (queryState.originalArgs as GetCommentsForPostParams).postId ===
              postId
          ) {
            const patchResult = dispatch(
              commentSlice.util.updateQueryData(
                "getCommentsForPost",
                queryState.originalArgs as GetCommentsForPostParams,
                (draft) => {
                  updateCommentInListRecursively(
                    draft.comments,
                    commentId,
                    (comment) => {
                      comment.text = text;
                      comment.updatedAt = new Date().toISOString();
                    }
                  );
                }
              )
            );
            gCfpPatchResults.push(patchResult as PatchResult);
          }
        }

        let grfcPatchResult: PatchResult | undefined;
        if (parentId) {
          for (const key in currentRootState.commentApi.queries) {
            const queryState =
              currentRootState.commentApi.queries[
                key as keyof typeof currentRootState.commentApi.queries
              ];
            if (
              queryState &&
              queryState.endpointName === "getRepliesForComment" &&
              queryState.status === QueryStatus.fulfilled &&
              (queryState.originalArgs as GetRepliesForCommentParams)
                .parentId === parentId
            ) {
              grfcPatchResult = dispatch(
                commentSlice.util.updateQueryData(
                  "getRepliesForComment",
                  queryState.originalArgs as GetRepliesForCommentParams,
                  (draft) => {
                    const commentIndex = draft.comments.findIndex(
                      (c) => c.id === commentId
                    );
                    if (commentIndex !== -1) {
                      draft.comments[commentIndex].text = text;
                      draft.comments[commentIndex].updatedAt =
                        new Date().toISOString();
                    }
                  }
                )
              );
              break;
            }
          }
        }

        try {
          await queryFulfilled;
        } catch (err) {
          gCfpPatchResults.forEach((p) => p.undo());
          grfcPatchResult?.undo();
        }
      },
    }),

    deleteComment: builder.mutation<
      DeleteCommentResponse,
      DeleteCommentPayload
    >({
      query: ({ commentId }) => ({
        url: `/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { commentId, postId, parentId }) => {
        const tags: { type: CommentCacheTagType; id?: CommentTagID }[] = [
          { type: "PostCommentsList", id: postId },
          { type: "Post", id: postId },
          { type: "Comment" as const, id: commentId },
        ];
        if (parentId) {
          tags.push({ type: "Comment", id: parentId });
          tags.push({ type: "CommentReplies", id: parentId });
        }
        return tags;
      },
      async onQueryStarted(
        { commentId, postId, parentId },
        { dispatch, queryFulfilled, getState }
      ) {
        const currentRootState = getState() as RootState;
        const gCfpPatchResults: PatchResult[] = [];

        for (const key in currentRootState.commentApi.queries) {
          const queryState =
            currentRootState.commentApi.queries[
              key as keyof typeof currentRootState.commentApi.queries
            ];
          if (
            queryState &&
            queryState.endpointName === "getCommentsForPost" &&
            queryState.status === QueryStatus.fulfilled
          ) {
            const originalArgs =
              queryState.originalArgs as GetCommentsForPostParams;
            if (originalArgs.postId === postId) {
              const patchResult = dispatch(
                commentSlice.util.updateQueryData(
                  "getCommentsForPost",
                  originalArgs,
                  (draft) => {
                    let isTopLevelCommentRemoved = false;
                    const commentToRemoveIndex = draft.comments.findIndex(
                      (c) => c.id === commentId && !c.parentId
                    );
                    if (commentToRemoveIndex !== -1)
                      isTopLevelCommentRemoved = true;

                    draft.comments = deleteCommentInListRecursively(
                      draft.comments,
                      commentId
                    );

                    if (draft.pagination) {
                      if (isTopLevelCommentRemoved) {
                        draft.pagination.totalTopLevelItems = Math.max(
                          0,
                          draft.pagination.totalTopLevelItems - 1
                        );
                      }
                      draft.pagination.grandTotalAllItems = Math.max(
                        0,
                        draft.pagination.grandTotalAllItems - 1
                      );
                    }
                  }
                )
              );
              gCfpPatchResults.push(patchResult as PatchResult);
            }
          }
        }

        let grfcPatchResult: PatchResult | undefined;
        if (parentId) {
          for (const key in currentRootState.commentApi.queries) {
            const queryState =
              currentRootState.commentApi.queries[
                key as keyof typeof currentRootState.commentApi.queries
              ];
            if (
              queryState &&
              queryState.endpointName === "getRepliesForComment" &&
              queryState.status === QueryStatus.fulfilled
            ) {
              const queryArgsFromState =
                queryState.originalArgs as GetRepliesForCommentParams;
              if (queryArgsFromState.parentId === parentId) {
                grfcPatchResult = dispatch(
                  commentSlice.util.updateQueryData(
                    "getRepliesForComment",
                    queryArgsFromState,
                    (draft) => {
                      draft.comments = draft.comments.filter(
                        (c) => c.id !== commentId
                      );
                      if (draft.pagination) {
                        draft.pagination.total = Math.max(
                          0,
                          draft.pagination.total - 1
                        );
                      }
                    }
                  )
                );
                break;
              }
            }
          }
        }

        try {
          await queryFulfilled;
        } catch (err) {
          gCfpPatchResults.forEach((p) => p.undo());
          grfcPatchResult?.undo();
        }
      },
    }),

    toggleCommentReaction: builder.mutation<
      ToggleCommentReactionResponse,
      ToggleCommentReactionPayload
    >({
      query: ({ commentId, reaction }) => ({
        url: `/comments/${commentId}/react`,
        method: "POST",
        body: { reaction },
      }),
      invalidatesTags: (result, error, { commentId, postId, parentId }) => {
        const tags: Array<{ type: CommentCacheTagType; id?: string | "LIST" }> =
          [
            { type: "Comment", id: commentId },
            { type: "PostCommentsList", id: postId },
          ];
        if (parentId) {
          tags.push({ type: "CommentReplies", id: parentId });
        }
        return tags;
      },
      async onQueryStarted(
        { commentId, reaction, postId, parentId },
        { dispatch, queryFulfilled, getState }
      ) {
        const currentRootState = getState() as RootState;
        const gCfpPatchResults: PatchResult[] = [];

        for (const key in currentRootState.commentApi.queries) {
          const queryState =
            currentRootState.commentApi.queries[
              key as keyof typeof currentRootState.commentApi.queries
            ];
          if (
            queryState &&
            queryState.endpointName === "getCommentsForPost" &&
            queryState.status === QueryStatus.fulfilled &&
            (queryState.originalArgs as GetCommentsForPostParams).postId ===
              postId
          ) {
            const patchResult = dispatch(
              commentSlice.util.updateQueryData(
                "getCommentsForPost",
                queryState.originalArgs as GetCommentsForPostParams,
                (draft) => {
                  updateCommentInListRecursively(
                    draft.comments,
                    commentId,
                    (comment) => {
                      const wasLiked = comment.isLikedByCurrentUser;
                      const wasDisliked = comment.isDislikedByCurrentUser;
                      const prevLikes = comment.likes;
                      const prevDislikes = comment.dislikes;
                      if (reaction === "LIKED") {
                        comment.isLikedByCurrentUser = !wasLiked;
                        comment.likes = prevLikes + (!wasLiked ? 1 : -1);
                        if (comment.isLikedByCurrentUser && wasDisliked) {
                          comment.isDislikedByCurrentUser = false;
                          comment.dislikes = prevDislikes - 1;
                        }
                      } else if (reaction === "DISLIKED") {
                        comment.isDislikedByCurrentUser = !wasDisliked;
                        comment.dislikes =
                          prevDislikes + (!wasDisliked ? 1 : -1);
                        if (comment.isDislikedByCurrentUser && wasLiked) {
                          comment.isLikedByCurrentUser = false;
                          comment.likes = prevLikes - 1;
                        }
                      }
                      comment.likes = Math.max(0, comment.likes);
                      comment.dislikes = Math.max(0, comment.dislikes);
                    }
                  );
                }
              )
            );
            gCfpPatchResults.push(patchResult as PatchResult);
          }
        }

        let grfcPatchResult: PatchResult | undefined;
        if (parentId) {
          for (const key in currentRootState.commentApi.queries) {
            const queryState =
              currentRootState.commentApi.queries[
                key as keyof typeof currentRootState.commentApi.queries
              ];
            if (
              queryState &&
              queryState.endpointName === "getRepliesForComment" &&
              queryState.status === QueryStatus.fulfilled &&
              (queryState.originalArgs as GetRepliesForCommentParams)
                .parentId === parentId
            ) {
              grfcPatchResult = dispatch(
                commentSlice.util.updateQueryData(
                  "getRepliesForComment",
                  queryState.originalArgs as GetRepliesForCommentParams,
                  (draft) => {
                    const commentIndex = draft.comments.findIndex(
                      (c) => c.id === commentId
                    );
                    if (commentIndex !== -1) {
                      const comment = draft.comments[commentIndex];
                      const wasLiked = comment.isLikedByCurrentUser;
                      const wasDisliked = comment.isDislikedByCurrentUser;
                      const prevLikes = comment.likes;
                      const prevDislikes = comment.dislikes;
                      if (reaction === "LIKED") {
                        comment.isLikedByCurrentUser = !wasLiked;
                        comment.likes = prevLikes + (!wasLiked ? 1 : -1);
                        if (comment.isLikedByCurrentUser && wasDisliked) {
                          comment.isDislikedByCurrentUser = false;
                          comment.dislikes = prevDislikes - 1;
                        }
                      } else if (reaction === "DISLIKED") {
                        comment.isDislikedByCurrentUser = !wasDisliked;
                        comment.dislikes =
                          prevDislikes + (!wasDisliked ? 1 : -1);
                        if (comment.isDislikedByCurrentUser && wasLiked) {
                          comment.isLikedByCurrentUser = false;
                          comment.likes = prevLikes - 1;
                        }
                      }
                      comment.likes = Math.max(0, comment.likes);
                      comment.dislikes = Math.max(0, comment.dislikes);
                    }
                  }
                )
              );
              break;
            }
          }
        }

        try {
          const { data: serverUpdate } = await queryFulfilled;
          if (
            typeof serverUpdate.likes !== "number" ||
            typeof serverUpdate.dislikes !== "number" ||
            typeof serverUpdate.isLikedByCurrentUser !== "boolean" ||
            typeof serverUpdate.isDislikedByCurrentUser !== "boolean"
          ) {
            gCfpPatchResults.forEach((p) => p.undo());
            grfcPatchResult?.undo();
            return;
          }
          for (const key in currentRootState.commentApi.queries) {
            const queryState =
              currentRootState.commentApi.queries[
                key as keyof typeof currentRootState.commentApi.queries
              ];
            if (
              queryState &&
              queryState.endpointName === "getCommentsForPost" &&
              queryState.status === QueryStatus.fulfilled
            ) {
              const originalArgs =
                queryState.originalArgs as GetCommentsForPostParams;
              if (originalArgs.postId === postId) {
                dispatch(
                  commentSlice.util.updateQueryData(
                    "getCommentsForPost",
                    originalArgs,
                    (draft) => {
                      updateCommentInListRecursively(
                        draft.comments,
                        commentId,
                        (comment) => {
                          comment.likes = serverUpdate.likes;
                          comment.dislikes = serverUpdate.dislikes;
                          comment.isLikedByCurrentUser =
                            serverUpdate.isLikedByCurrentUser;
                          comment.isDislikedByCurrentUser =
                            serverUpdate.isDislikedByCurrentUser;
                        }
                      );
                    }
                  )
                );
              }
            }
          }
          if (parentId) {
            for (const key in currentRootState.commentApi.queries) {
              const queryState =
                currentRootState.commentApi.queries[
                  key as keyof typeof currentRootState.commentApi.queries
                ];
              if (
                queryState &&
                queryState.endpointName === "getRepliesForComment" &&
                queryState.status === QueryStatus.fulfilled
              ) {
                const queryArgs =
                  queryState.originalArgs as GetRepliesForCommentParams;
                if (queryArgs.parentId === parentId) {
                  dispatch(
                    commentSlice.util.updateQueryData(
                      "getRepliesForComment",
                      queryArgs,
                      (draft) => {
                        const commentIndex = draft.comments.findIndex(
                          (c) => c.id === commentId
                        );
                        if (commentIndex !== -1) {
                          draft.comments[commentIndex].likes =
                            serverUpdate.likes;
                          draft.comments[commentIndex].dislikes =
                            serverUpdate.dislikes;
                          draft.comments[commentIndex].isLikedByCurrentUser =
                            serverUpdate.isLikedByCurrentUser;
                          draft.comments[commentIndex].isDislikedByCurrentUser =
                            serverUpdate.isDislikedByCurrentUser;
                        }
                      }
                    )
                  );
                  break;
                }
              }
            }
          }
        } catch (err) {
          gCfpPatchResults.forEach((p) => p.undo());
          grfcPatchResult?.undo();
        }
      },
    }),
  }),
});

export const {
  useGetCommentsForPostQuery,
  useLazyGetRepliesForCommentQuery,
  useCreateCommentOnPostMutation,
  useReplyToCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useToggleCommentReactionMutation,
} = commentSlice;
