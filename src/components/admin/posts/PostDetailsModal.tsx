// src/components/admin/posts/PostDetailsModal.tsx
import React, { useState, useEffect } from "react";
import { DummyPost, PostStatus } from "../dummyData"; // Adjust path, assuming dummyData is in lib
import {
  FaSave,
  FaTimes,
  FaImage,
  FaTags,
  FaTrashAlt,
  FaThumbtack,
} from "react-icons/fa";

interface PostDetailsModalProps {
  post: DummyPost | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPost: DummyPost) => void;
  onDelete: (postId: string) => void;
}

const PostDetailsModal: React.FC<PostDetailsModalProps> = ({
  post,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [editablePost, setEditablePost] = useState<DummyPost | null>(null);

  useEffect(() => {
    if (post) {
      setEditablePost({ ...post }); // Create a local editable copy
    } else {
      setEditablePost(null);
    }
  }, [post]);

  // Define the formatDate function here
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  if (!isOpen || !editablePost) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setEditablePost((prev) => (prev ? { ...prev, [name]: checked } : null));
    } else if (name === "postTags") {
      setEditablePost((prev) =>
        prev
          ? {
              ...prev,
              postTags: value
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag),
            }
          : null
      );
    } else {
      setEditablePost((prev) => (prev ? { ...prev, [name]: value } : null));
    }
  };

  const handleImageChange = (index: number, value: string) => {
    if (!editablePost) return;
    const newImages = [...editablePost.postImages];
    newImages[index] = value;
    setEditablePost({ ...editablePost, postImages: newImages });
  };

  const addImageField = () => {
    if (!editablePost) return;
    setEditablePost({
      ...editablePost,
      postImages: [...editablePost.postImages, ""],
    });
  };

  const removeImageField = (index: number) => {
    if (!editablePost) return;
    const newImages = editablePost.postImages.filter((_, i) => i !== index);
    setEditablePost({ ...editablePost, postImages: newImages });
  };

  const handleSave = () => {
    if (editablePost) {
      onSave(editablePost);
    }
  };

  return (
    <dialog
      id="post_details_modal_daisy"
      open={isOpen}
      className="modal modal-open" // Ensure modal is controlled by isOpen prop for visibility
    >
      <div className="modal-box w-11/12 max-w-4xl bg-zinc-800 text-zinc-200 border border-zinc-700 shadow-2xl">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-700">
          <h3 className="font-bold text-xl text-primary">
            Edit Post: {post?.title}
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
          <div className="form-control">
            <label className="label">
              <span className="label-text text-zinc-400">Title</span>
            </label>
            <input
              type="text"
              name="title"
              value={editablePost.title}
              onChange={handleChange}
              className="input input-bordered w-full bg-zinc-700 border-zinc-600 focus:border-primary"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text text-zinc-400">
                Description (Excerpt)
              </span>
            </label>
            <textarea
              name="description"
              value={editablePost.description}
              onChange={handleChange}
              className="textarea textarea-bordered w-full h-24 bg-zinc-700 border-zinc-600 focus:border-primary"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text text-zinc-400">
                Full Content (Markdown supported)
              </span>
            </label>
            <textarea
              name="content"
              value={editablePost.content || ""}
              onChange={handleChange}
              className="textarea textarea-bordered w-full h-48 bg-zinc-700 border-zinc-600 focus:border-primary"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-zinc-400">
                <FaTags className="inline mr-1" /> Tags (comma-separated)
              </span>
            </label>
            <input
              type="text"
              name="postTags"
              value={editablePost.postTags.join(", ")}
              onChange={handleChange}
              className="input input-bordered w-full bg-zinc-700 border-zinc-600 focus:border-primary"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-zinc-400">
                <FaImage className="inline mr-1" /> Post Images (URLs)
              </span>
            </label>
            {editablePost.postImages.map((imgUrl, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="url"
                  value={imgUrl}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                  className="input input-sm input-bordered w-full bg-zinc-700 border-zinc-600 focus:border-primary"
                  placeholder="https://example.com/image.jpg"
                />
                <button
                  type="button"
                  onClick={() => removeImageField(index)}
                  className="btn btn-xs btn-error btn-outline"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addImageField}
              className="btn btn-xs btn-outline btn-accent mt-1 self-start"
            >
              Add Image URL
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-zinc-400">Status</span>
              </label>
              <select
                name="status"
                value={editablePost.status}
                onChange={handleChange}
                className="select select-bordered w-full bg-zinc-700 border-zinc-600 focus:border-primary"
              >
                {(
                  [
                    "Published",
                    "Draft",
                    "Hidden",
                    "FlaggedForReview",
                    "Archived",
                  ] as PostStatus[]
                ).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control items-start">
              <label className="label cursor-pointer gap-2">
                <span className="label-text text-zinc-400">
                  <FaThumbtack className="mr-1" /> Featured Post
                </span>
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={editablePost.isFeatured}
                  onChange={handleChange}
                  className="toggle toggle-primary"
                />
              </label>
            </div>
          </div>

          <div className="text-xs text-zinc-500 mt-4">
            <p>
              <strong>Author:</strong> {editablePost.authorUsername || "N/A"}{" "}
              (ID: {editablePost.authorId || "N/A"})
            </p>
            <p>
              <strong>Created:</strong> {formatDate(editablePost.createdAt)} |{" "}
              <strong>Updated:</strong> {formatDate(editablePost.updatedAt)}
            </p>
            <p>
              <strong>Stats:</strong> {editablePost.commentsCount} Comments,{" "}
              {editablePost.likesCount} Likes, {editablePost.viewsCount} Views,{" "}
              {editablePost.sharesCount} Shares
            </p>
          </div>

          <div className="modal-action mt-8 pt-4 border-t border-zinc-700">
            <button
              type="button"
              onClick={() => onDelete(editablePost.id)}
              className="btn btn-error btn-outline btn-sm"
            >
              <FaTrashAlt className="mr-2" /> Delete Post
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
      {/* Clicking backdrop closes modal if you add this form method="dialog" */}
      {/* However, for controlled modals, it's often better to rely solely on the isOpen prop and onClose handler */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default PostDetailsModal;
