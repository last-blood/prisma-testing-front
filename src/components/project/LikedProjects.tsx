// src/components/LikedProjects/LikedProjectsPage.tsx (or your preferred path e.g., app/liked-projects/page.tsx)
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  FaSearch,
  FaTimes,
  FaSpinner,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaHeart, // Icon for the page title
} from "react-icons/fa";
// import Link from "next/link"; // Only if needed for e.g., "Find Projects" button

import ProjectsCard from "./ProjectsCard"; // Adjust path if ProjectsCard is elsewhere
import {
  useGetMyLikedPostsQuery,
  useGetMySavedPostsQuery, // To determine isSavedByCurrentUser for liked posts
  BackendPost as SliceBackendPost,
} from "@/lib/post/postSlice";
import { useSelector } from "react-redux";
import { selectCurrentUserId } from "@/lib/auth/authSlice";
import {
  parseISO,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  subMonths,
  startOfYear,
  endOfYear,
} from "date-fns";

const dateFilterOptions = [
  { value: "all", label: "All Time" },
  { value: "thisWeek", label: "This Week" },
  { value: "last3Months", label: "Last 3 Months" },
  { value: "thisYear", label: "This Year" },
];

const CARD_FALLBACK_IMAGE_PATH = "/fallback-project.jpg";

