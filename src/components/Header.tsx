"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaUserCircle,
  FaBars,
  FaTimes,
  FaPlus,
  FaCog,
  FaRegBookmark,
  FaRegHeart,
} from "react-icons/fa";
import { IoMdAddCircle } from "react-icons/io";
import React, { useState, useEffect } from "react";
import NextImage from "next/image";

import { useGetMeQuery } from "@/lib/user/userSlice";
import { useSelector } from "react-redux";

import { selectAuthToken } from "@/lib/auth/authSlice";

const navItems = [
  { href: "/", label: "Home", icon: null },
  { href: "/projects/create", label: "Create Project", icon: FaPlus },
  { href: "/admin", label: "Admin", icon: IoMdAddCircle },
  { href: "/projects/saved", label: "Saved", icon: FaRegBookmark },
  { href: "/projects/liked", label: "Liked", icon: FaRegHeart },
  { href: "/projects/my", label: "My", icon: IoMdAddCircle },
];

const FALLBACK_AVATAR_PATH = "/default-avatar.png";

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const token = useSelector(selectAuthToken);
  const skipQuery = !token;

  const {
    data: currentUser,
    isLoading: queryIsLoading,
    isSuccess: queryIsSuccess,
  } = useGetMeQuery(undefined, {
    skip: skipQuery,
    refetchOnMountOrArgChange: true,
  });

  const [avatarSrc, setAvatarSrc] = useState<string>(FALLBACK_AVATAR_PATH);
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);

  useEffect(() => {
    if (currentUser && currentUser.profileImage) {
      if (avatarSrc !== currentUser.profileImage) {
        setIsAvatarLoading(true);
        setAvatarSrc(currentUser.profileImage);
      }
    } else if (currentUser && !currentUser.profileImage) {
      setIsAvatarLoading(false);
      setAvatarSrc(FALLBACK_AVATAR_PATH);
    } else if (!currentUser && !queryIsLoading) {
      setIsAvatarLoading(false);
      setAvatarSrc(FALLBACK_AVATAR_PATH);
    }
  }, [currentUser, queryIsLoading, avatarSrc]);

  const handleAvatarLoad = () => setIsAvatarLoading(false);
  const handleAvatarError = () => {
    setIsAvatarLoading(false);
    setAvatarSrc(FALLBACK_AVATAR_PATH);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const navLinkClasses = (href: string) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
      pathname === href
        ? "bg-zinc-700 text-white"
        : "text-zinc-300 dark:text-zinc-300 text-zinc-700 hover:bg-zinc-700 hover:text-white dark:hover:text-white"
    }`;

  const isLoadingUI = hasMounted && token && queryIsLoading;
  const isLoggedInUI = hasMounted && token && queryIsSuccess && currentUser;

  const renderAvatar = (sizeClass: string, imgSize: number) => {
    if (isLoadingUI && !currentUser) {
      return (
        <div
          className={`${sizeClass} bg-zinc-300 dark:bg-zinc-700 rounded-full animate-pulse`}
        ></div>
      );
    }
    if (isLoggedInUI && currentUser) {
      return (
        <div
          className={`${sizeClass} rounded-full flex items-center justify-center bg-zinc-700 relative overflow-hidden`}
        >
          {isAvatarLoading && (
            <div className="absolute inset-0 bg-zinc-600 animate-pulse rounded-full"></div>
          )}
          <NextImage
            key={avatarSrc}
            src={avatarSrc}
            alt={currentUser.name || currentUser.username || "User"}
            width={imgSize}
            height={imgSize}
            className={`rounded-full object-cover transition-opacity duration-300 ${
              isAvatarLoading ? "opacity-0" : "opacity-100"
            }`}
            onLoad={handleAvatarLoad}
            onError={handleAvatarError}
            sizes={`${imgSize}px`}
          />
        </div>
      );
    }
    return (
      <FaUserCircle
        className={`${sizeClass} text-zinc-400 dark:text-zinc-500`}
      />
    );
  };

  return (
    <header className="bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight flex items-center gap-2 text-zinc-900 dark:text-white"
            >
              🐘 <span className="hidden sm:inline">PGPlayground</span>
            </Link>
          </div>

          <nav className="hidden md:block">
            <ul className="flex space-x-4 items-center">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={navLinkClasses(item.href)}>
                    {item.icon && <item.icon aria-hidden="true" />}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {!hasMounted ? (
              <>
                <div className="h-8 w-8 bg-zinc-300 dark:bg-zinc-700 rounded-full animate-pulse"></div>
                <Link
                  href="/auth/signup"
                  className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 px-3 py-1.5 rounded-md"
                >
                  Sign Up / Login
                </Link>
              </>
            ) : isLoadingUI ? (
              renderAvatar("h-8 w-8", 32)
            ) : isLoggedInUI && currentUser ? (
              <>
                <Link
                  href="/profile"
                  className="focus:outline-none rounded-full p-0.5 block"
                  aria-label="User Profile"
                >
                  {renderAvatar("h-8 w-8", 32)}
                </Link>
                <Link
                  href="/settings"
                  className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  aria-label="Settings"
                  title="Settings"
                >
                  <FaCog className="h-6 w-6" />
                </Link>
                {/* Logout button explicitly removed from desktop header actions */}
              </>
            ) : (
              <Link
                href="/auth/signup"
                className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 px-3 py-1.5 rounded-md"
              >
                Sign Up / Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button & Actions */}
          <div className="md:hidden flex items-center gap-2">
            {!hasMounted ? (
              <>
                <div className="h-7 w-7 bg-zinc-300 dark:bg-zinc-700 rounded-full animate-pulse mr-1"></div>
                <Link
                  href="/auth/signup"
                  className="text-xs px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Login
                </Link>
              </>
            ) : isLoadingUI ? (
              renderAvatar("h-7 w-7", 28)
            ) : isLoggedInUI && currentUser ? (
              <>
                <Link
                  href="/profile"
                  className="text-xl flex items-center justify-center"
                  aria-label="User Profile"
                >
                  {renderAvatar("h-7 w-7", 28)}
                </Link>
                <Link
                  href="/settings"
                  className="text-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center justify-center"
                  aria-label="Settings"
                  title="Settings"
                >
                  <FaCog className="h-6 w-6" />
                </Link>
              </>
            ) : (
              <Link
                href="/auth/signup"
                className="text-xs px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Login
              </Link>
            )}
            <button
              onClick={toggleMobileMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black dark:focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <FaTimes className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <FaBars className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden absolute top-full left-0 right-0 bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-300 dark:border-zinc-700 shadow-lg"
          id="mobile-menu"
        >
          <ul className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${navLinkClasses(
                    item.href
                  )} block w-full text-left`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon && <item.icon aria-hidden="true" />} {item.label}
                </Link>
              </li>
            ))}
            {isLoggedInUI && (
              <li>
                <Link
                  href="/settings"
                  className={`${navLinkClasses(
                    "/settings"
                  )} block w-full text-left`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaCog aria-hidden="true" /> Settings
                </Link>
              </li>
            )}
          </ul>
          {/* Auth actions in mobile menu */}
          <div className="pt-4 pb-3 border-t border-zinc-300 dark:border-zinc-700 px-5">
            {!hasMounted ? (
              <Link
                href="/auth/signup"
                className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white w-full justify-center flex"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign Up / Login
              </Link>
            ) : isLoadingUI ? (
              <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                Loading user...
              </p>
            ) : isLoggedInUI && currentUser ? (
              <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                Manage account in Settings.
              </p>
            ) : (
              <Link
                href="/auth/signup"
                className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white w-full justify-center flex"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign Up / Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
