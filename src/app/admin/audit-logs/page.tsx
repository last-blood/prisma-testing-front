// /admin/audit-logs/page.tsx (Conceptual Mockup)
"use client";
import React from "react";
import AdminLayout from "@/components/admin/AdminLayout"; // Adjust path
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaUserCircle as FaUserActor,
  FaFileAlt as FaTargetFile,
  FaComment as FaTargetComment,
} from "react-icons/fa";

// Placeholder for audit log data
const auditLogs = [
  {
    id: "log1",
    timestamp: "2023-05-10 10:00:00",
    actorId: "user2",
    actorName: "jane_admin",
    actorRole: "ADMIN",
    actionType: "USER_ROLE_CHANGED",
    targetType: "User",
    targetId: "user1",
    targetDescription: "john_doe",
    details: { oldRole: "USER", newRole: "MODERATOR" },
    ipAddress: "192.168.1.1",
  },
  {
    id: "log2",
    timestamp: "2023-05-10 09:30:00",
    actorId: "user1",
    actorName: "john_doe",
    actorRole: "USER",
    actionType: "POST_CREATED",
    targetType: "Post",
    targetId: "post123",
    targetDescription: "My New Adventure",
    details: null,
    ipAddress: "10.0.0.5",
  },
  {
    id: "log3",
    timestamp: "2023-05-10 09:00:00",
    actorId: "user3",
    actorName: "banned_user",
    actorRole: "USER",
    actionType: "USER_LOGIN_FAILURE",
    targetType: null,
    targetId: null,
    targetDescription: "Attempted login",
    details: { reason: "Invalid credentials" },
    ipAddress: "203.0.113.45",
  },
  // ... more logs
];

const AuditLogsPage = () => {
  const [selectedLog, setSelectedLog] = React.useState<any>(null);

  const openLogDetailModal = (log: any) => {
    setSelectedLog(log);
    (
      document.getElementById("log_details_modal") as HTMLDialogElement
    )?.showModal();
  };

  const getTargetIcon = (targetType: string | null) => {
    if (targetType === "User") return <FaUserActor className="mr-1 inline" />;
    if (targetType === "Post") return <FaTargetFile className="mr-1 inline" />;
    if (targetType === "Comment")
      return <FaTargetComment className="mr-1 inline" />;
    return null;
  };

  return (
    <AdminLayout pageTitle="Audit Logs">
      {/* Filter and Search Bar */}
      <div className="mb-6 p-4 bg-zinc-800 rounded-lg shadow flex flex-col md:flex-row flex-wrap gap-4 items-center">
        <div className="join flex-grow w-full md:w-auto">
          <input
            className="input input-bordered join-item w-full focus:ring-primary focus:border-primary"
            placeholder="Search logs (actor, target, details)..."
          />
          <button className="btn btn-primary join-item">
            <FaSearch />
          </button>
        </div>
        <input
          type="date"
          className="input input-bordered w-full md:w-auto focus:ring-primary focus:border-primary"
          placeholder="Start Date"
        />
        <input
          type="date"
          className="input input-bordered w-full md:w-auto focus:ring-primary focus:border-primary"
          placeholder="End Date"
        />
        <select className="select select-bordered w-full md:w-auto focus:ring-primary focus:border-primary">
          <option disabled selected>
            Filter by Action Type
          </option>
          <option>USER_LOGIN_SUCCESS</option>
          <option>USER_ROLE_CHANGED</option>
          <option>POST_CREATED</option>
          <option>POST_DELETED</option>
          {/* ... more action types */}
        </select>
        <select className="select select-bordered w-full md:w-auto focus:ring-primary focus:border-primary">
          <option disabled selected>
            Filter by Target Type
          </option>
          <option>User</option>
          <option>Post</option>
          <option>Comment</option>
        </select>
        <button className="btn btn-outline btn-primary w-full md:w-auto">
          <FaFilter className="mr-2" />
          Apply Filters
        </button>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto bg-zinc-800 rounded-lg shadow">
        <table className="table table-zebra w-full table-sm md:table-md">
          <thead>
            <tr className="text-zinc-300">
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>IP Address</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-zinc-700/50">
                <td className="text-zinc-300 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="text-zinc-200">
                  {log.actorName || "System"}
                  {log.actorRole && (
                    <span className="text-xs text-zinc-400 ml-1">
                      ({log.actorRole})
                    </span>
                  )}
                </td>
                <td className="text-zinc-200">
                  <span className="badge badge-neutral">{log.actionType}</span>
                </td>
                <td className="text-zinc-300">
                  {getTargetIcon(log.targetType)}
                  {log.targetDescription || log.targetId || "N/A"}
                </td>
                <td className="text-zinc-300">{log.ipAddress || "N/A"}</td>
                <td>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => openLogDetailModal(log)}
                  >
                    <FaEye /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <div className="join">
          <button className="join-item btn btn-sm">«</button>
          <button className="join-item btn btn-sm btn-active btn-primary">
            1
          </button>
          {/* ... more pages ... */}
          <button className="join-item btn btn-sm">»</button>
        </div>
      </div>

      {/* Log Details Modal */}
      <dialog id="log_details_modal" className="modal">
        <div className="modal-box w-11/12 max-w-3xl bg-zinc-800 text-zinc-200">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <h3 className="font-bold text-lg mb-4 text-primary">
            Log Entry Details
          </h3>
          {selectedLog && (
            <div className="space-y-2 text-sm">
              <p>
                <strong className="text-zinc-400 w-32 inline-block">ID:</strong>{" "}
                {selectedLog.id}
              </p>
              <p>
                <strong className="text-zinc-400 w-32 inline-block">
                  Timestamp:
                </strong>{" "}
                {new Date(selectedLog.timestamp).toLocaleString()}
              </p>
              <p>
                <strong className="text-zinc-400 w-32 inline-block">
                  Actor:
                </strong>{" "}
                {selectedLog.actorName || "System"} (
                {selectedLog.actorRole || "N/A"})
              </p>
              <p>
                <strong className="text-zinc-400 w-32 inline-block">
                  Actor ID:
                </strong>{" "}
                {selectedLog.actorId || "N/A"}
              </p>
              <p>
                <strong className="text-zinc-400 w-32 inline-block">
                  Action Type:
                </strong>{" "}
                {selectedLog.actionType}
              </p>
              <p>
                <strong className="text-zinc-400 w-32 inline-block">
                  Target Type:
                </strong>{" "}
                {selectedLog.targetType || "N/A"}
              </p>
              <p>
                <strong className="text-zinc-400 w-32 inline-block">
                  Target ID:
                </strong>{" "}
                {selectedLog.targetId || "N/A"}
              </p>
              <p>
                <strong className="text-zinc-400 w-32 inline-block">
                  Target Desc:
                </strong>{" "}
                {selectedLog.targetDescription || "N/A"}
              </p>
              <p>
                <strong className="text-zinc-400 w-32 inline-block">
                  IP Address:
                </strong>{" "}
                {selectedLog.ipAddress || "N/A"}
              </p>
              <div>
                <strong className="text-zinc-400 w-32 inline-block align-top">
                  Details:
                </strong>
                <pre className="bg-zinc-900 p-3 rounded-md overflow-x-auto whitespace-pre-wrap text-xs">
                  {selectedLog.details
                    ? JSON.stringify(selectedLog.details, null, 2)
                    : "No additional details."}
                </pre>
              </div>
            </div>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </AdminLayout>
  );
};

export default AuditLogsPage;
