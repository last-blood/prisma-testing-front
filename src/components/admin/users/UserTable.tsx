"use client ";
// src/components/admin/users/UserTable.tsx
import React from "react";
import { DummyUser, UserRole, UserStatus } from "../dummyData"; // Adjust path
import {
  FaEye,
  FaUserShield,
  FaUserSlash,
  FaUserCheck,
  FaTrashAlt,
  FaEllipsisV,
} from "react-icons/fa";

interface UserTableProps {
  users: DummyUser[];
  onViewDetails: (user: DummyUser) => void;
  onEditRole: (userId: string, newRole: UserRole) => void;
  onToggleBan: (userId: string, currentStatus: UserStatus) => void;
  onDeleteUser: (userId: string) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onViewDetails,
  onEditRole,
  onToggleBan,
  onDeleteUser,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="overflow-x-auto bg-zinc-800 rounded-lg shadow-md">
      <table className="table table-zebra w-full">
        <thead className="bg-zinc-700 text-zinc-300">
          <tr>
            <th>
              <label>
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                />
              </label>
            </th>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Registered</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-zinc-700/70 transition-colors"
            >
              <th className="py-3">
                <label>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                  />
                </label>
              </th>
              <td className="py-3">
                <div className="flex items-center space-x-3">
                  <div className="avatar">
                    <div className="mask mask-squircle w-10 h-10 ring-1 ring-zinc-600">
                      <img src={user.profileImage} alt={user.username} />
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-zinc-100">
                      {user.username}
                    </div>
                    <div className="text-sm text-zinc-400">{user.name}</div>
                  </div>
                </div>
              </td>
              <td className="text-zinc-300 py-3">{user.email}</td>
              <td className="py-3">
                {user.role === "ADMIN" && (
                  <span className="badge badge-error badge-outline font-semibold">
                    {user.role}
                  </span>
                )}
                {user.role === "MODERATOR" && (
                  <span className="badge badge-warning badge-outline font-semibold">
                    {user.role}
                  </span>
                )}
                {user.role === "USER" && (
                  <span className="badge badge-ghost badge-sm">
                    {user.role}
                  </span>
                )}
              </td>
              <td className="py-3">
                {user.status === "Active" && (
                  <span className="badge badge-success badge-sm gap-1">
                    <FaUserCheck /> {user.status}
                  </span>
                )}
                {user.status === "Banned" && (
                  <span className="badge badge-error badge-sm gap-1">
                    <FaUserSlash /> {user.status}
                  </span>
                )}
                {user.status === "Pending" && (
                  <span className="badge badge-info badge-sm gap-1">
                    {" "}
                    {user.status}
                  </span>
                )}
              </td>
              <td className="text-zinc-300 py-3">
                {formatDate(user.createdAt)}
              </td>
              <td className="text-zinc-300 py-3">
                {formatDate(user.lastLogin)}
              </td>
              <td className="py-3">
                <div className="dropdown dropdown-left">
                  <label tabIndex={0} className="btn btn-ghost btn-sm m-1 px-2">
                    <FaEllipsisV />
                  </label>
                  <ul
                    tabIndex={0}
                    className="dropdown-content z-[1] menu p-2 shadow bg-zinc-700 rounded-box w-48 border border-zinc-600"
                  >
                    <li>
                      <button
                        onClick={() => onViewDetails(user)}
                        className="w-full text-left justify-start btn-sm btn-ghost hover:bg-zinc-600"
                      >
                        <FaEye className="mr-2" /> View Details
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() =>
                          onEditRole(
                            user.id,
                            user.role === "ADMIN" ? "USER" : "ADMIN"
                          )
                        }
                        className="w-full text-left justify-start btn-sm btn-ghost hover:bg-zinc-600"
                      >
                        <FaUserShield className="mr-2" /> Toggle Admin
                      </button>
                    </li>
                    {user.status === "Active" ? (
                      <li>
                        <button
                          onClick={() => onToggleBan(user.id, user.status)}
                          className="w-full text-left justify-start btn-sm btn-ghost text-warning hover:bg-zinc-600"
                        >
                          <FaUserSlash className="mr-2" /> Ban User
                        </button>
                      </li>
                    ) : (
                      <li>
                        <button
                          onClick={() => onToggleBan(user.id, user.status)}
                          className="w-full text-left justify-start btn-sm btn-ghost text-success hover:bg-zinc-600"
                        >
                          <FaUserCheck className="mr-2" /> Unban User
                        </button>
                      </li>
                    )}
                    <li>
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="w-full text-left justify-start btn-sm btn-ghost text-error hover:bg-zinc-600"
                      >
                        <FaTrashAlt className="mr-2" /> Delete User
                      </button>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="p-8 text-center text-zinc-500">
          No users found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default UserTable;