function LikedProjectsPage() {
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState<string>("all");

  const currentUserId = useSelector(selectCurrentUserId);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    data: myLikedPosts,
    isLoading: isLoadingLiked,
    isError: isErrorLiked,
    error: errorLiked,
    refetch: refetchLiked,
  } = useGetMyLikedPostsQuery(undefined, {
    skip: !currentUserId || !isClient,
  });

  // Fetch saved posts to determine `isSavedByCurrentUser` for each liked post
  const { data: mySavedPostsData, isLoading: isLoadingSavedForLiked } =
    useGetMySavedPostsQuery(undefined, {
      skip: !currentUserId || !isClient,
    });

  const savedPostIds = useMemo(() => {
    if (!mySavedPostsData) return new Set<string>();
    return new Set(mySavedPostsData.map((post) => post.id));
  }, [mySavedPostsData]);

  const projectsToDisplay = useMemo(() => {
    if (!myLikedPosts) return [];
    return myLikedPosts.map((post: SliceBackendPost) => ({
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
      isLikedByCurrentUser: true, // All posts here are liked by the current user
      likesCount: post.likesCount || 0,
      isSavedByCurrentUser: savedPostIds.has(post.id), // Check if this liked post is also saved
      savedCount: post.savedCount || 0,
      commentsCount: post.commentsCount || 0,
      viewsCount: post.viewsCount || 0,
      sharesCount: post.sharesCount || 0, // <<<< ADDED THIS LINE
    }));
  }, [myLikedPosts, savedPostIds]);

  const uniqueTagsFromLiked = useMemo(() => {
    const allTags = new Set<string>();
    if (myLikedPosts) {
      myLikedPosts.forEach((project) => {
        project.postTags.forEach((tag) => allTags.add(tag));
      });
    }
    return Array.from(allTags).sort();
  }, [myLikedPosts]);

  const clientFilteredLikedProjects = useMemo(() => {
    let projects = projectsToDisplay;
    if (dateFilter !== "all") {
      const now = new Date();
      projects = projects.filter((project) => {
        const projectDate = parseISO(project.postedAt);
        if (dateFilter === "thisWeek") {
          return isWithinInterval(projectDate, {
            start: startOfWeek(now, { weekStartsOn: 1 }),
            end: endOfWeek(now, { weekStartsOn: 1 }),
          });
        } else if (dateFilter === "last3Months") {
          return projectDate >= subMonths(now, 3);
        } else if (dateFilter === "thisYear") {
          return isWithinInterval(projectDate, {
            start: startOfYear(now),
            end: endOfYear(now),
          });
        }
        return true;
      });
    }
    if (selectedTags.size > 0) {
      projects = projects.filter((project) =>
        project.tags.some((tag) => selectedTags.has(tag))
      );
    }
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      projects = projects.filter(
        (project) =>
          project.title.toLowerCase().includes(lowerSearchTerm) ||
          project.description.toLowerCase().includes(lowerSearchTerm) ||
          project.authorName.toLowerCase().includes(lowerSearchTerm) ||
          project.tags.some((tag) =>
            tag.toLowerCase().includes(lowerSearchTerm)
          )
      );
    }
    return projects;
  }, [projectsToDisplay, dateFilter, selectedTags, searchTerm]);

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

  const overallIsLoading =
    isLoadingLiked || (currentUserId && isLoadingSavedForLiked);

  if (!isClient) {
    return (
      <section className="flex flex-col items-center justify-center gap-3 min-h-[60vh]">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <p className="text-zinc-400">Initializing page...</p>
      </section>
    );
  }

  if (!currentUserId) {
    return (
      <section className="flex flex-col items-center justify-center gap-3 min-h-[60vh] text-center">
        <FaExclamationTriangle className="text-5xl text-yellow-500 mb-4" />
        <p className="text-zinc-300 font-semibold text-lg">
          Please log in to view your liked projects.
        </p>
      </section>
    );
  }

  if (overallIsLoading) {
    return (
      <section className="flex flex-col items-center justify-center gap-3 min-h-[60vh]">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <p className="text-zinc-400">Loading your liked projects...</p>
      </section>
    );
  }

  if (isErrorLiked) {
    return (
      <section className="flex flex-col items-center justify-center gap-3 min-h-[60vh] text-center">
        <FaExclamationTriangle className="text-5xl text-red-500 mb-4" />
        <p className="text-red-400 font-semibold">
          Failed to load liked projects.
        </p>
        {errorLiked && (
          <p className="text-red-400/80 text-sm max-w-md">
            Error:{" "}
            {(errorLiked as any).data?.message ||
              (errorLiked as any).error ||
              "An unknown error."}
          </p>
        )}
        <button
          onClick={() => refetchLiked()}
          className="btn btn-primary btn-outline mt-4"
        >
          Try Reloading
        </button>
      </section>
    );
  }

  const finalProjectsToRender = clientFilteredLikedProjects;
  const hasActiveFilters =
    searchTerm || selectedTags.size > 0 || dateFilter !== "all";

  return (
    <section className="flex flex-col gap-6 p-4 md:p-1 text-zinc-100">
      <div className="p-3 py-5 bg-zinc-900 border-b-2 border-red-500 rounded-t-lg mb-0">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 flex items-center gap-3">
          <FaHeart className="text-red-400" />
          My Liked Projects
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:items-center p-3 bg-zinc-900 border border-zinc-700/50 rounded-lg">
        <div className="relative flex-grow md:flex-grow-0 md:w-full md:max-w-sm">
          <input
            type="text"
            placeholder="Search your liked projects..."
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
            aria-label="Filter liked projects by post date"
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

      {uniqueTagsFromLiked.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center p-3 bg-zinc-900 border border-zinc-700/50 rounded-lg">
          <span className="text-sm text-zinc-400 mr-2 shrink-0">
            Filter by tag:
          </span>
          <div className="flex flex-wrap gap-2">
            {uniqueTagsFromLiked.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`badge text-xs px-3 py-2 rounded-full cursor-pointer transition-all duration-150 ease-in-out font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
                  selectedTags.has(tag)
                    ? "bg-red-500 text-white hover:bg-red-600 focus:ring-red-400" // Theme for liked
                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-zinc-100 focus:ring-zinc-500"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {!overallIsLoading && finalProjectsToRender.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5 sm:gap-6">
          {finalProjectsToRender.map((project) => (
            <ProjectsCard key={project.id} project={project} />
          ))}
        </div>
      ) : !overallIsLoading && myLikedPosts && myLikedPosts.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-4 border border-dashed border-zinc-700 rounded-lg bg-zinc-900/50 min-h-[300px] justify-center">
          <FaHeart className="text-4xl text-red-400" />
          <p className="text-zinc-300 text-lg font-semibold">
            You haven't liked any projects yet.
          </p>
          <p className="text-zinc-400 text-sm">
            Browse projects and click the heart icon to show your appreciation!
          </p>
        </div>
      ) : (
        !overallIsLoading && (
          <div className="text-center py-16 flex flex-col items-center gap-4 border border-dashed border-zinc-700 rounded-lg bg-zinc-900/50 min-h-[300px] justify-center">
            <FaExclamationTriangle className="text-4xl text-yellow-500" />
            <p className="text-zinc-300 text-lg font-semibold">
              No liked projects found matching your criteria.
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
          </div>
        )
      )}
    </section>
  );
}

export default LikedProjectsPage;
