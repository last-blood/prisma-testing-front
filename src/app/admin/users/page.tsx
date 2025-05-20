// src/admin/users/page.tsx (Conceptual Mockup)
"use client"; // For client-side interactivity like state for modal

import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout"; // Adjust path

import { FaPlus } from "react-icons/fa";
import { DummyUser, dummyUsers } from "@/components/admin/dummyData";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import UserDetailsModal from "@/components/admin/users/UserDetailsModal";
import UserTable from "@/components/admin/users/UserTable";

const UserManagementPage = () => {
  const [users, setUsers] = useState<DummyUser[]>(dummyUsers.slice(0, 10)); // Paginated slice
  const [selectedUser, setSelectedUser] = useState<DummyUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Should match initial slice

  const handleViewDetails = (user: DummyUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    // DaisyUI modal needs JS to show. In a real app, you'd use its methods.
    // For mockup, we'll just control with state.
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleEditRole = (userId: string, newRole: DummyUser["role"]) => {
    alert(`Mock: Change role of user ${userId} to ${newRole}`);
    // Here you would call a mutation
    setUsers((prevUsers) =>
      prevUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const handleToggleBan = (
    userId: string,
    currentStatus: DummyUser["status"]
  ) => {
    const newStatus = currentStatus === "Active" ? "Banned" : "Active";
    alert(`Mock: Toggle ban for user ${userId} to ${newStatus}`);
    setUsers((prevUsers) =>
      prevUsers.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm(`Mock: Are you sure you want to delete user ${userId}?`)) {
      alert(`Mock: Delete user ${userId}`);
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
    }
  };

  const filterOptions = [
    {
      name: "Role",
      options: ["All Roles", "USER", "MODERATOR", "ADMIN"],
      defaultValue: "All Roles",
    },
    {
      name: "Status",
      options: ["All Statuses", "Active", "Banned", "Pending"],
      defaultValue: "All Statuses",
    },
  ];

  // Mock pagination
  const totalUsers = dummyUsers.length; // In real app, this comes from backend
  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    setUsers(dummyUsers.slice(start, end));
  };

  return (
    <AdminLayout pageTitle="User Management">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <AdminSearchBar
          onSearch={(term) => alert(`Searching for: ${term}`)}
          placeholder="Search users by name, username, email..."
        />
        <AdminFilters
          filters={filterOptions}
          onApplyFilters={(applied) =>
            alert(`Filters applied: ${JSON.stringify(applied)}`)
          }
        />
        <button className="btn btn-primary w-full sm:w-auto">
          <FaPlus className="mr-2" /> Add New User
        </button>
      </div>

      <UserTable
        users={users}
        onViewDetails={handleViewDetails}
        onEditRole={handleEditRole}
        onToggleBan={handleToggleBan}
        onDeleteUser={handleDeleteUser}
      />

      {totalUsers > itemsPerPage && (
        <div className="mt-6 flex justify-center">
          <div className="join">
            <button
              className="join-item btn btn-sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              «
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                className={`join-item btn btn-sm ${
                  currentPage === i + 1 ? "btn-primary btn-active" : ""
                }`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="join-item btn btn-sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        </div>
      )}

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onEditRole={handleEditRole}
          onToggleBan={handleToggleBan}
          onDeleteUser={handleDeleteUser}
        />
      )}
    </AdminLayout>
  );
};

export default UserManagementPage;
