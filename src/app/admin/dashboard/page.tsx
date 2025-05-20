// src/admin/dashboard/page.tsx
"use client"; // For potential client-side interactions in future

import React from "react";
import AdminLayout from "@/components/admin/AdminLayout"; // Adjust path as needed
import {
  FaUsers,
  FaFileSignature,
  FaComments,
  FaUserPlus,
  FaEye,
  FaChartLine,
  FaExclamationTriangle,
  FaShieldAlt,
  FaTasks,
  FaUserClock,
  FaUserSlash,
  FaUserShield,
  FaCog,
} from "react-icons/fa";
import {
  dummyUsers,
  dummyPosts,
  dummyComments,
  dummyRecentActivity,
  DummyActivityLog,
} from "@/components/admin/dummyData"; // Adjust path

// Helper function to format time ago (simplified)
const formatTimeAgo = (isoDateString: string) => {
  const date = new Date(isoDateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `${seconds} sec ago`;
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  return `${days} day(s) ago`;
};

const DashboardPage = () => {
  // In a real app, these would be derived from API calls or selectors
  const totalUsers = dummyUsers.length;
  const newUsersToday = dummyUsers.filter(
    (u) => new Date(u.createdAt) > new Date(Date.now() - 1000 * 60 * 60 * 24)
  ).length;
  const totalPosts = dummyPosts.length;
  const postsToday = dummyPosts.filter(
    (p) => new Date(p.createdAt) > new Date(Date.now() - 1000 * 60 * 60 * 24)
  ).length;
  const totalComments = dummyComments.length;
  const flaggedComments = dummyComments.filter(
    (c) => c.status === "FlaggedForReview"
  ).length;
  const flaggedPosts = dummyPosts.filter(
    (p) => p.status === "FlaggedForReview"
  ).length;
  const pendingModeration = flaggedComments + flaggedPosts;

  const getIconForActivity = (type: DummyActivityLog["type"]) => {
    switch (type) {
      case "NEW_USER":
        return <FaUserPlus className="text-success" />;
      case "NEW_POST":
        return <FaFileSignature className="text-info" />;
      case "NEW_COMMENT":
        return <FaComments className="text-accent" />;
      case "FLAGGED_CONTENT":
        return <FaExclamationTriangle className="text-warning" />;
      case "USER_BANNED":
        return <FaUserSlash className="text-error" />;
      case "ROLE_CHANGED":
        return <FaUserShield className="text-secondary" />;
      default:
        return <FaTasks />;
    }
  };

  return (
    <AdminLayout pageTitle="Dashboard Overview">
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {/* Total Users Stat */}
        <div className="stats shadow bg-zinc-800 border border-zinc-700 rounded-lg">
          <div className="stat p-5">
            <div className="stat-figure text-primary">
              <FaUsers className="text-4xl opacity-80" />
            </div>
            <div className="stat-title text-zinc-400">Total Users</div>
            <div className="stat-value text-3xl font-bold text-zinc-100">
              {totalUsers}
            </div>
            <div className="stat-desc text-success">
              ↗︎ {newUsersToday} new today
            </div>
          </div>
        </div>

        {/* Total Posts Stat */}
        <div className="stats shadow bg-zinc-800 border border-zinc-700 rounded-lg">
          <div className="stat p-5">
            <div className="stat-figure text-info">
              <FaFileSignature className="text-4xl opacity-80" />
            </div>
            <div className="stat-title text-zinc-400">Total Posts</div>
            <div className="stat-value text-3xl font-bold text-zinc-100">
              {totalPosts}
            </div>
            <div className="stat-desc text-info">↗︎ {postsToday} new today</div>
          </div>
        </div>

        {/* Total Comments Stat */}
        <div className="stats shadow bg-zinc-800 border border-zinc-700 rounded-lg">
          <div className="stat p-5">
            <div className="stat-figure text-accent">
              <FaComments className="text-4xl opacity-80" />
            </div>
            <div className="stat-title text-zinc-400">Total Comments</div>
            <div className="stat-value text-3xl font-bold text-zinc-100">
              {totalComments}
            </div>
            {/* <div className="stat-desc text-zinc-500">Across all posts</div> */}
          </div>
        </div>

        {/* Moderation Queue Stat */}
        <div className="stats shadow bg-zinc-800 border border-zinc-700 rounded-lg">
          <div className="stat p-5">
            <div
              className={`stat-figure ${
                pendingModeration > 0
                  ? "text-error animate-pulse"
                  : "text-success"
              }`}
            >
              <FaShieldAlt className="text-4xl opacity-80" />
            </div>
            <div className="stat-title text-zinc-400">Moderation Queue</div>
            <div className="stat-value text-3xl font-bold text-zinc-100">
              {pendingModeration}
            </div>
            <div
              className={`stat-desc ${
                pendingModeration > 0 ? "text-error" : "text-zinc-500"
              }`}
            >
              {pendingModeration > 0
                ? `${pendingModeration} items require review`
                : "Queue is clear!"}
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Placeholder 1: User Growth */}
        <div className="card bg-zinc-800 shadow-xl border border-zinc-700 lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title text-zinc-100 mb-4">
              Platform Growth Trends
            </h2>
            <div className="h-72 bg-zinc-700/50 rounded-lg flex items-center justify-center text-zinc-500">
              <FaChartLine className="text-6xl mr-3 opacity-50" />
              <div>
                <p className="font-semibold">
                  User Registrations & Content Volume
                </p>
                <p className="text-sm">
                  (Chart Placeholder - e.g., Line chart for users/posts over
                  time)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="card bg-zinc-800 shadow-xl border border-zinc-700">
          <div className="card-body">
            <h2 className="card-title text-zinc-100 mb-4">Recent Activity</h2>
            <div className="overflow-y-auto h-72 space-y-1 pr-1">
              {" "}
              {/* Added pr-1 for scrollbar space */}
              {dummyRecentActivity.slice(0, 10).map(
                (
                  activity // Show latest 10
                ) => (
                  <div
                    key={activity.id}
                    className={`p-3 rounded-md flex items-start gap-3 hover:bg-zinc-700/60 transition-colors ${
                      activity.isCritical
                        ? "border-l-2 border-error"
                        : "border-l-2 border-primary/50"
                    }`}
                  >
                    <span className="mt-1 text-lg">
                      {getIconForActivity(activity.type)}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-zinc-200 leading-tight">
                        {activity.description}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {activity.actorName && (
                          <span className="font-medium">
                            {activity.actorName}
                          </span>
                        )}{" "}
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                )
              )}
              {dummyRecentActivity.length === 0 && (
                <p className="text-zinc-500 text-center py-10">
                  No recent activity.
                </p>
              )}
            </div>
            {dummyRecentActivity.length > 10 && (
              <div className="card-actions justify-end mt-4">
                <button className="btn btn-sm btn-outline btn-primary">
                  View All Logs
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Placeholder for other sections like "System Health", "Quick Actions" etc. */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">
          Quick Actions & System Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="btn btn-primary btn-outline h-20 text-lg">
            <FaUserPlus className="mr-2" /> Add User
          </button>
          <button className="btn btn-secondary btn-outline h-20 text-lg">
            <FaCog className="mr-2" /> Site Settings
          </button>
          <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700 text-center">
            <p className="text-zinc-400 text-sm">Database Status</p>
            <p className="text-success font-bold text-xl">Online</p>
          </div>
          <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700 text-center">
            <p className="text-zinc-400 text-sm">API Health</p>
            <p className="text-success font-bold text-xl">Operational</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
