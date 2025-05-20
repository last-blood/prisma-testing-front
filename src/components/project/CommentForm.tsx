// filePath: @/app/projects/[id]/CommentForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FaPaperPlane, FaSpinner, FaTimes } from "react-icons/fa";

interface CommentFormProps {
  onSubmit: (text: string) => Promise<void>;
  isLoading: boolean;
  initialText?: string;
  submitError?: string;
  placeholder?: string;
  submitButtonText?: string;
  onCancel?: () => void; // For edit/reply forms
  compact?: boolean; // For a more compact layout (e.g., replies/edits)
}

const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  isLoading,
  initialText = "",
  submitError,
  placeholder = "Write something...",
  submitButtonText = "Submit",
  onCancel,
  compact = false,
}) => {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    setText(initialText); // Sync if initialText changes (e.g. when edit form is opened for different comments)
  }, [initialText]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;
    await onSubmit(text);
    if (!initialText) {
      // Clear only if it's not an edit form being resubmitted
      setText("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={` ${compact ? "mt-2" : "bg-zinc-800 p-4 rounded-lg shadow"}`}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        className="w-full p-2 bg-zinc-700 border border-zinc-600 rounded-md text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        disabled={isLoading}
        required
      />
      {submitError && (
        <p className="mt-1 text-xs text-red-400">{submitError}</p>
      )}
      <div
        className={`flex ${
          compact ? "justify-end" : "justify-between"
        } items-center mt-2`}
      >
        {compact && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-xs btn-ghost text-zinc-400 hover:text-zinc-200 mr-2"
            disabled={isLoading}
          >
            <FaTimes className="mr-1" /> Cancel
          </button>
        )}
        {!compact && (
          <div className="text-xs text-zinc-400">
            Markdown is not supported.
          </div>
        )}
        <button
          type="submit"
          className={`btn ${compact ? "btn-sm" : "btn-md"} btn-primary gap-2`}
          disabled={isLoading || !text.trim()}
        >
          {isLoading ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <FaPaperPlane />
          )}
          {submitButtonText}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;
