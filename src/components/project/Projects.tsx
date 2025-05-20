"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  FaSearch,
  FaTimes,
  FaSpinner,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaPlusCircle,
} from "react-icons/fa";
import Link from "next/link";
import ProjectsCard from "./ProjectsCard";
import {
  useGetAllPostsQuery,
  GetAllPostsParams,
  BackendPost as SliceBackendPost,
  useGetMySavedPostsQuery,
  useGetMyLikedPostsQuery,
} from "@/lib/post/postSlice";
import { useSelector } from "react-redux";
import { selectCurrentUserId } from "@/lib/auth/authSlice";

// --- Type Definitions ---
export interface ProjectCardData {
  id: string;
  authorId: string;
  image: string;
  title: string;
  description: string;
  tags: string[];
  readMoreLink?: string;
  postedAt: string;
  authorName: string;
  authorAvatar: string;
  savedCount: number;
  isSavedByCurrentUser: boolean;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  commentsCount: number;
  viewsCount: number;
  sharesCount: number; // Added for shares
}

const dateFilterOptions = [
  { value: "all", label: "All Time" },
  { value: "thisWeek", label: "This Week" },
  { value: "last3Months", label: "Last 3 Months" },
  { value: "thisYear", label: "This Year" },
];

const CARD_FALLBACK_IMAGE_PATH = "/fallback-project.jpg";

