// src/app/settings/page.tsx
"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import Link from "next/link";
import {
  FaArrowLeft,
  FaBell,
  FaEnvelopeOpenText,
  FaPaintBrush,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

import { useGetMeQuery } from "@/lib/user/userSlice";
import {
  useUpdateUserSettingsMutation,
  UserSettings,
  ThemePreference, // This is your Prisma/backend enum: LIGHT, DARK, CYBERPUNK
} from "@/lib/settings/settingsSlice";

import { useTheme } from "./useTheme"; // Assuming path from previous setup
import {
  ThemeName as ContextThemeName, // This is 'light' | 'dark' | 'cyberpunk'
  DEFAULT_APP_THEME,
} from "./ThemeContext"; // Assuming path from previous setup

type SettingUpdatePayload = Partial<
  Pick<
    UserSettings,
    "notificationsEnabled" | "emailMarketing" | "emailSocial" | "theme"
  >
>;

const availableThemesForSelect: ContextThemeName[] = [
  "dark",
  "light",
  "cyberpunk",
];

// Helper to convert frontend ContextThemeName (lowercase) to backend ThemePreference (uppercase)
const toBackendThemeValue = (themeName: ContextThemeName): ThemePreference => {
  return themeName.toUpperCase() as ThemePreference;
};

// Helper to convert backend ThemePreference (uppercase) to frontend ContextThemeName (lowercase)
const toFrontendThemeName = (
  themePreference?: ThemePreference | null
): ContextThemeName => {
  if (themePreference) {
    const lower = themePreference.toLowerCase() as ContextThemeName;
    if (availableThemesForSelect.includes(lower)) {
      return lower;
    }
  }
  return DEFAULT_APP_THEME;
};

export default function SettingsPage() {
  const {
    data: currentUser,
    isLoading: isUserLoading,
    refetch: refetchMe,
  } = useGetMeQuery();

  const [
    updateUserSettings,
    {
      isLoading: isUpdatingSettings,
      error: updateError,
      isSuccess: isUpdateSuccess,
    },
  ] = useUpdateUserSettingsMutation();

  const { theme: globalTheme, setTheme: setGlobalTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [emailSocial, setEmailSocial] = useState(true);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (currentUser?.settings) {
      const settings = currentUser.settings as UserSettings;
      setNotificationsEnabled(
        settings.notificationsEnabled !== undefined
          ? settings.notificationsEnabled
          : true
      );
      setEmailMarketing(
        settings.emailMarketing !== undefined ? settings.emailMarketing : false
      );
      setEmailSocial(
        settings.emailSocial !== undefined ? settings.emailSocial : true
      );

      const backendThemePreference = settings.theme; // e.g., DARK
      const frontendThemeName = toFrontendThemeName(backendThemePreference); // e.g., dark

      if (frontendThemeName !== globalTheme) {
        console.log(
          `[SettingsPage] Syncing global theme from currentUser.settings. Backend: ${backendThemePreference}, Frontend: ${frontendThemeName}, CurrentGlobal: ${globalTheme}`
        );
        setGlobalTheme(frontendThemeName);
      }
    }
  }, [currentUser, globalTheme, setGlobalTheme]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isUpdateSuccess) {
      setFeedback({
        type: "success",
        message: "Settings updated successfully!",
      });
      refetchMe();
      timer = setTimeout(() => setFeedback(null), 3000);
    }
    if (updateError) {
      setFeedback({
        type: "error",
        message:
          (updateError as any)?.data?.message || "Failed to update settings.",
      });
      timer = setTimeout(() => setFeedback(null), 5000);
    }
    return () => clearTimeout(timer);
  }, [isUpdateSuccess, updateError, refetchMe]);

  const handleSettingChange = async (
    settingName: keyof SettingUpdatePayload,
    value: boolean | ContextThemeName // For theme, value will be lowercase ContextThemeName from select
  ) => {
    setFeedback(null);
    let payloadValue: boolean | ThemePreference; // This will be sent to backend

    if (settingName === "notificationsEnabled" && typeof value === "boolean") {
      setNotificationsEnabled(value);
      payloadValue = value;
    } else if (settingName === "emailMarketing" && typeof value === "boolean") {
      setEmailMarketing(value);
      payloadValue = value;
    } else if (settingName === "emailSocial" && typeof value === "boolean") {
      setEmailSocial(value);
      payloadValue = value;
    } else if (settingName === "theme" && typeof value === "string") {
      const newFrontendTheme = value as ContextThemeName;
      if (availableThemesForSelect.includes(newFrontendTheme)) {
        setGlobalTheme(newFrontendTheme); // Update context (DOM, localStorage) with "dark", "light", or "cyberpunk"
        payloadValue = toBackendThemeValue(newFrontendTheme); // Convert to "DARK", "LIGHT", "CYBERPUNK" for backend
      } else {
        console.error("Invalid theme value selected in UI:", newFrontendTheme);
        return;
      }
    } else {
      console.error("Invalid setting change:", settingName, value);
      return;
    }

    const payload: SettingUpdatePayload = { [settingName]: payloadValue! };

    try {
      console.log(
        "[SettingsPage] Updating setting with payload for backend:",
        payload
      );
      await updateUserSettings(payload).unwrap();
    } catch (err) {
      console.error("[SettingsPage] Failed to update user settings:", err);
      if (currentUser?.settings) {
        const settings = currentUser.settings as UserSettings;
        if (settingName === "notificationsEnabled")
          setNotificationsEnabled(settings.notificationsEnabled);
        if (settingName === "emailMarketing")
          setEmailMarketing(settings.emailMarketing);
        if (settingName === "emailSocial") setEmailSocial(settings.emailSocial);
        if (settingName === "theme") {
          const oldBackendTheme = settings.theme || ThemePreference.DARK;
          setGlobalTheme(toFrontendThemeName(oldBackendTheme));
        }
      }
    }
  };

  if (isUserLoading && !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[hsl(var(--color-background-hsl))] text-[hsl(var(--color-text-base-hsl))]">
        <FaSpinner className="animate-spin text-4xl text-[hsl(var(--color-primary-hsl))]" />
        <p className="mt-2">Loading settings...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[hsl(var(--color-background-hsl))] text-[hsl(var(--color-text-base-hsl))]">
        <FaExclamationTriangle className="text-4xl text-[hsl(var(--color-error-hsl))] mb-4" />
        <p className="mt-2 text-lg">User data not available. Please log in.</p>
        <Link
          href="/auth/login"
          className="btn bg-[hsl(var(--color-primary-hsl))] text-[hsl(var(--color-text-inverted-hsl))] hover:bg-[hsla(var(--color-primary-hsl)/0.8)] mt-4"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  const currentDropdownThemeValue = globalTheme || DEFAULT_APP_THEME;

  return (
    <div className="min-h-screen p-4 md:p-8 text-[hsl(var(--color-text-base-hsl))]">
      {" "}
      {/* Base text color from theme */}
      <div className="max-w-2xl mx-auto">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-[hsl(var(--color-primary-hsl))] hover:text-[hsl(var(--color-accent-hsl))] mb-6 group text-sm"
        >
          <FaArrowLeft className="transform transition-transform group-hover:-translate-x-1" />
          Back to Profile
        </Link>
        <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--color-secondary-hsl))] to-[hsl(var(--color-primary-hsl))]">
          User Settings
        </h1>

        {feedback && (
          <div
            className={`alert ${
              feedback.type === "success"
                ? "alert-success bg-[hsla(var(--color-success-hsl)/0.1)] text-[hsl(var(--color-success-hsl))]"
                : "alert-error bg-[hsla(var(--color-error-hsl)/0.1)] text-[hsl(var(--color-error-hsl))]"
            } shadow-lg mb-6 text-sm p-3 border ${
              feedback.type === "success"
                ? "border-[hsla(var(--color-success-hsl)/0.3)]"
                : "border-[hsla(var(--color-error-hsl)/0.3)]"
            }`}
          >
            <div className="flex items-center">
              {feedback.type === "success" ? (
                <FaCheckCircle className="mr-2" />
              ) : (
                <FaExclamationTriangle className="mr-2" />
              )}
              <span>{feedback.message}</span>
            </div>
          </div>
        )}

        <div className="space-y-8">
          <div className="p-6 bg-[hsl(var(--color-surface-hsl))] rounded-lg shadow-md border border-[hsl(var(--color-border-hsl))]">
            <h2 className="text-xl font-semibold mb-4 text-[hsl(var(--color-text-base-hsl))] flex items-center gap-2">
              <FaPaintBrush className="text-[hsl(var(--color-accent-hsl))]" />{" "}
              Theme Preference
            </h2>
            <select
              className="select select-bordered w-full bg-[hsl(var(--color-background-hsl))] border-[hsl(var(--color-border-hsl))] text-[hsl(var(--color-text-base-hsl))] focus:border-[hsl(var(--color-primary-hsl))] focus:ring-1 focus:ring-[hsl(var(--color-primary-hsl))]"
              value={currentDropdownThemeValue}
              onChange={(e) =>
                handleSettingChange("theme", e.target.value as ContextThemeName)
              }
              disabled={isUpdatingSettings}
            >
              {availableThemesForSelect.map((themeValue) => (
                <option key={themeValue} value={themeValue}>
                  {themeValue.charAt(0).toUpperCase() + themeValue.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="p-6 bg-[hsl(var(--color-surface-hsl))] rounded-lg shadow-md border border-[hsl(var(--color-border-hsl))]">
            <h2 className="text-xl font-semibold mb-1 text-[hsl(var(--color-text-base-hsl))] flex items-center gap-2">
              <FaBell className="text-[hsl(var(--color-warning-hsl))]" />{" "}
              Notifications
            </h2>
            <p className="text-xs text-[hsl(var(--color-text-muted-hsl))] mb-4">
              Manage your general notification preferences.
            </p>
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4 py-3">
                <input
                  type="checkbox"
                  className="toggle toggle-primary" /* DaisyUI class, will use themed primary from globals.css if DaisyUI variables are mapped */
                  checked={notificationsEnabled}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleSettingChange(
                      "notificationsEnabled",
                      e.target.checked
                    )
                  }
                  disabled={isUpdatingSettings}
                />
                <span className="label-text text-[hsl(var(--color-text-base-hsl))] text-base">
                  Enable All Notifications
                </span>
              </label>
            </div>
          </div>

          <div className="p-6 bg-[hsl(var(--color-surface-hsl))] rounded-lg shadow-md border border-[hsl(var(--color-border-hsl))]">
            <h2 className="text-xl font-semibold mb-1 text-[hsl(var(--color-text-base-hsl))] flex items-center gap-2">
              <FaEnvelopeOpenText className="text-[hsl(var(--color-success-hsl))]" />{" "}
              Email Preferences
            </h2>
            <p className="text-xs text-[hsl(var(--color-text-muted-hsl))] mb-4">
              Choose what kind of emails you want to receive.
            </p>
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4 py-3">
                <input
                  type="checkbox"
                  className="toggle toggle-success" /* DaisyUI class */
                  checked={emailMarketing}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleSettingChange("emailMarketing", e.target.checked)
                  }
                  disabled={isUpdatingSettings}
                />
                <div className="flex flex-col">
                  <span className="label-text text-[hsl(var(--color-text-base-hsl))] text-base">
                    Marketing Emails
                  </span>
                  <span className="text-xs text-[hsl(var(--color-text-muted-hsl))]">
                    Receive newsletters, promotions, and updates.
                  </span>
                </div>
              </label>
            </div>
            <div className="form-control mt-2">
              <label className="label cursor-pointer justify-start gap-4 py-3">
                <input
                  type="checkbox"
                  className="toggle toggle-success" /* DaisyUI class */
                  checked={emailSocial}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleSettingChange("emailSocial", e.target.checked)
                  }
                  disabled={isUpdatingSettings}
                />
                <div className="flex flex-col">
                  <span className="label-text text-[hsl(var(--color-text-base-hsl))] text-base">
                    Social Notifications
                  </span>
                  <span className="text-xs text-[hsl(var(--color-text-muted-hsl))]">
                    Get emails for likes, comments, and new followers.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {isUpdatingSettings && (
            <div className="flex items-center justify-center gap-2 text-sm text-[hsl(var(--color-info-hsl))] mt-4">
              <FaSpinner className="animate-spin" />
              <span>Saving changes...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
