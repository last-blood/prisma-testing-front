// src/components/admin/posts/PostTable.tsx
import React from "react";
import { DummyPost } from "../dummyData"; // Adjust path
import {
  FaEye,
  FaEdit,
  FaTrashAlt,
  FaToggleOn,
  FaToggleOff,
  FaThumbtack,
  FaCommentDots,
  FaHeart,
  FaChartBar,
  FaEllipsisV,
} from "react-icons/fa";

interface PostTableProps {
  posts: DummyPost[];
  onViewDetails: (post: DummyPost) => void;
  // Add more specific action handlers as props:
  // onEdit: (post: DummyPost) => void;
  // onDelete: (postId: string) => void;
  // onToggleFeature: (postId: string, isFeatured: boolean) => void;
  // onChangeStatus: (postId: string, newStatus: PostStatus) => void;
}

const PostTable: React.FC<PostTableProps> = ({ posts, onViewDetails }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: DummyPost["status"]) => {
    switch (status) {
      case "Published":
        return <span className="badge badge-success badge-sm">{status}</span>;
      case "Draft":
        return <span className="badge badge-ghost badge-sm">{status}</span>;
      case "Hidden":
        return <span className="badge badge-warning badge-sm">{status}</span>;
      case "FlaggedForReview":
        return <span className="badge badge-error badge-sm">{status}</span>;
      case "Archived":
        return <span className="badge badge-neutral badge-sm">{status}</span>;
      default:
        return <span className="badge badge-sm">{status}</span>;
    }
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
            <th>Title</th>
            <th>Author</th>
            <th>Stats (C/L/V)</th>
            <th>Status</th>
            <th>Featured</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr
              key={post.id}
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
                <div
                  className="font-semibold text-zinc-100 hover:text-primary cursor-pointer"
                  onClick={() => onViewDetails(post)}
                >
                  {post.title}
                </div>
                <div className="text-xs text-zinc-400 truncate max-w-xs">
                  {post.description}
                </div>
              </td>
              <td className="py-3">
                <div className="flex items-center space-x-2">
                  <div className="avatar avatar-xs">
                    <div className="mask mask-squircle w-6 h-6">
                      <img
                        src={post.authorProfileImage || "/default-avatar.png"}
                        alt={post.authorUsername}
                      />
                    </div>
                  </div>
                  <span className="text-zinc-300">
                    {post.authorUsername || "N/A"}
                  </span>
                </div>
              </td>
              <td className="text-zinc-300 py-3 text-xs">
                <div className="flex items-center gap-1">
                  <FaCommentDots /> {post.commentsCount}
                </div>
                <div className="flex items-center gap-1">
                  <FaHeart /> {post.likesCount}
                </div>
                <div className="flex items-center gap-1">
                  <FaChartBar /> {post.viewsCount}
                </div>
              </td>
              <td className="py-3">{getStatusBadge(post.status)}</td>
              <td className="py-3">
                {post.isFeatured ? (
                  <FaThumbtack
                    className="text-primary text-lg"
                    title="Featured"
                  />
                ) : (
                  <FaThumbtack
                    className="text-zinc-600 text-lg"
                    title="Not Featured"
                  />
                )}
              </td>
              <td className="text-zinc-300 py-3">
                {formatDate(post.createdAt)}
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
                        onClick={() => onViewDetails(post)}
                        className="w-full text-left justify-start btn-sm btn-ghost hover:bg-zinc-600"
                      >
                        <FaEye className="mr-2" /> View/Edit
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => alert(`Toggle Feature for ${post.id}`)}
                        className="w-full text-left justify-start btn-sm btn-ghost hover:bg-zinc-600"
                      >
                        {post.isFeatured ? (
                          <FaToggleOff className="mr-2" />
                        ) : (
                          <FaToggleOn className="mr-2" />
                        )}{" "}
                        {post.isFeatured ? "Unfeature" : "Feature"}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => alert(`Change status for ${post.id}`)}
                        className="w-full text-left justify-start btn-sm btn-ghost hover:bg-zinc-600"
                      >
                        <FaEdit className="mr-2" /> Change Status
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => alert(`Delete ${post.id}`)}
                        className="w-full text-left justify-start btn-sm btn-ghost text-error hover:bg-zinc-600"
                      >
                        <FaTrashAlt className="mr-2" /> Delete Post
                      </button>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {posts.length === 0 && (
        <div className="p-8 text-center text-zinc-500">
          No posts found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default PostTable;
