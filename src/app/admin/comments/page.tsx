// src/admin/comments/page.tsx (Conceptual Mockup)
"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout"; // Adjust path

import { FaFilter } from "react-icons/fa";
import {
  CommentStatus,
  DummyComment,
  dummyComments,
} from "@/components/admin/dummyData";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import CommentTable from "@/components/admin/comments/CommentTable";
import AdminFilters from "@/components/admin/AdminFilters";
import CommentDetailsModal from "@/components/admin/comments/CommentDetailsModal";

const CommentManagementPage = () => {
  const [comments, setComments] = useState<DummyComment[]>([]);
  const [filteredComments, setFilteredComments] = useState<DummyComment[]>([]);
  const [selectedComment, setSelectedComment] = useState<DummyComment | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const paginatedComments = dummyComments.slice(0, itemsPerPage);
    setComments(paginatedComments);
    setFilteredComments(paginatedComments);
  }, []);

  const handleViewDetails = (comment: DummyComment) => {
    setSelectedComment(comment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedComment(null);
  };

  const handleUpdateComment = (updatedComment: DummyComment) => {
    alert(
      `Mock: Update comment ${
        updatedComment.id
      } - Text: ${updatedComment.text.substring(0, 20)}...`
    );
    setFilteredComments((prev) =>
      prev.map((c) => (c.id === updatedComment.id ? updatedComment : c))
    );
    setComments((prev) =>
      prev.map((c) => (c.id === updatedComment.id ? updatedComment : c))
    );
    handleCloseModal();
  };

  const handleDeleteComment = (commentId: string) => {
    if (
      confirm(`Mock: Are you sure you want to delete comment ${commentId}?`)
    ) {
      alert(`Mock: Delete comment ${commentId}`);
      setFilteredComments((prev) => prev.filter((c) => c.id !== commentId));
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
    handleCloseModal();
  };

  const handleChangeStatus = (commentId: string, newStatus: CommentStatus) => {
    alert(`Mock: Change status of comment ${commentId} to ${newStatus}`);
    setFilteredComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, status: newStatus } : c))
    );
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, status: newStatus } : c))
    );
  };

  const handleSearch = (term: string) => {
    alert(`Mock: Searching comments for "${term}"`);
    if (!term) {
      handlePageChange(1);
      return;
    }
    const lowerTerm = term.toLowerCase();
    const results = dummyComments.filter(
      (comment) =>
        comment.text.toLowerCase().includes(lowerTerm) ||
        comment.authorUsername?.toLowerCase().includes(lowerTerm) ||
        comment.postId.toLowerCase().includes(lowerTerm) ||
        comment.postTitle?.toLowerCase().includes(lowerTerm)
    );
    setFilteredComments(results.slice(0, itemsPerPage));
    setCurrentPage(1);
  };

  const filterOptions = [
    {
      name: "Status",
      options: [
        "All Statuses",
        "Visible",
        "Hidden",
        "FlaggedForReview",
        "Spam",
      ],
      defaultValue: "All Statuses",
    },
    {
      name: "Level",
      options: ["All Levels", "0", "1", "2", "3", "4", "5"],
      defaultValue: "All Levels",
    },
  ];

  const handleApplyFilters = (appliedFilters: Record<string, string>) => {
    alert(`Mock: Comment filters applied: ${JSON.stringify(appliedFilters)}`);
    let results = [...dummyComments];
    if (appliedFilters.Status && appliedFilters.Status !== "All Statuses") {
      results = results.filter(
        (comment) => comment.status === appliedFilters.Status
      );
    }
    if (appliedFilters.Level && appliedFilters.Level !== "All Levels") {
      results = results.filter(
        (comment) => comment.level === parseInt(appliedFilters.Level, 10)
      );
    }
    setFilteredComments(results.slice(0, itemsPerPage));
    setCurrentPage(1);
  };

  const totalItemsForPagination = dummyComments.filter((comment) => {
    // Mock a more complex filter application for total count if needed for demo
    return true;
  }).length;

  const totalPages = Math.ceil(totalItemsForPagination / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    // In a real app, re-fetch with skip/take and active server-side filters
    setFilteredComments(dummyComments.slice(start, end)); // Simplified for mockup
  };

  return (
    <AdminLayout pageTitle="Comment Management">
      <div className="mb-6 p-4 bg-zinc-800 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <AdminSearchBar
            onSearch={handleSearch}
            placeholder="Search comments by text, author, post..."
          />
          <AdminFilters
            filters={filterOptions}
            onApplyFilters={handleApplyFilters}
          />
        </div>
      </div>

      <CommentTable
        comments={filteredComments}
        onViewDetails={handleViewDetails}
        onChangeStatus={handleChangeStatus}
        onDeleteComment={handleDeleteComment}
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

      {selectedComment && (
        <CommentDetailsModal
          comment={selectedComment}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleUpdateComment}
          onDelete={handleDeleteComment}
          onChangeStatus={handleChangeStatus}
        />
      )}
    </AdminLayout>
  );
};

export default CommentManagementPage;
