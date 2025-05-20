// filePath: @/app/projects/[id]/CommentItem.tsx
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import NextImage from "next/image";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  FaUserCircle,
  FaReply,
  FaEdit,
  FaTrashAlt,
  FaThumbsUp,
  FaThumbsDown,
  FaSpinner,
  FaRegThumbsUp,
  FaRegThumbsDown,
  FaChevronDown,
  FaChevronUp,
  FaCommentDots,
  FaExclamationTriangle,
  FaEllipsisH,
} from "react-icons/fa";
import {
  BackendComment,
  useToggleCommentReactionMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useReplyToCommentMutation,
  useLazyGetRepliesForCommentQuery,
  CommentReactionType,
} from "@/lib/comments/commentsSlice";
import CommentForm from "./CommentForm";

const FALLBACK_AVATAR_IMAGE_PATH = "/default-avatar.png";
const MAX_COMMENT_LEVEL_ALLOWED_TO_REPLY_TO = 5;
const REPLIES_TO_FETCH_PER_LOAD = 5;
const MENTION_REGEX = /@([a-zA-Z0-9_]+)/g;

const iconWrapperClass = "w-4 h-4 flex items-center justify-center";

interface CommentItemProps {
  comment: BackendComment;
  currentUserId: string | null;
  postId: string;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  postId,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [actionedReaction, setActionedReaction] =
    useState<CommentReactionType | null>(null);

  const [manuallyLoadedReplies, setManuallyLoadedReplies] = useState<
    BackendComment[]
  >([]);
  const [nextRepliesSkip, setNextRepliesSkip] = useState(0);
  const [areExtraRepliesExpanded, setAreExtraRepliesExpanded] = useState(false);
  const [hasMoreRepliesToLoadServer, setHasMoreRepliesToLoadServer] =
    useState(true);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [toggleReaction, { isLoading: isTogglingReactionGlobal }] =
    useToggleCommentReactionMutation();
  const [
    replyToComment,
    {
      isLoading: isSubmittingReply,
      error: replyErrorObject,
      isError: isReplyError,
      reset: resetReplyMutation,
    },
  ] = useReplyToCommentMutation();
  const [
    updateComment,
    {
      isLoading: isUpdatingComment,
      error: updateErrorObject,
      isError: isUpdateError,
      reset: resetUpdateMutation,
    },
  ] = useUpdateCommentMutation();
  const [deleteComment, { isLoading: isDeletingComment }] =
    useDeleteCommentMutation();

  const [
    triggerGetReplies,
    {
      data: newRepliesData,
      isFetching: isFetchingMoreReplies,
      error: fetchRepliesErrorObject,
    },
  ] = useLazyGetRepliesForCommentQuery();

  const isThisReactionLoading =
    isTogglingReactionGlobal && actionedReaction !== null;

  useEffect(() => {
    if (!isTogglingReactionGlobal && actionedReaction) {
      setActionedReaction(null);
    }
  }, [isTogglingReactionGlobal, actionedReaction, comment.id]);

