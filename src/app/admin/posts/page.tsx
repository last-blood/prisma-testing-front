// src/admin/posts/page.tsx (Conceptual Mockup)
"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout"; // Adjust path

import { FaPlus, FaNewspaper } from "react-icons/fa";
import { DummyPost, dummyPosts } from "@/components/admin/dummyData";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminFilters from "@/components/admin/AdminFilters";
import PostDetailsModal from "@/components/admin/posts/PostDetailsModal";
import PostTable from "@/components/admin/posts/PostTable";

const PostManagementPage = () => {
  const [posts, setPosts] = useState<DummyPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<DummyPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<DummyPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Simulate fetching and initial pagination
  useEffect(() => {
    const paginatedPosts = dummyPosts.slice(0, itemsPerPage);
    setPosts(paginatedPosts);
    setFilteredPosts(paginatedPosts);
  }, []);

  const handleViewDetails = (post: DummyPost) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  const handleUpdatePost = (updatedPost: DummyPost) => {
    alert(`Mock: Update post ${updatedPost.id} - ${updatedPost.title}`);
    // In a real app, call mutation, then update local state or rely on cache invalidation
    setFilteredPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
    );
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
    ); // if main list is separate
    handleCloseModal();
  };

  const handleDeletePost = (postId: string) => {
    if (confirm(`Mock: Are you sure you want to delete post ${postId}?`)) {
      alert(`Mock: Delete post ${postId}`);
      setFilteredPosts((prev) => prev.filter((p) => p.id !== postId));
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
    handleCloseModal(); // if delete is from modal
  };

  const handleSearch = (term: string) => {
    alert(`Mock: Searching posts for "${term}"`);
    if (!term) {
      handlePageChange(1); // Reset to first page of all items
      return;
    }
    const lowerTerm = term.toLowerCase();
    const results = dummyPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(lowerTerm) ||
        post.authorUsername?.toLowerCase().includes(lowerTerm) ||
        post.postTags.some((tag) => tag.toLowerCase().includes(lowerTerm))
    );
    setFilteredPosts(results.slice(0, itemsPerPage)); // Show first page of results
    setCurrentPage(1); // Reset to first page of results
  };

  const filterOptions = [
    {
      name: "Status",
      options: [
        "All Statuses",
        "Published",
        "Draft",
        "Hidden",
        "FlaggedForReview",
        "Archived",
      ],
      defaultValue: "All Statuses",
    },
    {
      name: "Featured",
      options: ["Any", "Yes", "No"],
      defaultValue: "Any",
    },
  ];

  const handleApplyFilters = (appliedFilters: Record<string, string>) => {
    alert(`Mock: Filters applied: ${JSON.stringify(appliedFilters)}`);
    let results = [...dummyPosts];
    if (appliedFilters.Status && appliedFilters.Status !== "All Statuses") {
      results = results.filter((post) => post.status === appliedFilters.Status);
    }
    if (appliedFilters.Featured) {
      if (appliedFilters.Featured === "Yes")
        results = results.filter((post) => post.isFeatured);
      if (appliedFilters.Featured === "No")
        results = results.filter((post) => !post.isFeatured);
    }
    setFilteredPosts(results.slice(0, itemsPerPage));
    setCurrentPage(1);
  };

  const totalFilteredPosts = filteredPosts.length; // This should be total based on filters for accurate pagination
  // For mockup simplicity, this is just current page length
  // A real app would get total from backend after filtering

  const totalItemsForPagination = dummyPosts.filter((post) => {
    // This is a mock for backend filtering
    let passes = true;
    // Apply mock filters to dummyPosts to get a "total" count for pagination demo
    // This is NOT how you'd do it in a real app with backend pagination.
    return passes;
  }).length;

  const totalPages = Math.ceil(totalItemsForPagination / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    // In a real app, you'd refetch with skip/take or apply filters to the full dataset if client-side
    setFilteredPosts(dummyPosts.slice(start, end)); // Simplified for mockup
  };

  return (
    <AdminLayout pageTitle="Post Management">
      <div className="mb-6 p-4 bg-zinc-800 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <AdminSearchBar
            onSearch={handleSearch}
            placeholder="Search posts by title, author, tag..."
          />
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <AdminFilters
              filters={filterOptions}
              onApplyFilters={handleApplyFilters}
            />
            <button className="btn btn-primary btn-sm md:btn-md w-full sm:w-auto mt-2 sm:mt-0">
              <FaPlus className="mr-2" /> Create New Post
            </button>
          </div>
        </div>
      </div>

      <PostTable
        posts={filteredPosts}
        onViewDetails={handleViewDetails}
        // Pass other actions like onToggleFeature, onSetStatus
      />

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="join shadow-md">
            <button
              className="join-item btn btn-sm bg-zinc-700 hover:bg-zinc-600 border-zinc-600"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              «
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                className={`join-item btn btn-sm border-zinc-600 ${
                  currentPage === i + 1
                    ? "btn-primary btn-active"
                    : "bg-zinc-700 hover:bg-zinc-600"
                }`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="join-item btn btn-sm bg-zinc-700 hover:bg-zinc-600 border-zinc-600"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        </div>
      )}

      {selectedPost && (
        <PostDetailsModal
          post={selectedPost}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleUpdatePost} // Example for saving edits
          onDelete={handleDeletePost}
        />
      )}
    </AdminLayout>
  );
};

export default PostManagementPage;