function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState<string>("all");

  const currentUserId = useSelector(selectCurrentUserId);

  const queryParams: GetAllPostsParams = useMemo(() => {
    const params: GetAllPostsParams = {};
    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    if (dateFilter !== "all") {
      params.dateFilter = dateFilter;
    }
    return params;
  }, [searchTerm, dateFilter]);

  const {
    data: fetchedPostsData,
    isLoading: isLoadingPosts,
    isError: isErrorPosts,
    error: postsError,
  } = useGetAllPostsQuery(queryParams);

  const { data: mySavedPostsData, isLoading: isLoadingMySavedPosts } =
    useGetMySavedPostsQuery(undefined, {
      skip: !currentUserId,
    });

  const { data: myLikedPostsData, isLoading: isLoadingMyLikedPosts } =
    useGetMyLikedPostsQuery(undefined, {
      skip: !currentUserId,
    });

  const savedPostIds = useMemo(() => {
    if (!mySavedPostsData) return new Set<string>();
    return new Set(mySavedPostsData.map((post) => post.id));
  }, [mySavedPostsData]);

  const likedPostIds = useMemo(() => {
    if (!myLikedPostsData) return new Set<string>();
    return new Set(myLikedPostsData.map((post) => post.id));
  }, [myLikedPostsData]);

  const projectsToDisplay: ProjectCardData[] = useMemo(() => {
    if (!fetchedPostsData) return [];
    return fetchedPostsData.map((post: SliceBackendPost) => ({
      id: post.id,
      authorId: post.authorId,
      image:
        post.postImages && post.postImages.length > 0
          ? post.postImages[0]
          : CARD_FALLBACK_IMAGE_PATH,
      title: post.title,
      description: post.description,
      tags: post.postTags,
      postedAt: post.createdAt,
      authorName: post.author?.name || "Anonymous",
      authorAvatar: post.author?.profileImage || "/default-avatar.png",
      readMoreLink: `/projects/${post.id}`,
      savedCount: post.savedCount || 0,
      isSavedByCurrentUser: savedPostIds.has(post.id),
      likesCount: post.likesCount || 0,
      isLikedByCurrentUser: likedPostIds.has(post.id),
      commentsCount: post.commentsCount || 0,
      viewsCount: post.viewsCount || 0,
      sharesCount: post.sharesCount || 0, // Populate sharesCount
    }));
  }, [fetchedPostsData, savedPostIds, likedPostIds]);

  const uniqueTags = useMemo(() => {
    const allTags = new Set<string>();
    if (fetchedPostsData) {
      fetchedPostsData.forEach((project) => {
        project.postTags.forEach((tag) => allTags.add(tag));
      });
    }
    return Array.from(allTags).sort();
  }, [fetchedPostsData]);

  const clientFilteredProjects = useMemo(() => {
    let projects = projectsToDisplay;
    if (selectedTags.size > 0) {
      projects = projects.filter((project) =>
        project.tags.some((tag) => selectedTags.has(tag))
      );
    }
    if (searchTerm && !queryParams.search) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      projects = projects.filter(
        (project) =>
          project.title.toLowerCase().includes(lowerSearchTerm) ||
          project.description.toLowerCase().includes(lowerSearchTerm) ||
          project.authorName.toLowerCase().includes(lowerSearchTerm)
      );
    }
    return projects;
  }, [projectsToDisplay, selectedTags, searchTerm, queryParams.search]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  const handleTagClick = (tag: string) => {
    setSelectedTags((prevSelectedTags) => {
      const newSelectedTags = new Set(prevSelectedTags);
      newSelectedTags.has(tag)
        ? newSelectedTags.delete(tag)
        : newSelectedTags.add(tag);
      return newSelectedTags;
    });
  };
  const handleDateFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setDateFilter(event.target.value);
  };
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTags(new Set());
    setDateFilter("all");
  };

  const isLoading =
    isLoadingPosts ||
    (currentUserId && isLoadingMySavedPosts) ||
    (currentUserId && isLoadingMyLikedPosts);

  if (isLoading) {
    return (
      <section className="flex flex-col items-center justify-center gap-3 min-h-[60vh]">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <p className="text-zinc-400">Loading projects...</p>
      </section>
    );
  }

  if (isErrorPosts) {
    return (
      <section className="flex flex-col items-center justify-center gap-3 min-h-[60vh] text-center">
        <FaExclamationTriangle className="text-5xl text-red-500 mb-4" />
        <p className="text-red-400 font-semibold">Failed to load projects.</p>
        {postsError && (
          <p className="text-red-400/80 text-sm max-w-md">
            Error:{" "}
            {(postsError as any).data?.message ||
              (postsError as any).error ||
              "An unknown error occurred. Please try again later."}
          </p>
        )}
      </section>
    );
  }

  const finalProjectsToRender = clientFilteredProjects;
  const hasActiveFilters =
    searchTerm || selectedTags.size > 0 || dateFilter !== "all";

  return (
    <section className="flex flex-col gap-6 p-4 md:p-1 text-zinc-100">
      {/* Filter Controls Row */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center p-3 bg-zinc-900 border border-zinc-700/50 rounded-lg">
        <div className="relative flex-grow md:flex-grow-0 md:w-full md:max-w-sm">
          <input
            type="text"
            placeholder="Search title, description, author..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="input input-bordered w-full pl-10 bg-zinc-800 border-zinc-700 focus:border-blue-500 focus:ring-blue-500 text-sm pr-8"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-zinc-100 p-1"
              aria-label="Clear search"
            >
              <FaTimes size={12} />
            </button>
          )}
        </div>

        <div className="relative flex-grow md:flex-grow-0 md:min-w-[180px]">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 pointer-events-none">
            <FaCalendarAlt />
          </div>
          <select
            value={dateFilter}
            onChange={handleDateFilterChange}
            className="select select-bordered w-full pl-10 bg-zinc-800 border-zinc-700 focus:border-blue-500 focus:ring-blue-500 text-sm"
            aria-label="Filter projects by date"
          >
            {dateFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="btn btn-sm btn-ghost text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 md:ml-auto"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Tag Filters */}
      {uniqueTags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center p-3 bg-zinc-900 border border-zinc-700/50 rounded-lg">
          <span className="text-sm text-zinc-400 mr-2 shrink-0">
            Filter by tag:
          </span>
          <div className="flex flex-wrap gap-2">
            {uniqueTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`badge text-xs px-3 py-2 rounded-full cursor-pointer transition-all duration-150 ease-in-out font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900
                  ${
                    selectedTags.has(tag)
                      ? "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-400"
                      : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-zinc-100 focus:ring-zinc-500"
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Projects Grid / No Results */}
      {finalProjectsToRender.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5 sm:gap-6">
          {finalProjectsToRender.map((project) => (
            <ProjectsCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 flex flex-col items-center gap-4 border border-dashed border-zinc-700 rounded-lg bg-zinc-900/50 min-h-[300px] justify-center">
          <FaExclamationTriangle className="text-4xl text-yellow-500" />
          {hasActiveFilters ? (
            <>
              <p className="text-zinc-300 text-lg font-semibold">
                No projects found matching your criteria.
              </p>
              <p className="text-zinc-400 text-sm">
                Try adjusting or clearing your search or filters.
              </p>
              <button
                onClick={clearFilters}
                className="btn btn-outline border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-500 mt-2"
              >
                Clear All Filters
              </button>
            </>
          ) : (
            <>
              <p className="text-zinc-300 text-lg font-semibold">
                No projects found yet.
              </p>
              <p className="text-zinc-400 text-sm">
                Be the first to share your work!
              </p>
              <Link
                href="/projects/create"
                className="btn btn-primary mt-2 flex items-center gap-2"
              >
                <FaPlusCircle /> Create Your First Project
              </Link>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default Projects;