  useEffect(() => {
    if (newRepliesData?.comments && areExtraRepliesExpanded) {
      const incomingReplies = newRepliesData.comments;

      setManuallyLoadedReplies((prevManuallyLoadedReplies) => {
        let updatedRepliesMap = new Map(
          prevManuallyLoadedReplies.map((reply) => [reply.id, reply])
        );

        // If this is the first page from API (skip=0), it should form the new base or replace existing
        if ((newRepliesData.pagination?.skip || 0) === 0) {
          updatedRepliesMap = new Map(); // Start fresh for first page data if we are re-fetching page 0
          // Add initial children from props to the map, they won't be in incomingReplies if skip=0 fetch is for *additional*
          (comment.children || []).forEach((child) => {
            if (!updatedRepliesMap.has(child.id)) {
              // Ensure they are not overwritten by incoming if IDs overlap by chance
              updatedRepliesMap.set(child.id, child);
            }
          });
        }

        // Merge incoming replies: update existing, add new
        incomingReplies.forEach((reply) => {
          updatedRepliesMap.set(reply.id, reply); // Add new or overwrite existing with fresh data
        });

        const updatedRepliesArray = Array.from(updatedRepliesMap.values());
        // Optional: Re-sort if strict order is needed after merging pages,
        // but API should deliver pages in order, and map preserves insertion order for new items.
        // For simplicity, if `skip=0` resets the view, this logic becomes simpler.
        // The key is that items are updated if their ID matches an incoming one.
        if ((newRepliesData.pagination?.skip || 0) === 0) {
          return incomingReplies; // For first page, directly set (assuming these are sorted by API)
        } else {
          // For subsequent pages, merge and ensure no duplicates, update existing
          const currentRepliesById = new Map(
            prevManuallyLoadedReplies.map((r) => [r.id, r])
          );
          incomingReplies.forEach((newReply) => {
            currentRepliesById.set(newReply.id, newReply); // Update if exists, add if new
          });
          return Array.from(currentRepliesById.values()).sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
      });

      setHasMoreRepliesToLoadServer(
        newRepliesData.pagination?.hasMore || false
      );
    }

    if (fetchRepliesErrorObject && areExtraRepliesExpanded) {
      setHasMoreRepliesToLoadServer(false);
    }
  }, [
    newRepliesData,
    areExtraRepliesExpanded,
    fetchRepliesErrorObject,
    comment.id,
    comment.children, // Needed if logic for first page relies on excluding them
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsActionsDropdownOpen(false);
      }
    };
    if (isActionsDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isActionsDropdownOpen]);

  const isOwner = currentUserId === comment.author?.id;
  const isAuthenticated = !!currentUserId;

  const handleToggleReaction = (reactionType: CommentReactionType) => {
    if (!isAuthenticated || isThisReactionLoading) return;
    setActionedReaction(reactionType);
    toggleReaction({
      commentId: comment.id,
      reaction: reactionType,
      postId,
      parentId: comment.parentId,
    });
  };

  const handleOpenReplyForm = () => {
    resetReplyMutation();
    setIsReplying(true);
    setIsActionsDropdownOpen(false);
  };
  const handleCloseReplyForm = () => {
    setIsReplying(false);
    resetReplyMutation();
  };

  const handleEditAction = () => {
    resetUpdateMutation();
    setIsEditing(true);
    setIsActionsDropdownOpen(false);
  };
  const handleCloseEditForm = () => {
    setIsEditing(false);
    resetUpdateMutation();
  };

  const handleDeleteAction = () => {
    if (!isOwner || isDeletingComment) return;
    setIsDeleteModalOpen(true);
    setIsActionsDropdownOpen(false);
  };

  const confirmDelete = async () => {
    if (!isOwner || isDeletingComment) return;
    try {
      await deleteComment({
        commentId: comment.id,
        postId,
        parentId: comment.parentId,
      }).unwrap();
      setIsDeleteModalOpen(false);
    } catch (err) {
      alert("Failed to delete comment.");
      setIsDeleteModalOpen(false);
    }
  };

  const handleReplySubmit = async (replyText: string) => {
    if (!replyText.trim() || !isAuthenticated || isSubmittingReply) return;
    try {
      await replyToComment({
        parentCommentId: comment.id,
        postId,
        text: replyText,
      }).unwrap();
      handleCloseReplyForm();
      setManuallyLoadedReplies([]);
      setNextRepliesSkip(0);
      setHasMoreRepliesToLoadServer(true);
      if (!areExtraRepliesExpanded) {
        setAreExtraRepliesExpanded(true);
      }
      triggerGetReplies({
        parentId: comment.id,
        skip: 0,
        take: REPLIES_TO_FETCH_PER_LOAD,
      });
      setNextRepliesSkip(REPLIES_TO_FETCH_PER_LOAD);
    } catch (err) {
      // Error handled by form
    }
  };

