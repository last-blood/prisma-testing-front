// src/components/SavedProjects/SavedProjectsPage.tsx
// Or, based on your error: src/components/project/SavedProjects.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  FaSearch,
  FaTimes,
  FaSpinner,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaBookmark, // Icon for the page title
} from "react-icons/fa";

// Adjust path if ProjectsCard.tsx is elsewhere.
// If SavedProjectsPage.tsx is in src/components/project/
// and ProjectsCard.tsx is in src/components/Projects/
// then: import ProjectsCard from "../Projects/ProjectsCard";
// Using your provided relative path for now:
import ProjectsCard from "./ProjectsCard";

import {
  useGetMySavedPostsQuery,
  useGetMyLikedPostsQuery, // <<<< ADDED: Import hook to get user's liked posts
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
// Adjust path if Projects.tsx (where ProjectCardData is defined/exported) is elsewhere.
// If SavedProjectsPage.tsx is in src/components/project/
// and Projects.tsx is in src/components/Projects/
// then: import type { ProjectCardData } from "../Projects/Projects";
import type { ProjectCardData } from "./Projects";

const dateFilterOptions = [
  { value: "all", label: "All Time" },
  { value: "thisWeek", label: "This Week" },
  { value: "last3Months", label: "Last 3 Months" },
  { value: "thisYear", label: "This Year" },
];

const CARD_FALLBACK_IMAGE_PATH = "/fallback-project.jpg";

function SavedProjectsPage() {
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState<string>("all");

  const currentUserId = useSelector(selectCurrentUserId);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    data: mySavedPosts,
    isLoading: isLoadingSaved, // Renamed for clarity
    isError: isErrorSaved, // Renamed for clarity
    error: errorSaved, // Renamed for clarity
    refetch: refetchSaved,
  } = useGetMySavedPostsQuery(undefined, {
    skip: !currentUserId || !isClient,
  });

  // <<<< ADDED: Fetch liked posts to determine isLikedByCurrentUser for saved posts
  const { data: myLikedPostsData, isLoading: isLoadingLiked } =
    useGetMyLikedPostsQuery(undefined, {
      skip: !currentUserId || !isClient,
    });

  const likedPostIds = useMemo(() => {
    if (!myLikedPostsData) return new Set<string>();
    return new Set(myLikedPostsData.map((post) => post.id));
  }, [myLikedPostsData]);
  // >>>> END ADDED

  const projectsToDisplay: ProjectCardData[] = useMemo(() => {
    if (!mySavedPosts) return [];
    return mySavedPosts.map(
      (post: SliceBackendPost): ProjectCardData => ({
        // Ensure ProjectCardData is the return type
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
        isSavedByCurrentUser: true,
        savedCount: post.savedCount || 0,
        likesCount: post.likesCount || 0,
        isLikedByCurrentUser: likedPostIds.has(post.id), // <<<< ADDED: Populate this field
        commentsCount: post.commentsCount || 0,
        viewsCount: post.viewsCount || 0,
        sharesCount: post.sharesCount || 0, // <<<< ADDED THIS LINE
      })
    );
  }, [mySavedPosts, likedPostIds]); // <<<< ADDED: likedPostIds to dependency array

  const uniqueTagsFromSaved = useMemo(() => {
    const allTags = new Set<string>();
    if (mySavedPosts) {
      mySavedPosts.forEach((project) => {
        project.postTags.forEach((tag) => allTags.add(tag));
      });
    }
    return Array.from(allTags).sort();
  }, [mySavedPosts]);

  const clientFilteredSavedProjects = useMemo(() => {
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

  const overallIsLoading = isLoadingSaved || (currentUserId && isLoadingLiked); // <<<< MODIFIED: Combined loading states

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
          Please log in to view your saved projects.
        </p>
      </section>
    );
  }

  if (overallIsLoading) {
    // <<<< MODIFIED: Use combined loading state
    return (
      <section className="flex flex-col items-center justify-center gap-3 min-h-[60vh]">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <p className="text-zinc-400">Loading your saved projects...</p>
      </section>
    );
  }

  if (isErrorSaved) {
    // Check for error from saved posts query primarily
    return (
      <section className="flex flex-col items-center justify-center gap-3 min-h-[60vh] text-center">
        <FaExclamationTriangle className="text-5xl text-red-500 mb-4" />
        <p className="text-red-400 font-semibold">
          Failed to load saved projects.
        </p>
        {errorSaved && (
          <p className="text-red-400/80 text-sm max-w-md">
            Error:{" "}
            {(errorSaved as any).data?.message ||
              (errorSaved as any).error ||
              "An unknown error occurred."}
          </p>
        )}
        <button
          onClick={() => refetchSaved()}
          className="btn btn-primary btn-outline mt-4"
        >
          Try Reloading
        </button>
      </section>
    );
  }

  const finalProjectsToRender = clientFilteredSavedProjects;
  const hasActiveFilters =
    searchTerm || selectedTags.size > 0 || dateFilter !== "all";

  return (
    <section className="flex flex-col gap-6 p-4 md:p-1 text-zinc-100">
      <div className="p-3 py-5 bg-zinc-900 border-b-2 border-blue-500 rounded-t-lg mb-0">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 flex items-center gap-3">
          <FaBookmark className="text-blue-400" />
          My Saved Projects
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:items-center p-3 bg-zinc-900 border border-zinc-700/50 rounded-lg">
        <div className="relative flex-grow md:flex-grow-0 md:w-full md:max-w-sm">
          <input
            type="text"
            placeholder="Search your saved projects..."
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
            aria-label="Filter saved projects by post date"
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

      {uniqueTagsFromSaved.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center p-3 bg-zinc-900 border border-zinc-700/50 rounded-lg">
          <span className="text-sm text-zinc-400 mr-2 shrink-0">
            Filter by tag:
          </span>
          <div className="flex flex-wrap gap-2">
            {uniqueTagsFromSaved.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`badge text-xs px-3 py-2 rounded-full cursor-pointer transition-all duration-150 ease-in-out font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
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

      {!overallIsLoading && finalProjectsToRender.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5 sm:gap-6">
          {finalProjectsToRender.map((project) => (
            <ProjectsCard key={project.id} project={project} />
          ))}
        </div>
      ) : !overallIsLoading && mySavedPosts && mySavedPosts.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-4 border border-dashed border-zinc-700 rounded-lg bg-zinc-900/50 min-h-[300px] justify-center">
          <FaBookmark className="text-4xl text-blue-400" />
          <p className="text-zinc-300 text-lg font-semibold">
            You haven't saved any projects yet.
          </p>
          <p className="text-zinc-400 text-sm">
            Browse projects and click the bookmark icon to save them here.
          </p>
        </div>
      ) : (
        !overallIsLoading && (
          <div className="text-center py-16 flex flex-col items-center gap-4 border border-dashed border-zinc-700 rounded-lg bg-zinc-900/50 min-h-[300px] justify-center">
            <FaExclamationTriangle className="text-4xl text-yellow-500" />
            <p className="text-zinc-300 text-lg font-semibold">
              No saved projects found matching your criteria.
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

export default SavedProjectsPage;
