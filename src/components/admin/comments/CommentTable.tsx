// src/components/admin/comments/CommentTable.tsx
import React from "react";
import { DummyComment, CommentStatus } from "../dummyData"; // Adjust path
import {
  FaEye,
  FaEdit,
  FaTrashAlt,
  FaRegEyeSlash,
  FaRegEye,
  FaEllipsisV,
  FaLink,
  FaUser,
} from "react-icons/fa";
import Link from "next/link";

interface CommentTableProps {
  comments: DummyComment[];
  onViewDetails: (comment: DummyComment) => void;
  onChangeStatus: (commentId: string, newStatus: CommentStatus) => void;
  onDeleteComment: (commentId: string) => void;
}

const CommentTable: React.FC<CommentTableProps> = ({
  comments,
  onViewDetails,
  onChangeStatus,
  onDeleteComment,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: CommentStatus) => {
    switch (status) {
      case "Visible":
        return <span className="badge badge-success badge-sm">{status}</span>;
      case "Hidden":
        return <span className="badge badge-warning badge-sm">{status}</span>;
      case "FlaggedForReview":
        return <span className="badge badge-info badge-sm">{status}</span>;
      case "Spam":
        return <span className="badge badge-error badge-sm">{status}</span>;
      default:
        return <span className="badge badge-sm">{status}</span>;
    }
  };

  return (
    <div className="overflow-x-auto bg-zinc-800 rounded-lg shadow-md">
      <table className="table table-zebra w-full table-sm md:table-md">
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
            <th>Comment Text (Snippet)</th>
            <th>Author</th>
            <th>Post</th>
            <th>Level</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {comments.map((comment) => (
            <tr
              key={comment.id}
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
              <td className="py-3 max-w-sm">
                <p
                  className="text-zinc-100 truncate cursor-pointer hover:text-primary"
                  onClick={() => onViewDetails(comment)}
                >
                  {comment.text}
                </p>
                <span className="text-xs text-zinc-500">ID: {comment.id}</span>
              </td>
              <td className="py-3">
                <div className="flex items-center space-x-2">
                  <div className="avatar avatar-xs">
                    <div className="mask mask-squircle w-6 h-6">
                      <img
                        src={
                          comment.authorProfileImage || "/default-avatar.png"
                        }
                        alt={comment.authorUsername}
                      />
                    </div>
                  </div>
                  <Link
                    href={`/admin/users/${comment.authorId || ""}`}
                    className="text-zinc-300 hover:text-primary"
                  >
                    {comment.authorUsername || "N/A"}
                  </Link>
                </div>
              </td>
              <td className="py-3">
                <Link
                  href={`/admin/posts/${comment.postId || ""}`}
                  className="text-zinc-300 hover:text-primary truncate max-w-[150px] block"
                >
                  <FaLink className="inline mr-1 text-xs" />{" "}
                  {comment.postTitle || comment.postId}
                </Link>
              </td>
              <td className="text-zinc-300 py-3">{comment.level}</td>
              <td className="py-3">{getStatusBadge(comment.status)}</td>
              <td className="text-zinc-300 py-3 whitespace-nowrap">
                {formatDate(comment.createdAt)}
              </td>
              <td className="py-3">
                <div className="dropdown dropdown-left">
                  <label tabIndex={0} className="btn btn-ghost btn-xs m-1 px-2">
                    <FaEllipsisV />
                  </label>
                  <ul
                    tabIndex={0}
                    className="dropdown-content z-[1] menu p-2 shadow bg-zinc-700 rounded-box w-48 border border-zinc-600"
                  >
                    <li>
                      <button
                        onClick={() => onViewDetails(comment)}
                        className="w-full text-left justify-start btn-sm btn-ghost hover:bg-zinc-600"
                      >
                        <FaEye className="mr-2" /> View/Edit
                      </button>
                    </li>
                    {comment.status === "Visible" ? (
                      <li>
                        <button
                          onClick={() => onChangeStatus(comment.id, "Hidden")}
                          className="w-full text-left justify-start btn-sm btn-ghost hover:bg-zinc-600 text-warning"
                        >
                          <FaRegEyeSlash className="mr-2" /> Hide
                        </button>
                      </li>
                    ) : (
                      <li>
                        <button
                          onClick={() => onChangeStatus(comment.id, "Visible")}
                          className="w-full text-left justify-start btn-sm btn-ghost hover:bg-zinc-600 text-success"
                        >
                          <FaRegEye className="mr-2" /> Show
                        </button>
                      </li>
                    )}
                    {comment.status === "FlaggedForReview" && (
                      <li>
                        <button
                          onClick={() => onChangeStatus(comment.id, "Visible")}
                          className="w-full text-left justify-start btn-sm btn-ghost hover:bg-zinc-600 text-success"
                        >
                          <FaRegEye className="mr-2" /> Approve
                        </button>
                      </li>
                    )}
                    <li>
                      <button
                        onClick={() => onDeleteComment(comment.id)}
                        className="w-full text-left justify-start btn-sm btn-ghost text-error hover:bg-zinc-600"
                      >
                        <FaTrashAlt className="mr-2" /> Delete
                      </button>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {comments.length === 0 && (
        <div className="p-8 text-center text-zinc-500">
          No comments found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default CommentTable;
