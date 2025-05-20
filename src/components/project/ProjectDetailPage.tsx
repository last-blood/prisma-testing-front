// filePath: @/app/projects/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  FaEdit,
  FaTrashAlt,
  FaArrowLeft,
  FaSpinner,
  FaExclamationTriangle,
  FaUserCircle,
  FaCalendarAlt,
  FaTags,
  FaRegFileAlt,
  FaHome,
  FaPlusCircle,
  FaImage as ImageIconPlaceholder,
  FaBookmark,
  FaHeart,
  FaEye,
  FaSignInAlt,
} from "react-icons/fa";
import DOMPurify from "dompurify";

import {
  useGetPostByIdQuery,
  useDeletePostMutation,
  useRecordPostViewMutation,
  BackendPost,
  // PostCategoryValue, // Not directly used in this file's logic beyond BackendPost type
} from "@/lib/post/postSlice";
import {
  selectCurrentUserId,
  selectIsAuthenticated,
} from "@/lib/auth/authSlice";
import CommentSection from "./CommentSection"; // Ensure this path is correct

const FALLBACK_AVATAR_IMAGE_PATH = "/default-avatar.png";
const FALLBACK_PROJECT_IMAGE_PATH = "/fallback-project.jpg";

// PostCategory enum was in your previous file, keeping it for formatCategoryName if it's used by BackendPost or elsewhere implicitly
// If not, it can be removed. For now, assuming it might be related to PostCategoryValue.
export enum PostCategory {
  PROJECT = "PROJECT",
  TOP_PROJECT = "TOP_PROJECT",
  BLOG = "BLOG",
  LESSON = "LESSON",
  RESOURCE = "RESOURCE",
  ARTICLE = "ARTICLE",
  CONCEPT = "CONCEPT",
}

