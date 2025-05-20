"use client";

// src/components/admin/AdminLayout.tsx
import React, { ReactNode } from "react";
import Link from "next/link"; // Assuming Next.js for Link component
import {
  FaTachometerAlt,
  FaUsers,
  FaFileSignature,
  FaComments,
  FaHistory,
  FaCog,
  FaSignOutAlt,
  FaBell,
  FaSearch,
  FaBars,
} from "react-icons/fa";

interface AdminLayoutProps {
  children: ReactNode;
  pageTitle: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, pageTitle }) => {
  const adminUser = {
    name: "Admin User",
    profileImage: "https://source.unsplash.com/random/100x100/?profile,admin",
  };

  const navItems = [
    {
      href: "/admin",
      icon: <FaTachometerAlt className="mr-3" />,
      label: "Dashboard",
    },
    {
      href: "/admin/users",
      icon: <FaUsers className="mr-3" />,
      label: "Users",
    },
    {
      href: "/admin/posts",
      icon: <FaFileSignature className="mr-3" />,
      label: "Posts",
    },
    {
      href: "/admin/comments",
      icon: <FaComments className="mr-3" />,
      label: "Comments",
    },
    {
      href: "/admin/audit-logs",
      icon: <FaHistory className="mr-3" />,
      label: "Audit Logs",
    },
  ];

  return (
    <div className="drawer lg:drawer-open bg-zinc-900 min-h-screen text-zinc-300">
      <input id="admin-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col bg-zinc-900">
        {/* Navbar */}
        <div className="navbar bg-zinc-800 border-b border-zinc-700 sticky top-0 z-30 px-4 lg:px-6">
          <div className="flex-none lg:hidden">
            <label
              htmlFor="admin-drawer"
              aria-label="open sidebar"
              className="btn btn-square btn-ghost text-zinc-300"
            >
              <FaBars className="text-xl" />
            </label>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-zinc-100">
              {pageTitle}
            </h1>
          </div>
          <div className="flex-none gap-3">
            <button className="btn btn-ghost btn-circle text-zinc-300 hover:text-zinc-100">
              <FaSearch className="text-lg" />
            </button>
            <button className="btn btn-ghost btn-circle text-zinc-300 hover:text-zinc-100">
              <div className="indicator">
                <FaBell className="text-lg" />
                <span className="badge badge-xs badge-primary indicator-item animate-pulse">
                  3
                </span>
              </div>
            </button>
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full ring-2 ring-primary ring-offset-zinc-800 ring-offset-2">
                  <img src={adminUser.profileImage} alt="Admin" />
                </div>
              </label>
              <ul
                tabIndex={0}
                className="mt-3 z-[50] p-2 shadow menu menu-sm dropdown-content bg-zinc-700 rounded-box w-52 border border-zinc-600"
              >
                <li>
                  <a className="hover:bg-primary hover:text-primary-content">
                    Profile
                  </a>
                </li>
                <li>
                  <a className="hover:bg-primary hover:text-primary-content">
                    Settings
                  </a>
                </li>
                <li>
                  <a className="hover:bg-primary hover:text-primary-content">
                    <FaSignOutAlt className="mr-2" />
                    Logout
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
      <div className="drawer-side z-40">
        <label
          htmlFor="admin-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <aside className="bg-zinc-800 w-64 min-h-full p-0 border-r border-zinc-700 flex flex-col">
          <Link
            href="/admin"
            className="text-3xl font-bold text-primary p-4 hover:opacity-80 transition-opacity flex items-center justify-center h-16 border-b border-zinc-700"
          >
            ADMIN
          </Link>
          <ul className="menu p-4 text-base space-y-1 flex-grow">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="hover:bg-zinc-700 active:bg-primary active:text-primary-content rounded-lg"
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="p-4 border-t border-zinc-700">
            <button className="btn btn-ghost w-full justify-start hover:bg-zinc-700">
              <FaCog className="mr-3" /> Site Settings
            </button>
            <button className="btn btn-error btn-outline w-full justify-start mt-2 hover:bg-error hover:text-error-content">
              <FaSignOutAlt className="mr-3" /> Logout
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminLayout;