  const handleEditSubmit = async (updatedText: string) => {
    if (!updatedText.trim() || !isOwner || isUpdatingComment) return;
    try {
      await updateComment({
        commentId: comment.id,
        postId,
        text: updatedText,
        parentId: comment.parentId,
      }).unwrap();
      handleCloseEditForm();
    } catch (err) {
      // Error handled by form
    }
  };

  const handleToggleExpandReplies = () => {
    if (!areExtraRepliesExpanded) {
      setManuallyLoadedReplies([]);
      setNextRepliesSkip(0);
      setHasMoreRepliesToLoadServer(true);
      setAreExtraRepliesExpanded(true);
      triggerGetReplies({
        parentId: comment.id,
        skip: 0,
        take: REPLIES_TO_FETCH_PER_LOAD,
      });
      setNextRepliesSkip(REPLIES_TO_FETCH_PER_LOAD);
    } else {
      setAreExtraRepliesExpanded(false);
      setManuallyLoadedReplies([]);
      setNextRepliesSkip(0);
    }
  };

  const handleFetchNextPageOfReplies = () => {
    if (isFetchingMoreReplies || !hasMoreRepliesToLoadServer) return;
    triggerGetReplies({
      parentId: comment.id,
      skip: nextRepliesSkip,
      take: REPLIES_TO_FETCH_PER_LOAD,
    });
    setNextRepliesSkip((prev) => prev + REPLIES_TO_FETCH_PER_LOAD);
  };

  const formattedDate = comment.createdAt
    ? formatDistanceToNow(parseISO(comment.createdAt), { addSuffix: true })
    : "some time ago";
  const isReply = !!comment.parentId;
  const canReplyToThisComment =
    isAuthenticated && comment.level < MAX_COMMENT_LEVEL_ALLOWED_TO_REPLY_TO;