function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = typeof params.id === "string" ? params.id : "";

  const [hasRecordedView, setHasRecordedView] = useState(false);
  const [isRecordingView, setIsRecordingView] = useState(false); // <<< FIX: In-flight flag

  const {
    data: project,
    isLoading: isProjectDataLoading,
    isFetching: isProjectDataFetching,
    isError: isProjectDataError,
    error: projectDataError,
    refetch: refetchProject,
  } = useGetPostByIdQuery(projectId, {
    skip: !projectId,
  });

  const [
    deletePostTrigger,
    {
      isLoading: isDeleteLoading,
      isSuccess: isDeleteSuccess,
      error: deleteError,
    },
  ] = useDeletePostMutation();

  const [recordPostView] = useRecordPostViewMutation();

  const currentUserId = useSelector(selectCurrentUserId);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletedSuccessfully, setIsDeletedSuccessfully] = useState(false);
  const [deletedProjectTitle, setDeletedProjectTitle] = useState("");

  const [authorAvatarSrc, setAuthorAvatarSrc] = useState(
    FALLBACK_AVATAR_IMAGE_PATH
  );
  const [isAuthorAvatarLoading, setIsAuthorAvatarLoading] = useState(true);

  const isOwner =
    isAuthenticated && project && project.author?.id === currentUserId;

  useEffect(() => {
    // console.log for debugging view recording conditions, you can keep or remove
    // console.log(
    //   "View Record Effect Check: hasRecordedView:", hasRecordedView,
    //   "isRecordingView:", isRecordingView,
    //   "projectId:", !!projectId,
    //   "isAuthenticated:", isAuthenticated,
    //   "project_exists:", !!project,
    //   "isNotOwner:", project ? project.authorId !== currentUserId : "N/A",
    //   "notLoading:", !isProjectDataLoading,
    //   "notFetching:", !isProjectDataFetching
    // );
    if (
      !hasRecordedView && // 1. View hasn't been successfully recorded yet
      !isRecordingView && // 2. <<< FIX: No recording attempt is currently in progress
      projectId && // 3. We have a projectId
      isAuthenticated && // 4. User is authenticated
      project && // 5. Project data is loaded
      project.authorId && // 6. Project has an authorId (ensure BackendPost includes authorId)
      project.authorId !== currentUserId && // 7. Current user is not the author
      !isProjectDataLoading && // 8. Initial load is complete
      !isProjectDataFetching // 9. Not currently refetching data
    ) {
      // console.log("View Record Effect: CONDITIONS MET, initiating view record for", projectId);
      setIsRecordingView(true); // <<< FIX: Set in-flight flag

      recordPostView(projectId)
        .unwrap()
        .then((payload) => {
          // console.log("View Record Effect: View recorded successfully, total unique views:", payload.totalUniqueViews);
          setHasRecordedView(true);
        })
        .catch((err) => {
          // <<< FIX: Ensure 'err' parameter is defined for console.error
          console.error("View Record Effect: Failed to record view:", err);
          setHasRecordedView(true); // Still set true to prevent retries on persistent errors
        })
        .finally(() => {
          // console.log("View Record Effect: Recording attempt finished, setting isRecordingView to false.");
          setIsRecordingView(false); // <<< FIX: Clear in-flight flag
        });
    }
    // else { // Optional detailed logging for why conditions were not met
    //   if (isRecordingView) {
    //     console.log("View Record Effect: Conditions NOT MET (already recording view).");
    //   } else if (hasRecordedView) {
    //     console.log("View Record Effect: Conditions NOT MET (view already recorded).");
    //   }
    // }
  }, [
    hasRecordedView,
    isRecordingView, // <<< FIX: Add new state to dependency array
    projectId,
    isAuthenticated,
    currentUserId,
    project,
    isProjectDataLoading,
    isProjectDataFetching,
    recordPostView,
  ]);

  useEffect(() => {
    if (project) {
      const newAuthorAvatarSrc =
        project.author?.profileImage || FALLBACK_AVATAR_IMAGE_PATH;
      if (newAuthorAvatarSrc !== authorAvatarSrc) {
        setIsAuthorAvatarLoading(true);
        setAuthorAvatarSrc(newAuthorAvatarSrc);
      } else if (
        newAuthorAvatarSrc === FALLBACK_AVATAR_IMAGE_PATH &&
        isAuthorAvatarLoading
      ) {
        setIsAuthorAvatarLoading(false);
      }
    } else if (!isProjectDataLoading) {
      // Check !isProjectDataLoading to avoid resetting during initial load
      setIsAuthorAvatarLoading(false);
      setAuthorAvatarSrc(FALLBACK_AVATAR_IMAGE_PATH);
    }
  }, [project, isProjectDataLoading, authorAvatarSrc, isAuthorAvatarLoading]); // Removed isProjectDataFetching as isProjectDataLoading covers initial load

  useEffect(() => {
    if (isDeleteSuccess && project) {
      // project might be stale here if not refetched or cleared from cache
      setDeletedProjectTitle(project.title); // Consider using a state variable set before deletePostTrigger if project becomes undefined after delete
      setIsDeletedSuccessfully(true);
      setShowDeleteModal(false);
    }
  }, [isDeleteSuccess, project]); // project as dependency here can be tricky post-deletion

  const handleDeleteProject = async () => {
    if (!project) return;
    // It's safer to capture any needed info from 'project' before the delete call,
    // as 'project' data might be removed from cache after deletion.
    const titleToDelete = project.title;
    try {
      await deletePostTrigger(project.id).unwrap();
      setDeletedProjectTitle(titleToDelete); // Use the captured title
      // isDeleteSuccess will become true, triggering the useEffect above
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const handleAuthorAvatarError = () => {
    setIsAuthorAvatarLoading(false);
    setAuthorAvatarSrc(FALLBACK_AVATAR_IMAGE_PATH);
  };
  const handleAuthorAvatarLoad = () => setIsAuthorAvatarLoading(false);

  if (
    isProjectDataLoading ||
    (isProjectDataFetching && !project && !isDeletedSuccessfully)
  ) {
    return (
      <div className="flex flex-col gap-4 justify-center items-center min-h-screen bg-zinc-950 text-zinc-100 p-6">
        <FaSpinner className="animate-spin text-5xl text-blue-500" />
        <p className="text-xl text-zinc-300">Loading Project Details...</p>
      </div>
    );
  }

  if (
    isProjectDataError ||
    (!project &&
      !isProjectDataFetching &&
      !isProjectDataLoading &&
      !isDeletedSuccessfully) // Added !isProjectDataLoading and check for delete
  ) {
    let errorDetailMsg = "Project data could not be fetched.";
    if (projectDataError) {
      errorDetailMsg =
        (projectDataError as any)?.data?.message ||
        (projectDataError as any)?.error ||
        (projectDataError as any)?.message ||
        "An unknown error occurred fetching project data.";
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-center p-6 text-zinc-100">
        <FaExclamationTriangle className="text-6xl text-red-500 mb-6" />
        <h2 className="text-3xl font-semibold text-red-400 mb-3">
          Oops! Project Not Found
        </h2>
        <p className="text-zinc-400 mb-8 max-w-md">
          We couldn't find the project you were looking for.
        </p>
        <p className="text-sm text-zinc-500 mb-6">Details: {errorDetailMsg}</p>
        <div className="flex gap-4">
          <button
            onClick={() => refetchProject()}
            className="btn btn-primary btn-outline" // Assuming DaisyUI or similar classes
          >
            Try Reloading
          </button>
          <Link href="/projects" className="btn btn-ghost">
            {" "}
            {/* Assuming DaisyUI or similar classes */}
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  // This condition can be hit if project becomes null after loading/fetching is false, but not due to error or delete.
  // It's a safety net.
  if (!project && !isDeletedSuccessfully) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-center p-6 text-zinc-100">
        <FaExclamationTriangle className="text-6xl text-orange-400 mb-6" />
        <h2 className="text-3xl font-semibold text-orange-300 mb-3">
          Project Unavailable
        </h2>
        <p className="text-zinc-400 mb-8 max-w-md">
          The project data cannot be displayed at this moment.
        </p>
        <Link href="/projects" className="btn btn-ghost">
          {" "}
          {/* Assuming DaisyUI or similar classes */}
          Back to Projects
        </Link>
      </div>
    );
  }

  if (isDeletedSuccessfully) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 p-6 text-center">
        <div className="bg-zinc-800 p-8 sm:p-12 rounded-xl shadow-2xl border border-zinc-700 max-w-lg w-full">
          <FaTrashAlt className="text-5xl sm:text-6xl text-green-500 mb-6 mx-auto" />
          <h2 className="text-2xl sm:text-3xl font-bold text-green-400 mb-3">
            Project Deleted!
          </h2>
          <p className="text-zinc-300 mb-1 text-base sm:text-lg">
            The project titled{" "}
            <span className="font-semibold text-green-300">
              "{deletedProjectTitle}"
            </span>{" "}
            has been successfully deleted.
          </p>
          <p className="text-zinc-400 mb-8 text-sm">
            What would you like to do next?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/projects"
              className="btn btn-primary btn-md sm:btn-lg flex-1 group" // Assuming DaisyUI or similar classes
            >
              <FaHome className="group-hover:scale-110 transition-transform" />{" "}
              Go to All Projects
            </Link>
            <Link
              href="/projects/create"
              className="btn btn-secondary btn-outline btn-md sm:btn-lg flex-1 group" // Assuming DaisyUI or similar classes
            >
              <FaPlusCircle className="group-hover:rotate-90 transition-transform" />{" "}
              Create New Project
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If project is null at this point (should be caught by earlier conditions, but as a final fallback)
  if (!project) {
    return null; // Or some minimal fallback UI
  }

  const cleanContent = project.content
    ? DOMPurify.sanitize(project.content, { USE_PROFILES: { html: true } })
    : "";
  const imagesToDisplay =
    project.postImages && project.postImages.length > 0
      ? project.postImages
      : [FALLBACK_PROJECT_IMAGE_PATH];

  return (
    <div className="bg-zinc-950 min-h-screen text-zinc-100 py-8 px-4 md:px-8 lg:px-16">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors group"
          >
            <FaArrowLeft className="transform transition-transform group-hover:-translate-x-1" />
            Back to All Projects
          </Link>
        </div>

        <article className="bg-zinc-800 shadow-2xl rounded-xl overflow-hidden border border-zinc-700">
          {imagesToDisplay.length > 0 &&
            imagesToDisplay[0] !== FALLBACK_PROJECT_IMAGE_PATH && (
              <div className="carousel w-full aspect-[16/7] bg-zinc-700">
                {" "}
                {/* Using DaisyUI carousel classes */}
                {imagesToDisplay.map((imageSrc, index) => {
                  const slideId = `slide${index + 1}`;
                  const prevSlideId = `#slide${
                    index === 0 ? imagesToDisplay.length : index
                  }`;
                  const nextSlideId = `#slide${
                    index === imagesToDisplay.length - 1 ? 1 : index + 2
                  }`;
                  const isSingleImage = imagesToDisplay.length === 1;
                  return (
                    <div
                      id={slideId}
                      key={imageSrc + index} // Consider a more stable key if imageSrc can change but represent same item
                      className="carousel-item relative w-full"
                    >
                      <NextImage
                        src={imageSrc}
                        alt={`${project.title} - Image ${index + 1}`}
                        fill
                        priority={index === 0} // Prioritize the first image
                        className="object-contain w-full h-full" // Simpler class
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px"
                      />
                      {!isSingleImage && (
                        <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between z-10">
                          <a
                            href={prevSlideId}
                            className="btn btn-circle btn-sm md:btn-md bg-black/30 hover:bg-black/50 border-none text-white"
                          >
                            ❮
                          </a>
                          <a
                            href={nextSlideId}
                            className="btn btn-circle btn-sm md:btn-md bg-black/30 hover:bg-black/50 border-none text-white"
                          >
                            ❯
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          {(imagesToDisplay.length === 0 ||
            imagesToDisplay[0] === FALLBACK_PROJECT_IMAGE_PATH) && (
            <div className="relative w-full aspect-[16/7] bg-zinc-700 flex items-center justify-center">
              <ImageIconPlaceholder className="text-6xl text-zinc-500" />
              <p className="absolute bottom-4 text-zinc-400 text-sm">
                {imagesToDisplay.length === 0
                  ? "No images available"
                  : "Project Image"}
              </p>
            </div>
          )}

          <div className="p-6 md:p-8 lg:p-10">
            <header className="mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 leading-tight">
                  {project.title}
                </h1>
                {isOwner && (
                  <div className="flex gap-3 flex-shrink-0">
                    <Link
                      href={`/projects/${project.id}/edit`}
                      className="btn btn-sm btn-outline btn-info gap-2" // DaisyUI classes
                    >
                      <FaEdit /> Edit
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="btn btn-sm btn-outline btn-error gap-2" // DaisyUI classes
                      disabled={isDeleteLoading}
                    >
                      {isDeleteLoading ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaTrashAlt />
                      )}{" "}
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-zinc-400 mt-2">
                <div className="flex items-center gap-2">
                  <div className="relative w-7 h-7 rounded-full overflow-hidden bg-zinc-600 flex items-center justify-center">
                    {isAuthorAvatarLoading &&
                      authorAvatarSrc !== FALLBACK_AVATAR_IMAGE_PATH && (
                        <div className="absolute inset-0 bg-zinc-600 animate-pulse rounded-full"></div>
                      )}
                    {authorAvatarSrc === FALLBACK_AVATAR_IMAGE_PATH &&
                    !isAuthorAvatarLoading ? ( // Show icon if fallback and not loading
                      <FaUserCircle className="w-full h-full text-zinc-400" />
                    ) : (
                      <NextImage
                        key={authorAvatarSrc + "-author-avatar-detail"} // Unique key when src changes
                        src={authorAvatarSrc}
                        alt={project.author?.name || "Author"}
                        fill
                        className={`object-cover transition-opacity duration-300 ${
                          isAuthorAvatarLoading &&
                          authorAvatarSrc !== FALLBACK_AVATAR_IMAGE_PATH
                            ? "opacity-0"
                            : "opacity-100"
                        }`}
                        onLoad={handleAuthorAvatarLoad}
                        onError={handleAuthorAvatarError}
                        sizes="28px"
                      />
                    )}
                  </div>
                  <span>{project.author?.name || "Anonymous"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCalendarAlt />
                  <span>
                    Posted{" "}
                    {project.createdAt
                      ? formatDistanceToNow(parseISO(project.createdAt), {
                          addSuffix: true,
                        })
                      : "N/A"}
                  </span>
                </div>
                {typeof project.viewsCount === "number" && (
                  <div
                    className="flex items-center gap-1.5"
                    title={`${project.viewsCount} views`}
                  >
                    <FaEye className="text-gray-400" />
                    <span>{project.viewsCount}</span>
                  </div>
                )}
                {typeof project.likesCount === "number" && (
                  <div
                    className="flex items-center gap-1.5"
                    title={`${project.likesCount} likes`}
                  >
                    <FaHeart className="text-red-400" />
                    <span>{project.likesCount}</span>
                  </div>
                )}
                {typeof project.savedCount === "number" && (
                  <div
                    className="flex items-center gap-1.5"
                    title={`${project.savedCount} saves`}
                  >
                    <FaBookmark className="text-blue-400" />
                    <span>{project.savedCount}</span>
                  </div>
                )}
                {project.updatedAt &&
                  project.updatedAt !== project.createdAt && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      (Updated{" "}
                      {formatDistanceToNow(parseISO(project.updatedAt), {
                        addSuffix: true,
                      })}{" "}
                      )
                    </div>
                  )}
              </div>
            </header>

            {project.description && (
              <div className="mb-6 p-4 bg-zinc-700/30 rounded-lg border border-zinc-600/50">
                <h2 className="text-lg font-semibold text-zinc-200 mb-1 flex items-center gap-2">
                  <FaRegFileAlt /> Summary
                </h2>
                <p className="text-zinc-300 leading-relaxed">
                  {project.description}
                </p>
              </div>
            )}

            {project.postTags && project.postTags.length > 0 && (
              <div className="mb-6 md:mb-8">
                <h2 className="text-xl font-semibold text-zinc-200 mb-3 flex items-center gap-2">
                  <FaTags /> Technologies Used
                </h2>
                <div className="flex flex-wrap gap-2">
                  {project.postTags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-sky-500/20 text-sky-300 text-xs font-medium px-3 py-1.5 rounded-full border border-sky-500/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="prose prose-sm sm:prose-base prose-invert max-w-none prose-headings:text-zinc-100 prose-p:text-zinc-300 prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-strong:text-zinc-100 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-zinc-500 prose-blockquote:border-l-blue-500 prose-blockquote:text-zinc-400">
              <h2 className="text-xl font-semibold text-zinc-200 !mt-0 !mb-4">
                Project Details
              </h2>
              {isAuthenticated ? (
                cleanContent ? (
                  <div dangerouslySetInnerHTML={{ __html: cleanContent }} />
                ) : (
                  <p className="italic text-zinc-500">
                    No detailed content provided for this project.
                  </p>
                )
              ) : (
                <div className="my-6 p-6 bg-zinc-700/40 rounded-xl border border-zinc-600/70 text-center shadow-lg">
                  <FaSignInAlt className="text-5xl text-blue-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-zinc-100 mb-3">
                    Unlock Full Project Details & Comments
                  </h3>
                  <p className="text-zinc-300 mb-6 max-w-md mx-auto">
                    Please log in or create an account to access the complete
                    content and participate in the discussion like comments.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => router.push("/login")} // Assuming your login route
                      className="btn btn-primary btn-md flex-1 group" // DaisyUI classes
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => router.push("/signup")} // Assuming your signup route
                      className="btn btn-accent btn-outline btn-md flex-1 group" // DaisyUI classes
                    >
                      Sign Up
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isAuthenticated &&
              project && ( // Ensure project exists before rendering CommentSection
                <CommentSection postId={project.id} />
              )}
          </div>
        </article>
      </div>

      {/* Delete Confirmation Modal - Using DaisyUI modal classes if that's your UI library */}
      {/* Otherwise, this needs to be adapted to ShadCN Dialog as in your original snippet */}
      {showDeleteModal && (
        <div
          className={`modal modal-open ${
            // These are DaisyUI classes
            showDeleteModal ? "opacity-100 visible" : "opacity-0 invisible"
          } transition-all`}
        >
          <div className="modal-box bg-zinc-800 border border-zinc-700 shadow-xl">
            <h3 className="font-bold text-2xl text-red-400 flex items-center gap-2">
              <FaExclamationTriangle /> Confirm Deletion
            </h3>
            <p className="py-4 text-zinc-300">
              Are you sure you want to delete the project "
              <span className="font-semibold text-red-300">
                {project?.title}
              </span>
              "? This action cannot be undone.
            </p>
            {deleteError && (
              <div className="alert alert-error text-sm p-2 mb-3">
                {" "}
                {/* DaisyUI alert */}
                Error:{" "}
                {(deleteError as any)?.data?.message ||
                  "Could not delete project."}
              </div>
            )}
            <div className="modal-action">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-ghost" // DaisyUI button
                disabled={isDeleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="btn btn-error" // DaisyUI button
                disabled={isDeleteLoading}
              >
                {isDeleteLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaTrashAlt />
                )}{" "}
                Delete Project
              </button>
            </div>
          </div>
          {/* Optional: click outside to close, if not handled by modal-open + modal-box structure */}
          <div
            className="modal-backdrop bg-black/70"
            onClick={() => setShowDeleteModal(false)}
          ></div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetailPage;
