// src/lib/dummyData.ts (or your chosen path)

export type UserStatus = "Active" | "Banned" | "Pending";
export type UserRole = "USER" | "MODERATOR" | "ADMIN";

export interface DummyUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  profileImage: string;
  bannerImage: string;
  bio?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  postsCount: number;
  commentsCount: number;
  lastLogin?: string; // ISO date string
  settings?: {
    theme: string;
    notificationsEnabled: boolean;
  };
}

export type PostStatus =
  | "Published"
  | "Draft"
  | "Hidden"
  | "FlaggedForReview"
  | "Archived";

export interface DummyPost {
  id: string;
  title: string;
  authorId?: string;
  authorUsername?: string;
  authorProfileImage?: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  content?: string;
  postImages: string[];
  postTags: string[];
  commentsCount: number;
  likesCount: number;
  viewsCount: number;
  sharesCount: number;
  status: PostStatus;
  isFeatured: boolean;
}

export type CommentStatus = "Visible" | "Hidden" | "FlaggedForReview" | "Spam";

export interface DummyComment {
  id: string;
  text: string;
  postId: string;
  postTitle?: string;
  authorId?: string;
  authorUsername?: string;
  authorProfileImage?: string;
  parentId?: string | null;
  level: number;
  likesCount: number;
  dislikesCount: number;
  createdAt: string;
  updatedAt: string;
  status: CommentStatus;
}

// --- RECENT ACTIVITY DUMMY DATA ---
export type ActivityType =
  | "NEW_USER"
  | "NEW_POST"
  | "NEW_COMMENT"
  | "FLAGGED_CONTENT"
  | "USER_BANNED"
  | "ROLE_CHANGED";

export interface DummyActivityLog {
  id: string;
  timestamp: string; // ISO date string
  type: ActivityType;
  actorName?: string; // Username of the user/admin who performed the action
  actorId?: string;
  targetType?: "User" | "Post" | "Comment";
  targetId?: string;
  description: string; // Human-readable description of the activity
  isCritical?: boolean;
}

export const dummyUsers: DummyUser[] = [
  {
    id: "usr_001",
    username: "aurora_borealis",
    name: "Alice Wonderland",
    email: "alice.w@example.com",
    role: "ADMIN",
    status: "Active",
    profileImage: "https://source.unsplash.com/random/100x100/?portrait,person",
    bannerImage: "https://source.unsplash.com/random/600x200/?abstract,nature",
    bio: "Lead Admin, keeping things in order. Coffee enthusiast.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 300).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    postsCount: 15,
    commentsCount: 152,
    lastLogin: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    settings: { theme: "DARK", notificationsEnabled: true },
  },
  {
    id: "usr_002",
    username: "cyber_nomad",
    name: "Bob The Builder",
    email: "bob.b@example.com",
    role: "MODERATOR",
    status: "Active",
    profileImage: "https://source.unsplash.com/random/100x100/?portrait,man",
    bannerImage: "https://source.unsplash.com/random/600x200/?technology,city",
    bio: "Moderating discussions and building communities.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 150).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    postsCount: 5,
    commentsCount: 300,
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    settings: { theme: "CYBERPUNK", notificationsEnabled: true },
  },
  {
    id: "usr_003",
    username: "user_galaxy",
    name: "Carol Danvers",
    email: "carol.d@example.com",
    role: "USER",
    status: "Active",
    profileImage: "https://source.unsplash.com/random/100x100/?portrait,woman",
    bannerImage: "https://source.unsplash.com/random/600x200/?space,stars",
    bio: "Just a regular user exploring the platform.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    postsCount: 2,
    commentsCount: 25,
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    settings: { theme: "LIGHT", notificationsEnabled: false },
  },
];

export const dummyPosts: DummyPost[] = [
  {
    id: "post_001",
    title: "Exploring the Wonders of AI in 2025",
    authorId: "usr_001",
    authorUsername: "aurora_borealis",
    authorProfileImage:
      "https://source.unsplash.com/random/100x100/?portrait,person",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    description:
      "A deep dive into the latest advancements in artificial intelligence and their potential impact on society.",
    content: "Full markdown content here...",
    postImages: [
      "https://source.unsplash.com/random/800x600/?technology,ai",
      "https://source.unsplash.com/random/800x600/?future,robot",
    ],
    postTags: ["AI", "Technology", "Future", "Innovation"],
    commentsCount: 127,
    likesCount: 1589,
    viewsCount: 12500,
    sharesCount: 78,
    status: "Published",
    isFeatured: true,
  },
  {
    id: "post_002",
    title: "The Art of Minimalist Web Design",
    authorId: "usr_002",
    authorUsername: "cyber_nomad",
    authorProfileImage:
      "https://source.unsplash.com/random/100x100/?portrait,man",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    description:
      "Discover how less can be more in the world of web aesthetics and user experience.",
    content: "Full markdown content here...",
    postImages: [
      "https://source.unsplash.com/random/800x600/?design,minimalist",
    ],
    postTags: ["Web Design", "UX", "Minimalism"],
    commentsCount: 45,
    likesCount: 750,
    viewsCount: 6200,
    sharesCount: 33,
    status: "Published",
    isFeatured: false,
  },
];

export const dummyComments: DummyComment[] = [
  {
    id: "cmt_001",
    text: "This is a fantastic and insightful post! Really enjoyed the perspective on AI ethics.",
    postId: "post_001",
    postTitle: "Exploring the Wonders of AI in 2025",
    authorId: "usr_003",
    authorUsername: "user_galaxy",
    authorProfileImage:
      "https://source.unsplash.com/random/100x100/?portrait,woman",
    parentId: null,
    level: 0,
    likesCount: 25,
    dislikesCount: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    status: "Visible",
  },
  {
    id: "cmt_004",
    text: "This comment seems like spam. Please review. buy myshoes dot com",
    postId: "post_002",
    postTitle: "The Art of Minimalist Web Design",
    authorId: "usr_004",
    authorUsername: "shadow_walker",
    authorProfileImage:
      "https://source.unsplash.com/random/100x100/?portrait,silhouette",
    parentId: null,
    level: 0,
    likesCount: 0,
    dislikesCount: 15,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    status: "FlaggedForReview",
  },
];

export const dummyRecentActivity: DummyActivityLog[] = [
  {
    id: "act_001",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    type: "NEW_USER",
    actorName: "system",
    description: 'User "new_explorer" registered.',
    isCritical: false,
  },
  {
    id: "act_002",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    type: "NEW_POST",
    actorName: "user_galaxy",
    targetId: "post_new",
    description: 'Created post "My Latest Thoughts".',
    isCritical: false,
  },
  {
    id: "act_003",
    timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    type: "FLAGGED_CONTENT",
    actorName: "moderation_system",
    targetType: "Comment",
    targetId: "cmt_004",
    description: 'Comment by "shadow_walker" flagged as spam.',
    isCritical: true,
  },
  {
    id: "act_004",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    type: "USER_BANNED",
    actorName: "aurora_borealis",
    targetType: "User",
    targetId: "usr_004",
    description: 'User "shadow_walker" banned for policy violation.',
    isCritical: true,
  },
  {
    id: "act_005",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    type: "NEW_COMMENT",
    actorName: "cyber_nomad",
    targetType: "Post",
    targetId: "post_001",
    description: 'Commented on "Exploring the Wonders of AI..."',
    isCritical: false,
  },
  {
    id: "act_006",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    type: "ROLE_CHANGED",
    actorName: "aurora_borealis",
    targetType: "User",
    targetId: "usr_002",
    description: 'User "cyber_nomad" role changed to MODERATOR.',
    isCritical: false,
  },
];
