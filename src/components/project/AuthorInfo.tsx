// src/app/projects/[id]/page.tsx
"use client";

import React from "react";
import Image from "next/image";
import {
  BackendPost, // <-- Import type
} from "@/lib/post/postSlice"; // Adjust path

import { FaCalendarAlt } from "react-icons/fa";
import { format } from "date-fns";

// Component for displaying Author Info (reusable)
// --- AuthorInfo Component (can be kept here or imported) ---
const AuthorInfo: React.FC<{
  author: BackendPost["author"];
  createdAt: string;
}> = ({ author, createdAt }) => {
  const [avatarSrc, setAvatarSrc] = React.useState(
    author?.profileImage || "/default-avatar.png"
  );
  const [isAvatarLoading, setIsAvatarLoading] = React.useState(true);

  React.useEffect(() => {
    setIsAvatarLoading(true);
    setAvatarSrc(author?.profileImage || "/default-avatar.png");
  }, [author?.profileImage]);

  const handleAvatarError = () => {
    setIsAvatarLoading(false);
    setAvatarSrc("/default-avatar.png");
  };

  return (
    <div className="flex items-center space-x-3 text-sm text-zinc-400">
      {" "}
      {/* Removed mb-6 from here */}
      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center">
        {isAvatarLoading && (
          <div className="absolute inset-0 animate-pulse bg-zinc-600 rounded-full"></div>
        )}
        <Image
          src={avatarSrc}
          alt={author?.name || "Author"}
          fill
          sizes="40px"
          className={`object-cover transition-opacity duration-300 ${
            isAvatarLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setIsAvatarLoading(false)}
          onError={handleAvatarError}
        />
      </div>
      <div>
        <p className="font-semibold text-zinc-200 hover:text-blue-400 transition-colors">
          {author?.name || "Anonymous"}
        </p>
        <div className="flex items-center space-x-1">
          <FaCalendarAlt className="text-zinc-500" />
          <span>
            {createdAt
              ? format(new Date(createdAt), "MMMM d, yyyy")
              : "Date unavailable"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuthorInfo;