  const processedCommentText = useMemo(() => {
    if (!comment.text) return null;
    const parts = comment.text.split(MENTION_REGEX);
    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <span
          key={`${comment.id}-mention-${index}`}
          className="text-sky-400 font-medium"
        >
          @{part}
        </span>
      ) : (
        part
      )
    );
  }, [comment.text, comment.id]);

  const initiallyFetchedChildrenCount = comment.children?.length || 0;
  const totalDirectRepliesForThisComment = comment.directRepliesCount || 0;
  const unshownInitialDirectRepliesCount = Math.max(
    0,
    totalDirectRepliesForThisComment - initiallyFetchedChildrenCount
  );
  const showViewMoreDirectRepliesButton =
    !areExtraRepliesExpanded && unshownInitialDirectRepliesCount > 0;
  const showLoadMoreAndHideButtons = areExtraRepliesExpanded;

  return (
    <>
      <div
        className={`bg-zinc-800/50 p-3 sm:p-4 rounded-lg shadow ${
          isReply
            ? "border-l-2 border-zinc-700 pl-3 sm:pl-4 ml-4 sm:ml-6 md:ml-8"
            : ""
        }`}
      >
        <div className="flex items-start space-x-2 sm:space-x-3">
          <div className="flex-shrink-0">
            {comment.author?.profileImage ? (
              <NextImage
                src={comment.author.profileImage}
                alt={comment.author.username || "User"}
                width={isReply ? 28 : 32}
                height={isReply ? 28 : 32}
                className="rounded-full object-cover"
                onError={(e) =>
                  (e.currentTarget.src = FALLBACK_AVATAR_IMAGE_PATH)
                }
              />
            ) : (
              <FaUserCircle
                className={`${isReply ? "w-7 h-7" : "w-8 h-8"} text-zinc-500`}
              />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="text-xs sm:text-sm">
                <span className="font-semibold text-zinc-200">
                  {comment.author?.username || "Anonymous User"}
                </span>
                <span className="text-zinc-400 ml-1.5 sm:ml-2 text-xs">
                  {formattedDate}
                </span>
                {comment.updatedAt !== comment.createdAt && (
                  <span className="text-zinc-500 text-xs ml-1">(edited)</span>
                )}
              </div>
              {isOwner && !isEditing && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() =>
                      setIsActionsDropdownOpen(!isActionsDropdownOpen)
                    }
                    className="text-zinc-400 hover:text-zinc-200 p-1"
                    aria-label="Comment actions"
                    disabled={
                      isUpdatingComment ||
                      isDeletingComment ||
                      isThisReactionLoading
                    }
                  >
                    <FaEllipsisH />
                  </button>
                  {isActionsDropdownOpen && (
                    <ul
                      tabIndex={0}
                      className="dropdown-content menu p-2 shadow bg-base-200 rounded-box w-32 absolute right-0 z-50 text-sm"
                    >
                      <li>
                        <button
                          onClick={handleEditAction}
                          className="flex items-center gap-2 w-full text-left hover:bg-base-300 disabled:opacity-50 p-2 rounded-md"
                          disabled={isUpdatingComment || isDeletingComment}
                        >
                          <FaEdit /> Edit
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={handleDeleteAction}
                          className="flex items-center gap-2 w-full text-left text-red-500 hover:bg-base-300 disabled:opacity-50 p-2 rounded-md"
                          disabled={isUpdatingComment || isDeletingComment}
                        >
                          {isDeletingComment && actionedReaction === null ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaTrashAlt />
                          )}
                          Delete
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              )}
            </div>

            {isEditing ? (
              <CommentForm
                onSubmit={handleEditSubmit}
                isLoading={isUpdatingComment}
                initialText={comment.text}
                submitError={
                  isUpdateError && updateErrorObject
                    ? (updateErrorObject as any)?.data?.message ||
                      "Failed to update."
                    : undefined
                }
                submitButtonText="Save Changes"
                onCancel={handleCloseEditForm}
                compact={true}
              />
            ) : (
              <p className="text-zinc-300 mt-1 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {processedCommentText}
              </p>
            )}

            {!isEditing && (
              <div className="mt-2 flex items-center space-x-3 sm:space-x-4 text-xs text-zinc-400">
                <button
                  onClick={() => handleToggleReaction("LIKED")}
                  className={`flex items-center gap-1 hover:text-green-400 disabled:opacity-70 ${
                    comment.isLikedByCurrentUser
                      ? "text-green-500 font-semibold"
                      : ""
                  }`}
                  disabled={!isAuthenticated || isThisReactionLoading}
                  aria-pressed={comment.isLikedByCurrentUser}
                >
                  <span className={iconWrapperClass}>
                    {isThisReactionLoading && actionedReaction === "LIKED" ? (
                      <FaSpinner className="animate-spin" />
                    ) : comment.isLikedByCurrentUser ? (
                      <FaThumbsUp />
                    ) : (
                      <FaRegThumbsUp />
                    )}
                  </span>
                  <span>{comment.likes}</span>
                </button>
                <button
                  onClick={() => handleToggleReaction("DISLIKED")}
                  className={`flex items-center gap-1 hover:text-red-400 disabled:opacity-70 ${
                    comment.isDislikedByCurrentUser
                      ? "text-red-500 font-semibold"
                      : ""
                  }`}
                  disabled={!isAuthenticated || isThisReactionLoading}
                  aria-pressed={comment.isDislikedByCurrentUser}
                >
                  <span className={iconWrapperClass}>
                    {isThisReactionLoading &&
                    actionedReaction === "DISLIKED" ? (
                      <FaSpinner className="animate-spin" />
                    ) : comment.isDislikedByCurrentUser ? (
                      <FaThumbsDown />
                    ) : (
                      <FaRegThumbsDown />
                    )}
                  </span>
                  <span>{comment.dislikes}</span>
                </button>
                {canReplyToThisComment && (
                  <button
                    onClick={
                      isReplying ? handleCloseReplyForm : handleOpenReplyForm
                    }
                    className="hover:text-blue-400 flex items-center gap-1 disabled:opacity-70"
                    disabled={isThisReactionLoading}
                  >
                    <FaReply /> {isReplying ? "Cancel" : "Reply"}
                  </button>
                )}
              </div>
            )}

            {!isEditing &&
              comment.level === 0 &&
              comment.totalDescendantRepliesCount !== undefined &&
              comment.totalDescendantRepliesCount > 0 && (
                <div className="mt-1.5 text-xs text-zinc-400">
                  This comment thread has {comment.totalDescendantRepliesCount}{" "}
                  total repl
                  {comment.totalDescendantRepliesCount === 1 ? "y" : "ies"}.
                </div>
              )}

            {isReplying && isAuthenticated && (
              <div className="mt-3">
                <CommentForm
                  onSubmit={handleReplySubmit}
                  isLoading={isSubmittingReply}
                  submitError={
                    isReplyError && replyErrorObject
                      ? (replyErrorObject as any)?.data?.message ||
                        "Failed to post reply."
                      : undefined
                  }
                  placeholder={`Replying to @${
                    comment.author?.username || "user"
                  }...`}
                  submitButtonText="Post Reply"
                  onCancel={handleCloseReplyForm}
                  compact={true}
                />
              </div>
            )}
          </div>
        </div>

        {comment.children && comment.children.length > 0 && (
          <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
            {comment.children.map((childComment) => (
              <CommentItem
                key={childComment.id}
                comment={childComment}
                currentUserId={currentUserId}
                postId={postId}
              />
            ))}
          </div>
        )}

        {areExtraRepliesExpanded && manuallyLoadedReplies.length > 0 && (
          <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
            {manuallyLoadedReplies.map((childComment) => (
              <CommentItem
                key={childComment.id}
                comment={childComment}
                currentUserId={currentUserId}
                postId={postId}
              />
            ))}
          </div>
        )}

        {!isReplying &&
          (showViewMoreDirectRepliesButton || showLoadMoreAndHideButtons) && (
            <div className="mt-2 pl-2 sm:pl-0">
              {showViewMoreDirectRepliesButton && (
                <button
                  onClick={handleToggleExpandReplies}
                  disabled={isFetchingMoreReplies && nextRepliesSkip === 0}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
                >
                  {isFetchingMoreReplies && nextRepliesSkip === 0 ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaCommentDots />
                  )}
                  {isFetchingMoreReplies && nextRepliesSkip === 0
                    ? "Loading Replies..."
                    : `View ${unshownInitialDirectRepliesCount} more direct repl${
                        unshownInitialDirectRepliesCount === 1 ? "y" : "ies"
                      }`}
                </button>
              )}
              {showLoadMoreAndHideButtons && (
                <>
                  {hasMoreRepliesToLoadServer && (
                    <button
                      onClick={handleFetchNextPageOfReplies}
                      disabled={isFetchingMoreReplies}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
                    >
                      {isFetchingMoreReplies ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaChevronDown />
                      )}
                      {isFetchingMoreReplies
                        ? "Loading More..."
                        : "Load More Direct Replies"}
                    </button>
                  )}
                  <button
                    onClick={handleToggleExpandReplies}
                    className="ml-2 text-xs text-zinc-400 hover:text-zinc-300 flex items-center gap-1"
                  >
                    <FaChevronUp /> Hide Replies
                  </button>
                </>
              )}
              {fetchRepliesErrorObject && areExtraRepliesExpanded && (
                <div className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <FaExclamationTriangle /> Could not load replies.
                </div>
              )}
            </div>
          )}
      </div>

      {isDeleteModalOpen && (
        <dialog id="delete_comment_modal" className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-zinc-200">
              Confirm Deletion
            </h3>
            <p className="py-4 text-zinc-300">
              Are you sure you want to delete this comment and all its replies?
              This action cannot be undone.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingComment}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={confirmDelete}
                disabled={isDeletingComment}
              >
                {isDeletingComment ? (
                  <>
                    <FaSpinner className="animate-spin" /> Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeletingComment}
            >
              close
            </button>
          </form>
        </dialog>
      )}
    </>
  );
};

export default CommentItem;
