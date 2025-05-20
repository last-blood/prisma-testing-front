"use client";

import React, { useState, useEffect, useCallback } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaEdit,
  FaExternalLinkAlt,
  FaUserCircle,
  FaImage as ImageIconPlaceholder,
  FaBookmark,
  FaRegBookmark,
  FaHeart,
  FaRegHeart,
  FaShareSquare,
  FaCheck,
  FaSpinner,
  FaInfoCircle,
  FaEye,
  FaSignInAlt,
  FaLock,
} from "react-icons/fa";
import { formatDistanceToNow, addHours, isPast } from "date-fns";
import { useSelector } from "react-redux";
import { selectCurrentUserId } from "@/lib/auth/authSlice";
import {
  useSavePostMutation,
  useUnsavePostMutation,
  useLikePostMutation,
  useUnlikePostMutation,
  useSharePostMutation,
  SharePlatformValue,
} from "@/lib/post/postSlice";
import type { ProjectCardData } from "./Projects";

const FALLBACK_PROJECT_IMAGE_PATH = "/fallback-project.jpg";
const FALLBACK_AVATAR_IMAGE_PATH = "/default-avatar.png";
const SHARE_COOLDOWN_HOURS = 12;

interface ProjectsCardProps {
  project: ProjectCardData;
}

const getShareTimestamps = (): Record<string, number> => {
  if (typeof window === "undefined") return {};
  const item = localStorage.getItem("projectShareCooldowns");
  return item ? JSON.parse(item) : {};
};

const setShareTimestamp = (postId: string) => {
  if (typeof window === "undefined") return;
  const timestamps = getShareTimestamps();
  timestamps[postId] = Date.now();
  localStorage.setItem("projectShareCooldowns", JSON.stringify(timestamps));
};

