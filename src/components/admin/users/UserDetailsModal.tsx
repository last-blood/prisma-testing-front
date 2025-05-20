// src/components/admin/users/UserDetailsModal.tsx
import React from "react";
import { DummyUser, UserRole, UserStatus } from "../dummyData"; // Adjust path
import {
  FaUserShield,
  FaUserSlash,
  FaUserCheck,
  FaTrashAlt,
  FaTimes,
} from "react-icons/fa";

interface UserDetailsModalProps {
  user: DummyUser | null;
  isOpen: boolean;
  onClose: () => void;
  onEditRole: (userId: string, newRole: UserRole) => void;
  onToggleBan: (userId: string, currentStatus: UserStatus) => void;
  onDeleteUser: (userId: string) => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  isOpen,
  onClose,
  onEditRole,
  onToggleBan,
  onDeleteUser,
}) => {
  if (!isOpen || !user) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <dialog
      id="user_details_modal_daisy"
      open={isOpen}
      className="modal modal-open"
    >
      <div className="modal-box w-11/12 max-w-3xl bg-zinc-800 text-zinc-200 border border-zinc-700 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xl text-primary">
            User Details: {user.username}
          </h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost text-zinc-400 hover:bg-zinc-700"
          >
            <FaTimes />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          {/* Left Column: Profile Info */}
          <div className="space-y-3 pr-4 border-r border-zinc-700/50">
            <div className="flex items-center space-x-4">
              <div className="avatar">
                <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img src={user.profileImage} alt={user.username} />
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-zinc-100">
                  {user.name}
                </p>
                <p className="text-zinc-400">@{user.username}</p>
                <p className="text-zinc-400">{user.email}</p>
              </div>
            </div>
            <div className="form-control mt-2">
              <label className="label">
                <span className="label-text text-zinc-400">Role</span>
              </label>
              <select
                className="select select-bordered select-sm bg-zinc-700 border-zinc-600 focus:border-primary"
                value={user.role}
                onChange={(e) =>
                  onEditRole(user.id, e.target.value as UserRole)
                }
              >
                <option value="USER">USER</option>
                <option value="MODERATOR">MODERATOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <p>
              <strong className="text-zinc-400">Bio:</strong>{" "}
              {user.bio || (
                <span className="italic text-zinc-500">No bio provided.</span>
              )}
            </p>
            <div className="w-full h-32 bg-zinc-700 rounded overflow-hidden mt-2">
              <img
                src={user.bannerImage}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right Column: Activity & Timestamps */}
          <div className="space-y-3">
            <p>
              <strong className="text-zinc-400">Status:</strong>
              {user.status === "Active" && (
                <span className="badge badge-success gap-1">
                  <FaUserCheck /> {user.status}
                </span>
              )}
              {user.status === "Banned" && (
                <span className="badge badge-error gap-1">
                  <FaUserSlash /> {user.status}
                </span>
              )}
              {user.status === "Pending" && (
                <span className="badge badge-info gap-1"> {user.status}</span>
              )}
            </p>
            <p>
              <strong className="text-zinc-400">User ID:</strong> {user.id}
            </p>
            <p>
              <strong className="text-zinc-400">Posts:</strong>{" "}
              {user.postsCount}
            </p>
            <p>
              <strong className="text-zinc-400">Comments:</strong>{" "}
              {user.commentsCount}
            </p>
            <p>
              <strong className="text-zinc-400">Registered:</strong>{" "}
              {formatDate(user.createdAt)}
            </p>
            <p>
              <strong className="text-zinc-400">Last Updated:</strong>{" "}
              {formatDate(user.updatedAt)}
            </p>
            <p>
              <strong className="text-zinc-400">Last Login:</strong>{" "}
              {formatDate(user.lastLogin)}
            </p>
            {user.settings && (
              <div>
                <p className="font-semibold text-zinc-300 mt-2">Settings:</p>
                <p className="ml-2">
                  <strong className="text-zinc-400">Theme:</strong>{" "}
                  {user.settings.theme}
                </p>
                <p className="ml-2">
                  <strong className="text-zinc-400">Notifications:</strong>{" "}
                  {user.settings.notificationsEnabled ? "Enabled" : "Disabled"}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="modal-action mt-6 pt-4 border-t border-zinc-700">
          {user.status === "Active" ? (
            <button
              onClick={() => onToggleBan(user.id, user.status)}
              className="btn btn-warning btn-sm"
            >
              <FaUserSlash className="mr-2" /> Ban User
            </button>
          ) : (
            user.status === "Banned" && (
              <button
                onClick={() => onToggleBan(user.id, user.status)}
                className="btn btn-success btn-sm"
              >
                <FaUserCheck className="mr-2" /> Unban User
              </button>
            )
          )}
          <button
            onClick={() => onDeleteUser(user.id)}
            className="btn btn-error btn-sm"
          >
            <FaTrashAlt className="mr-2" /> Delete User
          </button>
          <button onClick={onClose} className="btn btn-sm btn-outline">
            Close
          </button>
        </div>
      </div>
      {/* Clicking backdrop closes modal if you add this form method="dialog" */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default UserDetailsModal;
