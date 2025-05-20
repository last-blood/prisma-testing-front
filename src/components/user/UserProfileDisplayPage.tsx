// @ts-nocheck
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
  FaImage as ImageIconPlaceholder, // Ensure FaImage is imported
} from "react-icons/fa";
import DOMPurify from "dompurify";

import {
  useGetPostByIdQuery,
  useDeletePostMutation,
  BackendPost,
} from "@/lib/post/postSlice";
import {
  selectCurrentUserId,
  selectIsAuthenticated,
} from "@/lib/auth/authSlice";

// Use string paths for fallbacks - ensure these files exist in your /public directory
const FALLBACK_PROJECT_IMAGE_PATH = "/fallback-project.jpg";
const FALLBACK_AVATAR_IMAGE_PATH = "/default-avatar.png";

function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = typeof params.id === "string" ? params.id : "";

  const {
    data: project, // This is BackendPost | undefined
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

  const currentUserId = useSelector(selectCurrentUserId);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletedSuccessfully, setIsDeletedSuccessfully] = useState(false);
  const [deletedProjectTitle, setDeletedProjectTitle] = useState("");

  const [isProjectImageLoading, setIsProjectImageLoading] = useState(true);
  const [projectImgSrc, setProjectImgSrc] = useState(
    FALLBACK_PROJECT_IMAGE_PATH
  );

  const [authorAvatarSrc, setAuthorAvatarSrc] = useState(
    FALLBACK_AVATAR_IMAGE_PATH
  );
  const [isAuthorAvatarLoading, setIsAuthorAvatarLoading] = useState(true);

  const isOwner =
    isAuthenticated && project && project.author?.id === currentUserId;

  useEffect(() => {
    console.log(
      "[ProjectDetailPage] Data state: project data loading:",
      isProjectDataLoading,
      "project object:",
      project
    );

    // If the main project data is still loading, keep image loaders active and sources to default.
    // This prevents premature processing or flashing of old images.
    if (isProjectDataLoading) {
      setIsProjectImageLoading(true);
      // setProjectImgSrc(FALLBACK_PROJECT_IMAGE_PATH); // Optionally reset src to ensure loading skeleton shows for fallback
      setIsAuthorAvatarLoading(true);
      // setAuthorAvatarSrc(FALLBACK_AVATAR_IMAGE_PATH); // Optionally reset
      return; // Wait for project data to settle
    }

    // At this point, isProjectDataLoading is false.
    // Now, check if the project object itself exists.
    if (project) {
      // Handle Project Image
      const newProjectImgUrl = project.postImage || FALLBACK_PROJECT_IMAGE_PATH;
      if (newProjectImgUrl !== projectImgSrc) {
        console.log(
          "[ProjectDetailPage] Project image URL changed. New:",
          newProjectImgUrl,
          "Old:",
          projectImgSrc
        );
        setIsProjectImageLoading(true); // Set loading true for the new source
        setProjectImgSrc(newProjectImgUrl);
      } else if (
        newProjectImgUrl === FALLBACK_PROJECT_IMAGE_PATH &&
        isProjectImageLoading
      ) {
        // If current src is already the fallback and it was still marked as loading, mark as not loading.
        setIsProjectImageLoading(false);
      }

      // Handle Author Avatar
      const newAuthorAvatarUrl =
        project.author?.profileImage || FALLBACK_AVATAR_IMAGE_PATH;
      if (newAuthorAvatarUrl !== authorAvatarSrc) {
        console.log(
          "[ProjectDetailPage] Author avatar URL changed. New:",
          newAuthorAvatarUrl,
          "Old:",
          authorAvatarSrc
        );
        setIsAuthorAvatarLoading(true); // Set loading true for the new source
        setAuthorAvatarSrc(newAuthorAvatarUrl);
      } else if (
        newAuthorAvatarUrl === FALLBACK_AVATAR_IMAGE_PATH &&
        isAuthorAvatarLoading
      ) {
        setIsAuthorAvatarLoading(false);
      }
    } else {
      // No project data, and overall data loading is finished (e.g., error or not found by query)
      console.log(
        "[ProjectDetailPage] No project data after load, setting images to fallbacks."
      );
      setIsProjectImageLoading(false);
      setProjectImgSrc(FALLBACK_PROJECT_IMAGE_PATH);
      setIsAuthorAvatarLoading(false);
      setAuthorAvatarSrc(FALLBACK_AVATAR_IMAGE_PATH);
    }
    // Key dependencies:
    // - 'project': The main data object. When it changes, re-evaluate images.
    // - 'isProjectDataLoading': The loading state of the main data. Crucial for initial setup.
    // - 'projectImgSrc', 'authorAvatarSrc': To compare current src with new src from 'project'
    //   and avoid unnecessary state updates if the URL hasn't actually changed.
  }, [project, isProjectDataLoading, projectImgSrc, authorAvatarSrc]);

  useEffect(() => {
    if (isDeleteSuccess && project) {
      setDeletedProjectTitle(project.title);
      setIsDeletedSuccessfully(true);
      setShowDeleteModal(false);
    }
  }, [isDeleteSuccess, project]);

  const handleDeleteProject = async () => {
    if (!project) return;
    try {
      await deletePostTrigger(project.id).unwrap();
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const handleProjectImageError = () => {
    console.log(
      "[ProjectDetailPage] Project Image ERROR loading:",
      projectImgSrc
    );
    setIsProjectImageLoading(false);
    setProjectImgSrc(FALLBACK_PROJECT_IMAGE_PATH);
  };
  const handleProjectImageLoad = () => {
    console.log("[ProjectDetailPage] Project Image LOADED:", projectImgSrc);
    setIsProjectImageLoading(false);
  };

  const handleAuthorAvatarError = () => {
    console.log(
      "[ProjectDetailPage] Author Avatar ERROR loading:",
      authorAvatarSrc
    );
    setIsAuthorAvatarLoading(false);
    setAuthorAvatarSrc(FALLBACK_AVATAR_IMAGE_PATH);
  };
  const handleAuthorAvatarLoad = () => {
    console.log("[ProjectDetailPage] Author Avatar LOADED:", authorAvatarSrc);
    setIsAuthorAvatarLoading(false);
  };

  // Overall data loading state (for project text content, etc.)
  if (isProjectDataLoading && !project) {
    // Show main loader only if still fetching AND project is not yet available
    return (
      <div className="flex flex-col gap-4 justify-center items-center min-h-screen bg-zinc-950 text-zinc-100 p-6">
        <FaSpinner className="animate-spin text-5xl text-blue-500" />
        <p className="text-xl text-zinc-300">Loading Project Details...</p>
      </div>
    );
  }

  // Overall data error state or project not found after loading
  if (
    isProjectDataError ||
    (!project && !isProjectDataLoading && !isProjectDataFetching)
  ) {
    let errorDetail = "Unknown error";
    if (projectDataError) {
      // @ts-ignore
      errorDetail =
        (projectDataError as any)?.data?.message ||
        (projectDataError as any)?.error ||
        (projectDataError as any)?.message ||
        "Project data could not be fetched.";
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
        <p className="text-sm text-zinc-500 mb-6">Details: {errorDetail}</p>
        <div className="flex gap-4">
          <button
            onClick={() => refetchProject()}
            className="btn btn-primary btn-outline"
          >
            Try Reloading
          </button>
          <Link href="/projects" className="btn btn-ghost">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  // If after all loading/error checks, project is still null (should be rare if logic above is right)
  if (!project) {
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
          Back to Projects
        </Link>
      </div>
    );
  }

  if (isDeletedSuccessfully) {
    // ... (Post-deletion success screen - unchanged)
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
              className="btn btn-primary btn-md sm:btn-lg flex-1 group"
            >
              <FaHome className="group-hover:scale-110 transition-transform" />{" "}
              Go to All Projects
            </Link>
            <Link
              href="/projects/create"
              className="btn btn-secondary btn-outline btn-md sm:btn-lg flex-1 group"
            >
              <FaPlusCircle className="group-hover:rotate-90 transition-transform" />{" "}
              Create New Project
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const cleanContent = project.content
    ? DOMPurify.sanitize(project.content, { USE_PROFILES: { html: true } })
    : "";

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
          {/* Project Image with Loading State */}
          <div className="relative w-full aspect-[16/7] bg-zinc-700">
            {isProjectImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-700 animate-pulse">
                <ImageIconPlaceholder className="text-5xl text-zinc-500" />
              </div>
            )}
            <NextImage
              key={projectImgSrc + "-project"} // Unique key part
              src={projectImgSrc}
              alt={project.title}
              fill
              priority
              className={`object-cover transition-opacity duration-500 ${
                isProjectImageLoading ? "opacity-0" : "opacity-100"
              }`}
              onLoad={handleProjectImageLoad}
              onError={handleProjectImageError}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px"
            />
            {!isProjectImageLoading && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
            )}
          </div>

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
                      className="btn btn-sm btn-outline btn-info gap-2"
                    >
                      <FaEdit /> Edit
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="btn btn-sm btn-outline btn-error gap-2"
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

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-400 mt-2">
                <div className="flex items-center gap-2">
                  <div className="relative w-7 h-7 rounded-full overflow-hidden bg-zinc-600 flex items-center justify-center">
                    {isAuthorAvatarLoading && (
                      <div className="absolute inset-0 bg-zinc-600 animate-pulse rounded-full"></div>
                    )}
                    {!isAuthorAvatarLoading &&
                    authorAvatarSrc === FALLBACK_AVATAR_IMAGE_PATH ? (
                      <FaUserCircle className="w-full h-full text-zinc-400" />
                    ) : (
                      <NextImage
                        key={authorAvatarSrc + "-author"} // Unique key part
                        src={authorAvatarSrc}
                        alt={project.author?.name || "Author"}
                        fill // 'fill' is good for avatars if parent has fixed size and overflow:hidden
                        className={`object-cover transition-opacity duration-300 ${
                          isAuthorAvatarLoading ? "opacity-0" : "opacity-100"
                        }`}
                        onLoad={handleAuthorAvatarLoad}
                        onError={handleAuthorAvatarError}
                        sizes="28px" // For 'fill', sizes can hint at optimal image version
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
                {project.updatedAt &&
                  project.updatedAt !== project.createdAt && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      (Updated{" "}
                      {formatDistanceToNow(parseISO(project.updatedAt), {
                        addSuffix: true,
                      })}
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
              {cleanContent ? (
                <div dangerouslySetInnerHTML={{ __html: cleanContent }} />
              ) : (
                <p className="italic text-zinc-500">
                  No detailed content provided.
                </p>
              )}
            </div>
          </div>
        </article>
      </div>

      {showDeleteModal && (
        <div
          className={`modal modal-open ${
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
                Error:{" "}
                {(deleteError as any)?.data?.message ||
                  "Could not delete project."}
              </div>
            )}
            <div className="modal-action">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-ghost"
                disabled={isDeleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="btn btn-error"
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