function ProjectsCard({ project }: ProjectsCardProps) {
  const router = useRouter();
  const currentUserId = useSelector(selectCurrentUserId);
  const isAuthenticated = !!currentUserId;
  const isProjectOwnerByCurrentUser = project.authorId === currentUserId;

  const profileLink = isProjectOwnerByCurrentUser
    ? "/profile"
    : `/profile/${project.authorId}`;
  const projectDetailLink = project.readMoreLink || `/projects/${project.id}`;

  const [projectImgSrc, setProjectImgSrc] = useState(
    project.image || FALLBACK_PROJECT_IMAGE_PATH
  );
  const [isProjectImageLoading, setIsProjectImageLoading] = useState(true);
  const [avatarSrc, setAvatarSrc] = useState(
    project.authorAvatar || FALLBACK_AVATAR_IMAGE_PATH
  );
  const [isAvatarImageLoading, setIsAvatarImageLoading] = useState(true);

  const [savePost, { isLoading: isSaving }] = useSavePostMutation();
  const [unsavePost, { isLoading: isUnsaving }] = useUnsavePostMutation();
  const [likePost, { isLoading: isLiking }] = useLikePostMutation();
  const [unlikePost, { isLoading: isUnliking }] = useUnlikePostMutation();
  const [sharePost, { isLoading: isSharing }] = useSharePostMutation();

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCooldownInfo, setShareCooldownInfo] = useState<{
    onCooldown: boolean;
    nextShareTimeFormatted: string | null;
  }>({ onCooldown: false, nextShareTimeFormatted: null });
  const [linkCopiedFeedback, setLinkCopiedFeedback] = useState(false);
  const [showLoginToReadModal, setShowLoginToReadModal] = useState(false);
  const [showLoginToInteractModal, setShowLoginToInteractModal] =
    useState(false);
  const [interactionTypePrompt, setInteractionTypePrompt] = useState<
    "like" | "save" | "share" | ""
  >("");

  const checkShareCooldown = useCallback(() => {
    if (!isAuthenticated)
      return { onCooldown: false, nextShareTimeFormatted: null };
    const timestamps = getShareTimestamps();
    const lastShareTimestamp = timestamps[project.id];
    if (lastShareTimestamp) {
      const cooldownEndTime = addHours(
        lastShareTimestamp,
        SHARE_COOLDOWN_HOURS
      );
      if (!isPast(cooldownEndTime)) {
        return {
          onCooldown: true,
          nextShareTimeFormatted: formatDistanceToNow(cooldownEndTime, {
            addSuffix: true,
          }),
        };
      }
    }
    return { onCooldown: false, nextShareTimeFormatted: null };
  }, [project.id, isAuthenticated]);

  const handleOpenShareModal = () => {
    if (!isAuthenticated) {
      setInteractionTypePrompt("share");
      setShowLoginToInteractModal(true);
      return;
    }
    setShareCooldownInfo(checkShareCooldown());
    setShowShareModal(true);
    setLinkCopiedFeedback(false);
  };

  const handleConfirmShareAndCopy = async () => {
    if (isSharing || !isAuthenticated) return;
    const projectUrl = `${window.location.origin}/projects/${project.id}`;
    try {
      await navigator.clipboard.writeText(projectUrl);
      setLinkCopiedFeedback(true);
      const currentCooldownStatus = checkShareCooldown();
      if (!currentCooldownStatus.onCooldown) {
        await sharePost({
          postId: project.id,
          platform: "LINK_COPIED",
        }).unwrap();
        setShareTimestamp(project.id);
      }
      setTimeout(() => {
        setShowShareModal(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to copy link or share post:", err);
      setShowShareModal(false);
    }
  };

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      setInteractionTypePrompt("save");
      setShowLoginToInteractModal(true);
      return;
    }
    if (isSaving || isUnsaving) return;
    if (project.isSavedByCurrentUser) {
      try {
        await unsavePost(project.id).unwrap();
      } catch (err) {
        console.error("Failed to unsave post:", err);
      }
    } else {
      try {
        await savePost(project.id).unwrap();
      } catch (err) {
        console.error("Failed to save post:", err);
      }
    }
  };

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      setInteractionTypePrompt("like");
      setShowLoginToInteractModal(true);
      return;
    }
    if (isLiking || isUnliking) return;
    if (project.isLikedByCurrentUser) {
      try {
        await unlikePost(project.id).unwrap();
      } catch (err) {
        console.error("Failed to unlike post:", err);
      }
    } else {
      try {
        await likePost(project.id).unwrap();
      } catch (err) {
        console.error("Failed to like post:", err);
      }
    }
  };

  useEffect(() => {
    const newSrc = project.image || FALLBACK_PROJECT_IMAGE_PATH;
    if (
      newSrc !== projectImgSrc ||
      (newSrc !== FALLBACK_PROJECT_IMAGE_PATH && isProjectImageLoading)
    ) {
      setIsProjectImageLoading(true);
      setProjectImgSrc(newSrc);
    } else if (
      newSrc === FALLBACK_PROJECT_IMAGE_PATH &&
      isProjectImageLoading
    ) {
      setIsProjectImageLoading(false);
    }
  }, [project.image, projectImgSrc, isProjectImageLoading]);

  useEffect(() => {
    const newSrc = project.authorAvatar || FALLBACK_AVATAR_IMAGE_PATH;
    if (
      newSrc !== avatarSrc ||
      (newSrc !== FALLBACK_AVATAR_IMAGE_PATH && isAvatarImageLoading)
    ) {
      setIsAvatarImageLoading(true);
      setAvatarSrc(newSrc);
    } else if (newSrc === FALLBACK_AVATAR_IMAGE_PATH && isAvatarImageLoading) {
      setIsAvatarImageLoading(false);
    }
  }, [project.authorAvatar, avatarSrc, isAvatarImageLoading]);

  const handleProjectImageError = () => {
    setIsProjectImageLoading(false);
    setProjectImgSrc(FALLBACK_PROJECT_IMAGE_PATH);
  };
  const handleProjectImageLoad = () => setIsProjectImageLoading(false);
  const handleAvatarError = () => {
    setIsAvatarImageLoading(false);
    setAvatarSrc(FALLBACK_AVATAR_IMAGE_PATH);
  };
  const handleAvatarLoad = () => setIsAvatarImageLoading(false);

  const showOverallSkeleton =
    isProjectImageLoading && projectImgSrc !== FALLBACK_PROJECT_IMAGE_PATH;

  useEffect(() => {
    if (showShareModal && isAuthenticated) {
      setShareCooldownInfo(checkShareCooldown());
    }
  }, [
    project.sharesCount,
    showShareModal,
    checkShareCooldown,
    isAuthenticated,
  ]);

  const handleNavigateToDetail = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setShowLoginToReadModal(true);
    }
  };

  return (
    <>
      <div className="relative flex flex-col rounded-xl overflow-hidden border border-zinc-700/60 bg-zinc-800 shadow-lg hover:border-zinc-600 hover:shadow-xl transition-all duration-300 ease-in-out group h-full">
        {showOverallSkeleton && (
          <div className="absolute inset-0 z-20 bg-zinc-800 animate-pulse p-4 flex flex-col">
            <div className="aspect-video w-full bg-zinc-700 rounded-md mb-4"></div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-zinc-700 rounded-full"></div>
              <div className="flex flex-col gap-1.5 flex-grow">
                <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
                <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-5 bg-zinc-700 rounded w-5/6 mb-2"></div>
            <div className="h-4 bg-zinc-700 rounded w-full mb-1"></div>
            <div className="h-4 bg-zinc-700 rounded w-full mb-3"></div>
            <div className="flex flex-wrap gap-2 mb-auto pt-2">
              <div className="h-5 w-14 bg-zinc-700 rounded-full"></div>
              <div className="h-5 w-16 bg-zinc-700 rounded-full"></div>
              <div className="h-5 w-12 bg-zinc-700 rounded-full"></div>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-4 pt-3 border-t-2 border-zinc-700/50">
              <div className="h-9 bg-zinc-700 rounded-lg"></div>
              <div className="h-9 bg-zinc-700 rounded-lg"></div>
              <div className="h-9 bg-zinc-700 rounded-lg"></div>
              <div className="h-9 bg-zinc-700 rounded-lg"></div>
            </div>
          </div>
        )}
        <div
          className={`flex flex-col h-full transition-opacity duration-300 ${
            showOverallSkeleton ? "opacity-0" : "opacity-100"
          }`}
        >
          <Link
            href={projectDetailLink}
            onClick={handleNavigateToDetail}
            aria-label={`View details for ${project.title || "project"}`}
            className="block group/imagefocus"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-zinc-700 group-hover/imagefocus:ring-2 group-hover/imagefocus:ring-blue-500 group-hover/imagefocus:ring-offset-2 group-hover/imagefocus:ring-offset-zinc-800 transition-all duration-150 rounded-t-xl">
              {isProjectImageLoading &&
                projectImgSrc !== FALLBACK_PROJECT_IMAGE_PATH && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-700">
                    {" "}
                    <ImageIconPlaceholder className="text-4xl text-zinc-500 animate-pulse" />{" "}
                  </div>
                )}
              <NextImage
                key={projectImgSrc + "-project-card"}
                src={projectImgSrc}
                alt={project.title || "Project image"}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`object-cover transition-all duration-500 ease-in-out group-hover:scale-105 ${
                  isProjectImageLoading &&
                  projectImgSrc !== FALLBACK_PROJECT_IMAGE_PATH
                    ? "opacity-0"
                    : "opacity-100"
                }`}
                onLoad={handleProjectImageLoad}
                onError={handleProjectImageError}
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </Link>

          <div className="p-4 flex flex-col flex-grow">
            <div className="flex items-start justify-between mb-3">
              <Link
                href={profileLink}
                className="flex items-center gap-2.5 group/author min-w-0 mr-2"
              >
                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0 flex items-center justify-center group-hover/author:ring-2 group-hover/author:ring-blue-400 transition-all duration-150">
                  {isAvatarImageLoading &&
                    avatarSrc !== FALLBACK_AVATAR_IMAGE_PATH && (
                      <div className="absolute inset-0 bg-zinc-600 animate-pulse rounded-full"></div>
                    )}
                  {!isAvatarImageLoading &&
                  avatarSrc === FALLBACK_AVATAR_IMAGE_PATH ? (
                    <FaUserCircle className="w-full h-full text-zinc-400 p-0.5" />
                  ) : (
                    <NextImage
                      key={avatarSrc + "-avatar-card"}
                      src={avatarSrc}
                      alt={project.authorName || "Author"}
                      fill
                      sizes="36px"
                      className={`object-cover transition-opacity duration-300 ${
                        isAvatarImageLoading &&
                        avatarSrc !== FALLBACK_AVATAR_IMAGE_PATH
                          ? "opacity-0"
                          : "opacity-100"
                      }`}
                      onLoad={handleAvatarLoad}
                      onError={handleAvatarError}
                    />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-zinc-100 truncate group-hover/author:text-blue-400 transition-colors">
                    {project.authorName || "Anonymous"}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {project.postedAt
                      ? formatDistanceToNow(new Date(project.postedAt), {
                          addSuffix: true,
                        })
                      : "Date unavailable"}
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                <div
                  className="p-1.5 flex items-center gap-1 text-zinc-400"
                  title={`${project.viewsCount} views`}
                >
                  <FaEye className="text-sm" />
                  <span className="text-xs">{project.viewsCount}</span>
                </div>

                <button
                  onClick={handleToggleLike}
                  disabled={isLiking || isUnliking}
                  className="p-1.5 rounded-full hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  aria-label={
                    isAuthenticated && project.isLikedByCurrentUser
                      ? "Unlike project"
                      : "Like project"
                  }
                  title={
                    !isAuthenticated
                      ? "Log in to like"
                      : project.isLikedByCurrentUser
                      ? "Unlike"
                      : "Like"
                  }
                >
                  {isLiking || isUnliking ? (
                    <FaSpinner className="animate-spin text-sm" />
                  ) : isAuthenticated && project.isLikedByCurrentUser ? (
                    <FaHeart className="text-red-500 text-sm" />
                  ) : (
                    <FaRegHeart className="text-sm" />
                  )}
                  <span className="text-xs">{project.likesCount}</span>
                </button>

                <button
                  onClick={handleToggleSave}
                  disabled={isSaving || isUnsaving}
                  className="p-1.5 rounded-full hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  aria-label={
                    isAuthenticated && project.isSavedByCurrentUser
                      ? "Unsave project"
                      : "Save project"
                  }
                  title={
                    !isAuthenticated
                      ? "Log in to save"
                      : project.isSavedByCurrentUser
                      ? "Unsave"
                      : "Save"
                  }
                >
                  {isSaving || isUnsaving ? (
                    <FaSpinner className="animate-spin text-sm" />
                  ) : isAuthenticated && project.isSavedByCurrentUser ? (
                    <FaBookmark className="text-blue-500 text-sm" />
                  ) : (
                    <FaRegBookmark className="text-sm" />
                  )}
                  <span className="text-xs">{project.savedCount}</span>
                </button>

                <button
                  onClick={handleOpenShareModal}
                  disabled={isSharing}
                  className="p-1.5 rounded-full hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  aria-label="Share project"
                  title="Share project"
                >
                  {isSharing ? (
                    <FaSpinner className="animate-spin text-sm" />
                  ) : (
                    <FaShareSquare className="text-sm" />
                  )}
                  <span className="text-xs">{project.sharesCount}</span>
                </button>
              </div>
            </div>

            <Link
              href={projectDetailLink}
              onClick={handleNavigateToDetail}
              className="block mb-auto group/textcontent"
            >
              <h3 className="text-lg font-semibold text-zinc-50 mb-1.5 line-clamp-2 group-hover/textcontent:text-blue-400 transition-colors cursor-pointer leading-snug">
                {project.title || "Untitled Project"}
              </h3>
              <p className="text-sm text-zinc-400 line-clamp-3 min-h-[3.75rem] group-hover/textcontent:text-zinc-300 transition-colors">
                {project.description || "No description available."}
              </p>
            </Link>

            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {project.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="bg-zinc-700/80 text-zinc-300 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap cursor-default hover:bg-zinc-600/80 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
                {project.tags.length > 3 && (
                  <span className="bg-zinc-600/80 text-xs px-3 py-1.5 rounded-full text-zinc-400 cursor-default">
                    + {project.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            <div className="mt-auto pt-4">
              <div
                className={`grid ${
                  isProjectOwnerByCurrentUser ? "grid-cols-2" : "grid-cols-1"
                } gap-2.5 pt-4 border-t border-zinc-700/70`}
              >
                <Link
                  href={projectDetailLink}
                  onClick={handleNavigateToDetail}
                  className="btn btn-sm btn-ghost text-blue-400 hover:bg-blue-500/10 justify-center gap-1.5 py-2 px-3 text-xs sm:text-sm flex items-center rounded-md"
                >
                  <FaExternalLinkAlt /> Read More
                </Link>
                {isProjectOwnerByCurrentUser && (
                  <Link
                    href={`/projects/${project.id}/edit`}
                    className="btn btn-sm btn-ghost text-green-400 hover:bg-green-500/10 justify-center gap-1.5 py-2 px-3 text-xs sm:text-sm flex items-center rounded-md"
                  >
                    <FaEdit /> Edit
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal (for authenticated users, shows cooldown info) */}
      {showShareModal && isAuthenticated && (
        <dialog
          id={`share_modal_authenticated_${project.id}`}
          className="modal modal-open"
        >
          <div className="modal-box bg-zinc-800 border-zinc-700">
            <form method="dialog">
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
                onClick={() => setShowShareModal(false)}
              >
                ✕
              </button>
            </form>
            <h3 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
              <FaShareSquare className="text-green-400" /> Share Project
            </h3>
            <p className="py-4 text-zinc-300">
              You're about to copy the link for "
              <strong>{project.title}</strong>".
            </p>
            {shareCooldownInfo.onCooldown && (
              <div className="text-sm text-amber-400 bg-amber-500/10 p-3 rounded-md mb-4 flex items-center gap-2">
                <FaInfoCircle />
                <span>
                  You recently recorded a share for this project. Your next
                  recorded share will be available{" "}
                  {shareCooldownInfo.nextShareTimeFormatted}. You can still copy
                  the link.
                </span>
              </div>
            )}
            {linkCopiedFeedback ? (
              <div className="flex items-center justify-center gap-2 text-green-400 p-3 bg-green-500/10 rounded-md">
                <FaCheck /> Link Copied to Clipboard!
              </div>
            ) : (
              <div className="modal-action justify-center mt-2">
                <button
                  className="btn btn-primary gap-2"
                  onClick={handleConfirmShareAndCopy}
                  disabled={isSharing}
                >
                  {isSharing ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaShareSquare />
                  )}
                  Copy Link {!shareCooldownInfo.onCooldown && "& Record Share"}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowShareModal(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowShareModal(false)}>close</button>
          </form>
        </dialog>
      )}

      {/* Login to Read Modal (triggered by navigation links) */}
      {showLoginToReadModal && (
        <dialog
          id={`login_to_read_modal_${project.id}`}
          className="modal modal-open"
        >
          <div className="modal-box bg-zinc-800 border-zinc-700">
            <form method="dialog">
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
                onClick={() => setShowLoginToReadModal(false)}
              >
                ✕
              </button>
            </form>
            <div className="flex flex-col items-center text-center">
              <FaSignInAlt className="text-4xl text-blue-400 mb-4" />
              <h3 className="font-bold text-xl text-zinc-100 mb-2">
                Access Full Project
              </h3>
              <p className="py-2 text-zinc-300 text-sm">
                Please log in or create an account to view the full details of
                this project.
              </p>
              <div className="w-full flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  className="btn btn-primary btn-block sm:flex-1"
                  onClick={() => {
                    setShowLoginToReadModal(false);
                    router.push("/login");
                  }}
                >
                  Log In
                </button>
                <button
                  className="btn btn-accent btn-block sm:flex-1"
                  onClick={() => {
                    setShowLoginToReadModal(false);
                    router.push("/signup");
                  }}
                >
                  Sign Up
                </button>
              </div>
              <button
                className="btn btn-sm btn-ghost text-zinc-500 mt-4"
                onClick={() => setShowLoginToReadModal(false)}
              >
                Maybe Later
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowLoginToReadModal(false)}>
              close
            </button>
          </form>
        </dialog>
      )}

      {/* Login to Interact Modal (for Like, Save, Share buttons) */}
      {showLoginToInteractModal && (
        <dialog
          id={`login_to_interact_modal_${project.id}`}
          className="modal modal-open"
        >
          <div className="modal-box bg-zinc-800 border-zinc-700 shadow-lg">
            <form method="dialog">
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
                onClick={() => setShowLoginToInteractModal(false)}
              >
                ✕
              </button>
            </form>
            <div className="flex flex-col items-center text-center">
              <FaLock className="text-4xl text-amber-400 mb-4" />
              <h3 className="font-bold text-xl text-zinc-100 mb-2">
                Please Log In
              </h3>
              <p className="py-2 text-zinc-300 text-sm">
                You need to be logged in to{" "}
                {interactionTypePrompt || "perform this action"}.
              </p>
              <p className="text-xs text-zinc-400 mb-6">
                Join our community to engage with projects!
              </p>
              <div className="w-full flex flex-col sm:flex-row gap-3">
                <button
                  className="btn btn-primary btn-block sm:flex-1"
                  onClick={() => {
                    setShowLoginToInteractModal(false);
                    router.push("/login");
                  }}
                >
                  Log In
                </button>
                <button
                  className="btn btn-accent btn-block sm:flex-1"
                  onClick={() => {
                    setShowLoginToInteractModal(false);
                    router.push("/signup");
                  }}
                >
                  Sign Up
                </button>
              </div>
              <button
                className="btn btn-sm btn-ghost text-zinc-500 mt-4"
                onClick={() => setShowLoginToInteractModal(false)}
              >
                Maybe Later
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowLoginToInteractModal(false)}>
              close
            </button>
          </form>
        </dialog>
      )}
    </>
  );
}

export default ProjectsCard;
