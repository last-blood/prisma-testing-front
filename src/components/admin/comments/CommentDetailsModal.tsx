// src/components/admin/comments/CommentDetailsModal.tsx
import React, { useState, useEffect } from "react";
import { DummyComment, CommentStatus } from "../dummyData"; // Adjust path
import {
  FaSave,
  FaTimes,
  FaUser,
  FaFileAlt,
  FaComment,
  FaTrashAlt,
  FaRegEyeSlash,
  FaRegEye,
} from "react-icons/fa";
import Link from "next/link";

interface CommentDetailsModalProps {
  comment: DummyComment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedComment: DummyComment) => void; // For saving edits to text
  onDelete: (commentId: string) => void;
  onChangeStatus: (commentId: string, newStatus: CommentStatus) => void;
}

const CommentDetailsModal: React.FC<CommentDetailsModalProps> = ({
  comment,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onChangeStatus,
}) => {
  const [editableText, setEditableText] = useState("");
  const [editableStatus, setEditableStatus] =
    useState<CommentStatus>("Visible");

  useEffect(() => {
    if (comment) {
      setEditableText(comment.text);
      setEditableStatus(comment.status);
    }
  }, [comment]);

  if (!isOpen || !comment) return null;

  const handleSave = () => {
    onSave({ ...comment, text: editableText, status: editableStatus });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <dialog
      id="comment_details_modal_daisy"
      open={isOpen}
      className="modal modal-open"
    >
      <div className="modal-box w-11/12 max-w-2xl bg-zinc-800 text-zinc-200 border border-zinc-700 shadow-2xl">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-700">
          <h3 className="font-bold text-xl text-primary">
            Comment Details (ID: {comment.id})
          </h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost text-zinc-400 hover:bg-zinc-700"
          >
            <FaTimes />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4 max-h-[70vh] overflow-y-auto pr-2"
        >
          <div className="p-4 bg-zinc-700/50 rounded-md">
            <p className="text-xs text-zinc-400 mb-1">Author:</p>
            <Link
              href={`/admin/users/${comment.authorId || ""}`}
              className="flex items-center gap-2 text-sm hover:text-primary"
            >
              <FaUser className="text-primary" />{" "}
              {comment.authorUsername || "N/A"} (ID: {comment.authorId || "N/A"}
              )
            </Link>
            <p className="text-xs text-zinc-400 mt-2 mb-1">Post:</p>
            <Link
              href={`/admin/posts/${comment.postId || ""}`}
              className="flex items-center gap-2 text-sm hover:text-primary"
            >
              <FaFileAlt className="text-primary" />{" "}
              {comment.postTitle || comment.postId}
            </Link>
            {comment.parentId && (
              <>
                <p className="text-xs text-zinc-400 mt-2 mb-1">
                  In Reply To (Parent ID):
                </p>
                {/* In a real app, you might fetch and display snippet of parent comment */}
                <Link
                  href={`/admin/comments?search=${comment.parentId}`}
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <FaComment className="text-primary" /> {comment.parentId}
                </Link>
              </>
            )}
            <p className="text-xs text-zinc-400 mt-2">
              <strong className="text-zinc-300">Level:</strong> {comment.level}
            </p>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-zinc-400">Comment Text</span>
            </label>
            <textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              className="textarea textarea-bordered w-full h-32 bg-zinc-700 border-zinc-600 focus:border-primary"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-zinc-400">Status</span>
            </label>
            <select
              value={editableStatus}
              onChange={(e) =>
                setEditableStatus(e.target.value as CommentStatus)
              }
              className="select select-bordered w-full bg-zinc-700 border-zinc-600 focus:border-primary"
            >
              {(
                [
                  "Visible",
                  "Hidden",
                  "FlaggedForReview",
                  "Spam",
                ] as CommentStatus[]
              ).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-zinc-500 mt-4">
            <p>
              <strong>Created:</strong> {formatDate(comment.createdAt)} |{" "}
              <strong>Updated:</strong> {formatDate(comment.updatedAt)}
            </p>
            <p>
              <strong>Reactions:</strong> {comment.likesCount} Likes,{" "}
              {comment.dislikesCount} Dislikes
            </p>
          </div>

          <div className="modal-action mt-8 pt-4 border-t border-zinc-700">
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              className="btn btn-error btn-outline btn-sm"
            >
              <FaTrashAlt className="mr-2" /> Delete Comment
            </button>
            <div className="flex-grow"></div> {/* Spacer */}
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              <FaSave className="mr-2" /> Save Changes
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default CommentDetailsModal;
