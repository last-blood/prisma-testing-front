// filePath: @/app/projects/[id]/CommentSection.tsx
"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { FaSpinner, FaExclamationCircle, FaComments } from "react-icons/fa";
import {
  useGetCommentsForPostQuery,
  useCreateCommentOnPostMutation,
  // BackendComment, // Type is available from slice if needed for explicit typing
} from "@/lib/comments/commentsSlice"; // Adjust path as necessary
import {
  selectIsAuthenticated,
  selectCurrentUserId,
} from "@/lib/auth/authSlice"; // Adjust path
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUserIdFromState = useSelector(selectCurrentUserId);
  const currentUserId = currentUserIdFromState || null;

  const [currentPage, setCurrentPage] = useState(0);
  const commentsPerPage = 10; // Controls how many top-level comments are fetched per page

  const {
    data: commentsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetCommentsForPostQuery({
    postId,
    skip: currentPage * commentsPerPage,
    take: commentsPerPage,
    sortBy: "createdAt",
    order: "desc",
  });

  const [
    createCommentOnPost,
    { isLoading: isCreatingComment, error: createCommentError },
  ] = useCreateCommentOnPostMutation();

  const handleCreateComment = async (text: string) => {
    if (!text.trim() || !isAuthenticated) return;
    try {
      await createCommentOnPost({ postId, text }).unwrap();
    } catch (err) {
      console.error("Failed to create comment:", err);
    }
  };

  if (isLoading && !commentsResponse) {
    return (
      <div className="mt-8 py-6 text-center text-zinc-400">
        <FaSpinner className="animate-spin text-3xl mx-auto mb-2" />
        <p>Loading comments...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-8 py-6 text-center text-red-400 bg-red-900/20 p-4 rounded-lg">
        <FaExclamationCircle className="text-3xl mx-auto mb-2" />
        <p>Error loading comments.</p>
        <p className="text-sm text-red-300">
          {(error as any)?.data?.message ||
            (error as any)?.error ||
            "An unknown error occurred."}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  const comments = commentsResponse?.comments || []; // These are the top-level comments for the current page
  const pagination = commentsResponse?.pagination;

  // Get the counts for display
  const grandTotalAll = pagination?.grandTotalAllItems ?? 0;
  const totalTopLevel = pagination?.totalTopLevelItems ?? 0;

  return (
    <section
      aria-labelledby="comments-heading"
      className="mt-10 pt-8 border-t border-zinc-700"
    >
      <h2
        id="comments-heading"
        className="text-2xl font-semibold text-zinc-100 mb-6 flex items-center gap-3"
      >
        <FaComments />
        <span>
          {totalTopLevel} Top-Level Comment{totalTopLevel !== 1 ? "s" : ""}
          <span className="text-lg text-zinc-400 ml-2">
            ({grandTotalAll} Total Interactions)
          </span>
        </span>
      </h2>

      {isAuthenticated ? (
        <div className="mb-8">
          <CommentForm
            onSubmit={handleCreateComment}
            isLoading={isCreatingComment}
            submitError={
              createCommentError
                ? (createCommentError as any)?.data?.message ||
                  "Failed to post comment."
                : undefined
            }
            placeholder="Write a public comment..."
            submitButtonText="Post Comment"
          />
        </div>
      ) : (
        <div className="mb-8 p-4 bg-zinc-700/50 rounded-lg text-center text-zinc-300">
          <p>
            Please{" "}
            <a href="/login" className="text-blue-400 hover:underline">
              log in
            </a>{" "}
            or{" "}
            <a href="/signup" className="text-blue-400 hover:underline">
              sign up
            </a>{" "}
            to post comments.
          </p>
        </div>
      )}

      {comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              postId={postId}
            />
          ))}
        </div>
      ) : (
        !isLoading &&
        !isFetching && (
          <p className="text-zinc-400 italic">
            No comments yet. Be the first to comment!
          </p>
        )
      )}

      {/* Pagination logic based on top-level comments */}
      {pagination && totalTopLevel > commentsPerPage && (
        <div className="mt-8 flex justify-center items-center text-sm space-x-3">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0 || isFetching || isLoading}
            className="btn btn-sm btn-outline btn-neutral"
          >
            Previous
          </button>
          <span className="text-zinc-400">
            Page {currentPage + 1} of{" "}
            {Math.ceil(totalTopLevel / commentsPerPage)}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => (pagination.hasMore ? prev + 1 : prev))
            }
            disabled={!pagination.hasMore || isFetching || isLoading}
            className="btn btn-sm btn-outline btn-neutral"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};

export default CommentSection;
