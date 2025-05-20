// @ts-nocheck
// src/app/profile/[userId]/page.tsx (assuming you rename/move for dynamic routing)
// OR src/app/profile/page.tsx (if you adapt it to check params for optional userId)
"use client";

import { useState, useEffect, FormEvent, ChangeEvent, useRef } from "react";
import {
  FaUserEdit,
  FaEnvelope,
  FaCamera,
  FaLock,
  FaIdBadge,
  FaInfoCircle,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaUserCircle, // For default avatar
} from "react-icons/fa";
import { BsArrowLeft } from "react-icons/bs";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation"; // useParams for dynamic route
import { useSelector } from "react-redux"; // To get logged-in user's ID

import {
  useGetMeQuery, // For logged-in user's own data
  // Assume you add a query like this to your userSlice.ts:
  // useGetUserPublicProfileQuery, // To fetch any user's public profile by ID
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useLogoutUserMutation,
  useDeleteMyProfileMutation,
} from "@/lib/user/userSlice";
import { selectCurrentUserId } from "@/lib/auth/authSlice"; // To get loggedInUserID
import { dataURLtoFile } from "./dataURLtoFile";

const ImageCropper = dynamic(() => import("@/components/ImageCropper"), {
  ssr: false,
});

// --- Interfaces --- (Assuming User interface is the same)
interface User {
  id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null; // Only available for own profile
  bio?: string | null;
  profileImage?: string | null;
  bannerImage?: string | null;
  role?: string;
  settings?: any;
  createdAt?: string;
  updatedAt?: string;
}

// Define a type for the data fetched for public view (might exclude email etc.)
interface PublicUserProfile
  extends Omit<User, "email" | "settings" | "role" | "updatedAt"> {
  // Add any specific fields that are public
}

interface GlobalAlertMessage {
  type: "success" | "error" | "info" | null;
  text: string | null;
}
interface FormFeedback {
  type: "success" | "error" | "info" | null;
  text: string | null;
}
interface ProfileFormErrors {
  name?: string;
  username?: string;
  email?: string;
}
interface PasswordFormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB
const DEFAULT_PROFILE_SRC = "/default-profile.jpeg";
const DEFAULT_BANNER_SRC = "/default-banner.jpeg";

/*
   Placeholder for the new query in your userSlice.ts:
  // In userSlice.ts endpoints:
  getUserPublicProfile: builder.query<PublicUserProfile, string>({ // string is userId
    query: (userId) => `/users/${userId}/profile`, // Example endpoint
    providesTags: (result, error, userId) => [{ type: 'UserProfile', id: userId }],
  }),
  // Export: useGetUserPublicProfileQuery
*/
// For this example, we'll mock `useGetUserPublicProfileQuery` if you haven't implemented it yet.
// This is a simplified mock, replace with your actual RTK Query hook.
const useGetUserPublicProfileQuery = (
  userId: string | null,
  options?: { skip?: boolean }
) => {
  const {
    data: meData,
    isLoading: meLoading,
    isError: meError,
    refetch: meRefetch,
  } = useGetMeQuery(undefined, { skip: !!userId }); // Skip if viewing someone else
  if (userId && meData && userId === meData.id) {
    // If viewing self via params
    return {
      data: meData as PublicUserProfile,
      isLoading: meLoading,
      isError: meError,
      refetch: meRefetch,
    };
  }
  // In a real scenario, this would be a separate API call:
  // For now, if it's not "me", we return a dummy or error state.
  // Replace this with your actual RTK Query hook for fetching other users.
  if (options?.skip || !userId) {
    return {
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: () => {},
    };
  }
  // This is a placeholder. YOU NEED TO IMPLEMENT THIS QUERY.
  console.warn(
    "`useGetUserPublicProfileQuery` is not fully implemented. Using placeholder logic."
  );
  return {
    data: undefined,
    isLoading: true,
    isError: true,
    error: { message: "Public profile fetching not implemented." },
    refetch: () => {},
  };
};

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const deleteModalRef = useRef<HTMLDialogElement>(null);

  // Get ID of the profile being viewed from URL params
  const viewedUserIdFromParams =
    typeof params.userId === "string" ? params.userId : null;

  // Get logged-in user's ID from Redux store
  const loggedInUserId = useSelector(selectCurrentUserId);

  // Fetch logged-in user's own detailed data (always, for auth status and potential own profile view)
  const {
    data: loggedInUserData, // Contains email, settings etc.
    isLoading: isGetMeLoading,
    isError: isGetMeErrorOnLoad, // Differentiate from public profile fetch error
    refetch: refetchLoggedInUserData,
  } = useGetMeQuery();

  // Fetch public profile data for the viewedUserId (if different from loggedInUserId)
  // Skip if viewedUserIdFromParams is null (meaning we are on /profile for loggedInUser)
  // OR if viewedUserIdFromParams is the same as loggedInUserId (then use loggedInUserData)
  const skipPublicProfileQuery =
    !viewedUserIdFromParams || loggedInUserId === viewedUserIdFromParams;
  const {
    data: publicProfileData, // Contains only public fields
    isLoading: isPublicProfileLoading,
    isError: isPublicProfileError,
    error: publicProfileFetchError,
    refetch: refetchPublicProfileData,
  } = useGetUserPublicProfileQuery(viewedUserIdFromParams, {
    skip: skipPublicProfileQuery,
  });

  // Determine which user data to display and whether the viewer is the owner
  const [profileToDisplay, setProfileToDisplay] = useState<
    User | PublicUserProfile | null
  >(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isProfileFetchError, setIsProfileFetchError] = useState(false);

  useEffect(() => {
    if (viewedUserIdFromParams) {
      // Viewing a specific profile via /profile/[userId]
      if (!skipPublicProfileQuery) {
        // Fetching someone else's profile
        setIsLoadingProfile(isPublicProfileLoading);
        if (publicProfileData) {
          setProfileToDisplay(publicProfileData);
          setIsOwner(loggedInUserId === publicProfileData.id);
          setIsProfileFetchError(false);
        } else if (isPublicProfileError) {
          setProfileToDisplay(null);
          setIsProfileFetchError(true);
        }
      } else if (
        loggedInUserData &&
        viewedUserIdFromParams === loggedInUserData.id
      ) {
        // Viewing own profile via /profile/[ownId]
        setIsLoadingProfile(isGetMeLoading);
        setProfileToDisplay(loggedInUserData as any);
        setIsOwner(true);
        setIsProfileFetchError(isGetMeErrorOnLoad);
      } else {
        // Still loading loggedInUserData to compare IDs
        setIsLoadingProfile(isGetMeLoading);
      }
    } else {
      // Viewing own profile via /profile (no userId in params)
      setIsLoadingProfile(isGetMeLoading);
      if (loggedInUserData) {
        setProfileToDisplay(loggedInUserData);
        setIsOwner(true);
        setIsProfileFetchError(isGetMeErrorOnLoad);
      } else if (isGetMeErrorOnLoad) {
        setProfileToDisplay(null);
        setIsProfileFetchError(true);
      }
    }
  }, [
    viewedUserIdFromParams,
    loggedInUserId,
    loggedInUserData,
    publicProfileData,
    isGetMeLoading,
    isPublicProfileLoading,
    isGetMeErrorOnLoad,
    isPublicProfileError,
    skipPublicProfileQuery,
  ]);

  const [updateProfile, { isLoading: isUpdatingProfile }] =
    useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();
  const [logoutUser, { isLoading: isLoggingOut }] = useLogoutUserMutation();
  const [deleteMyProfile, { isLoading: isDeletingProfile }] =
    useDeleteMyProfileMutation();

  const [profileData, setProfileData] = useState({
    name: "",
    username: "",
    email: "",
    bio: "",
  });
  const [profileFormErrors, setProfileFormErrors] = useState<ProfileFormErrors>(
    {}
  );
  const [profileFormFeedback, setProfileFormFeedback] = useState<FormFeedback>({
    type: null,
    text: null,
  });

  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(
    DEFAULT_PROFILE_SRC
  );
  const [bannerPicPreview, setBannerPicPreview] = useState<string | null>(
    DEFAULT_BANNER_SRC
  );

  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [isUploadingBannerImage, setIsUploadingBannerImage] = useState(false);

  const [croppingImageSrc, setCroppingImageSrc] = useState<string | null>(null);
  const [croppingType, setCroppingType] = useState<"profile" | "banner" | null>(
    null
  );
  const [cropAspectRatio, setCropAspectRatio] = useState(1);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordFormErrors, setPasswordFormErrors] =
    useState<PasswordFormErrors>({});
  const [passwordFormFeedback, setPasswordFormFeedback] =
    useState<FormFeedback>({ type: null, text: null });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [newPasswordStrengthLabel, setNewPasswordStrengthLabel] = useState("");
  const [globalAlert, setGlobalAlert] = useState<GlobalAlertMessage>({
    type: null,
    text: null,
  });

  useEffect(() => {
    if (profileToDisplay) {
      setProfileData({
        name: profileToDisplay.name || "",
        username: profileToDisplay.username || "",
        // Email should only be settable if viewing own profile and email is available
        email:
          isOwner && "email" in profileToDisplay && profileToDisplay.email
            ? profileToDisplay.email
            : "",
        bio: profileToDisplay.bio || "",
      });
      setProfilePicPreview(
        profileToDisplay.profileImage || DEFAULT_PROFILE_SRC
      );
      setBannerPicPreview(profileToDisplay.bannerImage || DEFAULT_BANNER_SRC);
    }
  }, [profileToDisplay, isOwner]);

  const showGlobalAlert = (type: GlobalAlertMessage["type"], text: string) => {
    /* ... (no change) ... */
    setGlobalAlert({ type, text });
  };
  const handleProfileInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    /* ... (no change) ... */
    setGlobalAlert({ type: null, text: null });
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (profileFormErrors[name as keyof ProfileFormErrors]) {
      setProfileFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (profileFormFeedback.text)
      setProfileFormFeedback({ type: null, text: null });
  };
  const handlePasswordInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    /* ... (no change) ... */
    setGlobalAlert({ type: null, text: null });
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (name === "newPassword") calculatePasswordStrength(value);
    if (passwordFormErrors[name as keyof PasswordFormErrors]) {
      setPasswordFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (passwordFormFeedback.text)
      setPasswordFormFeedback({ type: null, text: null });
  };
  const handleImageFileSelected = (
    e: ChangeEvent<HTMLInputElement>,
    type: "profile" | "banner"
  ) => {
    /* ... (no change) ... */
    const file = e.target.files?.[0];
    if (file) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        showGlobalAlert(
          "error",
          `Invalid file type. Allowed: JPEG, PNG, GIF, WEBP.`
        );
        e.target.value = "";
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        showGlobalAlert(
          "error",
          `File too large. Max: ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`
        );
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCroppingImageSrc(reader.result as string);
        setCroppingType(type);
        setCropAspectRatio(type === "profile" ? 1 : 16 / 6);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };
  const handleCropDone = async (croppedImageBase64: string) => {
    /* ... (no change other than using refetchLoggedInUserData) ... */
    if (!croppingType) return;
    const timestamp = new Date().getTime();
    const filename = `${croppingType}_${timestamp}.png`;
    const croppedFile = dataURLtoFile(croppedImageBase64, filename);

    if (croppedFile) {
      const previewUrl = URL.createObjectURL(croppedFile);
      const formData = new FormData();
      let uploadTypeForFeedback: "Profile picture" | "Banner image" =
        "Profile picture";

      if (croppingType === "profile") {
        setProfilePicPreview(previewUrl);
        formData.append("profileImageFile", croppedFile);
        setIsUploadingProfileImage(true);
        uploadTypeForFeedback = "Profile picture";
      } else {
        setBannerPicPreview(previewUrl);
        formData.append("bannerImageFile", croppedFile);
        setIsUploadingBannerImage(true);
        uploadTypeForFeedback = "Banner image";
      }
      setCroppingImageSrc(null);
      try {
        const response = await updateProfile(formData).unwrap();
        showGlobalAlert(
          "success",
          response?.message || `${uploadTypeForFeedback} updated successfully!`
        );
        refetchLoggedInUserData(); // Use the refetch from useGetMeQuery if this is an update to own profile
        // If you were updating someone else, this would be different.
        // For now, profile updates are only for the logged-in user.
      } catch (error: any) {
        showGlobalAlert(
          "error",
          error?.data?.message ||
            `Failed to update ${uploadTypeForFeedback.toLowerCase()}. Please try again.`
        );
      } finally {
        if (croppingType === "profile") setIsUploadingProfileImage(false);
        else setIsUploadingBannerImage(false);
        setCroppingType(null);
      }
    } else {
      showGlobalAlert("error", "Could not process the cropped image.");
      setCroppingImageSrc(null);
      setCroppingType(null);
    }
  };
  const handleCropCancel = () => {
    /* ... (no change) ... */
    setCroppingImageSrc(null);
    setCroppingType(null);
  };
  const validateProfileInfo = (): boolean => {
    /* ... (no change) ... */
    const errors: ProfileFormErrors = {};
    if (!profileData.name.trim()) errors.name = "Name is required.";
    if (!profileData.username.trim()) errors.username = "Username is required.";
    else if (profileData.username.length < 3)
      errors.username = "Username must be at least 3 characters.";
    else if (!/^[a-zA-Z0-9_]+$/.test(profileData.username))
      errors.username =
        "Username can only contain letters, numbers, and underscores.";
    // Only validate email if it's part of the form for the owner
    if (isOwner && "email" in profileData && !profileData.email.trim())
      errors.email = "Email is required.";
    else if (
      isOwner &&
      "email" in profileData &&
      !/\S+@\S+\.\S+/.test(profileData.email)
    )
      errors.email = "Email address is invalid.";
    setProfileFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const calculatePasswordStrength = (password: string) => {
    /* ... (no change) ... */
    if (!password) {
      setNewPasswordStrengthLabel("");
      return;
    }
    let score = 0;
    if (password.length >= 8) score++;
    if (/\d/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) score++;
    if (password.length < 8) {
      setNewPasswordStrengthLabel("Too Short");
      return;
    }
    let label = "Very Weak";
    if (score <= 2) label = "Weak";
    if (score === 3) label = "Medium";
    if (score === 4) label = "Strong";
    if (score === 5) label = "Very Strong";
    setNewPasswordStrengthLabel(label);
  };
  const validatePasswordChange = (): boolean => {
    /* ... (no change) ... */
    const errors: PasswordFormErrors = {};
    if (!passwordData.currentPassword)
      errors.currentPassword = "Current password is required.";
    if (!passwordData.newPassword)
      errors.newPassword = "New password is required.";
    else if (passwordData.newPassword.length < 8)
      errors.newPassword = "New password must be at least 8 characters.";
    if (!passwordData.confirmNewPassword)
      errors.confirmNewPassword = "Please confirm your new password.";
    else if (passwordData.newPassword !== passwordData.confirmNewPassword)
      errors.confirmNewPassword = "New passwords do not match.";
    if (
      passwordData.currentPassword &&
      passwordData.newPassword === passwordData.currentPassword
    )
      errors.newPassword =
        (errors.newPassword ? errors.newPassword + " " : "") +
        "New password cannot be the same as the current password.";
    setPasswordFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleProfileUpdateSubmit = async (e: FormEvent) => {
    /* ... (no change other than using refetchLoggedInUserData) ... */
    e.preventDefault();
    setGlobalAlert({ type: null, text: null });
    setProfileFormErrors({});
    setProfileFormFeedback({ type: null, text: null });

    if (!isOwner) {
      // Security check on frontend, backend should enforce
      setGlobalAlert({
        type: "error",
        text: "You are not authorized to perform this action.",
      });
      return;
    }

    const changes: Partial<User> = {};
    if (profileData.name !== (profileToDisplay?.name || ""))
      changes.name = profileData.name;
    if (profileData.username !== (profileToDisplay?.username || ""))
      changes.username = profileData.username;
    // Email update only if owner and email field was available
    if (
      isOwner &&
      "email" in profileData &&
      profileData.email !==
        (("email" in profileToDisplay! && profileToDisplay.email) || "")
    ) {
      changes.email = profileData.email;
    }
    if (profileData.bio !== (profileToDisplay?.bio || ""))
      changes.bio = profileData.bio;

    const hasTextChanged = Object.keys(changes).length > 0;
    if (!hasTextChanged) {
      setProfileFormFeedback({
        type: "info",
        text: "No text changes to update.",
      });
      return;
    }
    if (!validateProfileInfo()) {
      setProfileFormFeedback({
        type: "error",
        text: "Please correct the errors highlighted above.",
      });
      return;
    }
    const formData = new FormData();
    Object.entries(changes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });
    try {
      const response = await updateProfile(formData).unwrap();
      setProfileFormFeedback({
        type: "success",
        text: response?.message || "Profile information updated successfully!",
      });
      refetchLoggedInUserData(); // If viewing own profile
      if (viewedUserIdFromParams && viewedUserIdFromParams !== loggedInUserId) {
        refetchPublicProfileData(); // If viewing someone else's and somehow updating (should be disallowed)
      }
    } catch (error: any) {
      const backendErrorMessage =
        error?.data?.message || "Failed to update profile information.";
      if (
        changes.username &&
        backendErrorMessage.toLowerCase().includes("username")
      ) {
        setProfileFormErrors((prev) => ({
          ...prev,
          username: backendErrorMessage,
        }));
        setProfileFormFeedback({
          type: "error",
          text: "Please correct the username error.",
        });
      } else if (
        changes.email &&
        backendErrorMessage.toLowerCase().includes("email")
      ) {
        setProfileFormErrors((prev) => ({
          ...prev,
          email: backendErrorMessage,
        }));
        setProfileFormFeedback({
          type: "error",
          text: "Please correct the email error.",
        });
      } else {
        setProfileFormFeedback({ type: "error", text: backendErrorMessage });
      }
    }
  };
  const handleChangePasswordSubmit = async (e: FormEvent) => {
    /* ... (no change) ... */
    e.preventDefault();
    setGlobalAlert({ type: null, text: null });
    setPasswordFormErrors({});
    setPasswordFormFeedback({ type: null, text: null });
    if (!isOwner) {
      setGlobalAlert({
        type: "error",
        text: "You are not authorized to perform this action.",
      });
      return;
    }
    if (!validatePasswordChange()) {
      setPasswordFormFeedback({
        type: "error",
        text: "Please correct the errors highlighted above.",
      });
      return;
    }
    try {
      const response = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }).unwrap();
      setPasswordFormFeedback({
        type: "success",
        text: response?.message || "Password changed successfully!",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);
      setNewPasswordStrengthLabel("");
      setPasswordFormErrors({});
    } catch (error: any) {
      const backendErrorMessage =
        error?.data?.message || "Failed to change password.";
      if (backendErrorMessage.toLowerCase().includes("current password")) {
        setPasswordFormErrors((prev) => ({
          ...prev,
          currentPassword: backendErrorMessage,
        }));
        setPasswordFormFeedback({
          type: "error",
          text: "Please correct the current password error.",
        });
      } else {
        setPasswordFormFeedback({ type: "error", text: backendErrorMessage });
      }
    }
  };
  const handleLogOut = async () => {
    /* ... (no change) ... */
    setGlobalAlert({ type: null, text: null });
    setProfileFormFeedback({ type: null, text: null });
    setPasswordFormFeedback({ type: null, text: null });
    try {
      showGlobalAlert("info", "Logging out...");
      await logoutUser().unwrap();
      router.push("/auth/signup");
    } catch (error: any) {
      showGlobalAlert(
        "error",
        error?.data?.message || "Logout failed. Please try again."
      );
    }
  };
  const handleDeleteProfile = () => {
    /* ... (no change) ... */
    setGlobalAlert({ type: null, text: null });
    if (!isOwner) {
      showGlobalAlert(
        "error",
        "You are not authorized to delete this profile."
      );
      return;
    }
    deleteModalRef.current?.showModal();
  };
  const executeConfirmedDelete = async () => {
    /* ... (no change) ... */
    deleteModalRef.current?.close();
    setGlobalAlert({ type: null, text: null });
    setProfileFormFeedback({ type: null, text: null });
    setPasswordFormFeedback({ type: null, text: null });
    if (!isOwner) {
      showGlobalAlert(
        "error",
        "You are not authorized to delete this profile."
      );
      return;
    }
    try {
      showGlobalAlert("info", "Deleting account...");
      await deleteMyProfile().unwrap();
      router.push("/auth/signup");
    } catch (error: any) {
      showGlobalAlert(
        "error",
        error?.data?.message || "Failed to delete account. Please try again."
      );
    }
  };
  const renderFormFeedback = (feedback: FormFeedback) => {
    /* ... (no change) ... */
    if (!feedback.text) return null;
    let icon = null;
    let textColor = "text-zinc-400";
    if (feedback.type === "success") {
      icon = <FaCheckCircle className="shrink-0 h-4 w-4 text-green-500" />;
      textColor = "text-green-500";
    } else if (feedback.type === "error") {
      icon = <FaExclamationCircle className="shrink-0 h-4 w-4 text-red-500" />;
      textColor = "text-red-500";
    } else if (feedback.type === "info") {
      icon = <FaInfoCircle className="shrink-0 h-4 w-4 text-blue-500" />;
      textColor = "text-blue-500";
    }
    return (
      <div
        role="alert"
        className={`mt-3 text-sm flex items-center gap-2 ${textColor}`}
      >
        {icon}
        <span>{feedback.text}</span>
      </div>
    );
  };

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-zinc-950 text-white">
        <span className="loading loading-lg loading-spinner text-blue-500"></span>
      </div>
    );
  }

  if (isProfileFetchError || !profileToDisplay) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-zinc-950 text-white p-4">
        <p className="text-xl text-red-500 mb-4">
          {viewedUserIdFromParams
            ? "Could not load this user's profile."
            : "Could not load your profile."}
        </p>
        <p className="mb-6 text-zinc-400 text-center">
          {publicProfileFetchError
            ? (publicProfileFetchError as any)?.data?.message ||
              (publicProfileFetchError as any)?.error ||
              "User not found or an error occurred."
            : "Please try again later or check your connection."}
        </p>
        <Link
          href={viewedUserIdFromParams ? "/projects" : "/auth/login"} // Or just "/"
          className="btn btn-primary"
        >
          {viewedUserIdFromParams ? "Back to Projects" : "Go to Login"}
        </Link>
      </div>
    );
  }

  // Now use `profileToDisplay` for rendering name, username, bio, images.
  // And `isOwner` to conditionally render forms and danger zone.

  return (
    <>
      <section className="min-h-screen bg-zinc-950 text-white px-4 py-10 selection:bg-blue-600 selection:text-white">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link
              href="/" // Consider making this dynamic, e.g., back to projects or user's previous page
              className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-sm mb-6 transition-colors duration-150"
            >
              <BsArrowLeft /> Back to Home
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-center sm:text-left text-zinc-100">
              {isOwner
                ? "Account Settings"
                : `${profileToDisplay.name || "User"}'s Profile`}
            </h1>
          </div>

          {globalAlert.text /* Global Alert unchanged */ && (
            <div
              role="alert"
              className={`alert shadow-md ${
                globalAlert.type === "success"
                  ? "alert-success bg-green-700/80 border border-green-500 text-white"
                  : globalAlert.type === "error"
                  ? "alert-error bg-red-700/80 border border-red-500 text-white"
                  : "alert-info bg-blue-700/80 border border-blue-500 text-white"
              } text-sm p-3 rounded-lg my-6 flex items-center justify-between gap-3`}
            >
              <div className="flex items-center gap-2">
                {globalAlert.type === "success" && (
                  <FaCheckCircle className="stroke-current shrink-0 h-5 w-5" />
                )}
                {globalAlert.type === "error" && (
                  <FaExclamationCircle className="stroke-current shrink-0 h-5 w-5" />
                )}
                {globalAlert.type === "info" && (
                  <FaInfoCircle className="stroke-current shrink-0 h-5 w-5" />
                )}
                <span className="text-xs sm:text-sm">{globalAlert.text}</span>
              </div>
              <button
                onClick={() => setGlobalAlert({ type: null, text: null })}
                className="btn btn-xs btn-ghost p-0 hover:bg-transparent"
                aria-label="Close alert"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          <div className="bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
            <div className="relative h-48 md:h-64 w-full group bg-zinc-800">
              <Image
                src={bannerPicPreview || DEFAULT_BANNER_SRC} // Uses local preview if available, else server/default
                alt={`${profileToDisplay.name || "User"}'s Banner`}
                fill
                className="object-cover w-full h-full"
                priority
                key={bannerPicPreview + (profileToDisplay.bannerImage || "")} // Ensure re-render on change
              />
              {isOwner && ( // Only show upload option if owner
                <>
                  <label
                    htmlFor="bannerUploadInput"
                    className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                      isUploadingBannerImage
                        ? "cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                    title="Change banner image"
                  >
                    <div className="flex flex-col items-center text-white p-4 bg-black/60 rounded-lg">
                      <FaCamera size={28} />
                      <span className="mt-1 text-xs font-medium">
                        Change Banner
                      </span>
                    </div>
                    <input
                      type="file"
                      id="bannerUploadInput"
                      accept={ALLOWED_IMAGE_TYPES.join(",")}
                      onChange={(e) => handleImageFileSelected(e, "banner")}
                      className="hidden"
                      disabled={isUploadingBannerImage}
                    />
                  </label>
                  {isUploadingBannerImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                      <div className="text-white text-center">
                        <FaSpinner className="animate-spin h-8 w-8 mx-auto mb-2" />
                        Uploading Banner...
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 md:px-8">
              <div className="relative -mt-12 md:-mt-16 flex flex-col sm:flex-row items-center sm:items-end gap-4 md:gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-[5px] border-zinc-900 shadow-xl bg-zinc-800 flex items-center justify-center">
                    {/* Display default icon if no profile image and not loading */}
                    {!profilePicPreview && !isUploadingProfileImage ? (
                      <FaUserCircle className="w-full h-full text-zinc-500 p-2" />
                    ) : (
                      <Image
                        src={profilePicPreview || DEFAULT_PROFILE_SRC}
                        alt={`${
                          profileToDisplay.name || "User"
                        }'s Profile Picture`}
                        width={128}
                        height={128}
                        className="object-cover w-full h-full"
                        key={
                          profilePicPreview +
                          (profileToDisplay.profileImage || "")
                        }
                      />
                    )}
                  </div>
                  {isOwner && ( // Only show upload option if owner
                    <>
                      <label
                        htmlFor="profileUploadInput"
                        className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                          isUploadingProfileImage
                            ? "cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                        title="Change profile picture"
                      >
                        <FaCamera size={18} className="text-white" />
                        <input
                          id="profileUploadInput"
                          type="file"
                          accept={ALLOWED_IMAGE_TYPES.join(",")}
                          onChange={(e) =>
                            handleImageFileSelected(e, "profile")
                          }
                          className="hidden"
                          disabled={isUploadingProfileImage}
                        />
                      </label>
                      {isUploadingProfileImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full">
                          <div className="text-white text-center text-xs">
                            <FaSpinner className="animate-spin h-6 w-6 mx-auto mb-1" />
                            Uploading...
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="text-center sm:text-left pb-2 sm:pb-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-zinc-100">
                    {profileToDisplay.name || "User"}
                  </h2>
                  <p className="text-zinc-400 text-sm">
                    @{profileToDisplay.username || "username"}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 md:px-8 py-8">
              {/* Public Bio Section - Always Visible */}
              {profileToDisplay.bio && (
                <div className="mb-12 p-6 bg-zinc-800/60 rounded-lg border border-zinc-700/50">
                  <h3 className="text-xl font-semibold text-zinc-200 mb-3 flex items-center gap-2">
                    <FaInfoCircle className="text-blue-400" /> About{" "}
                    {profileToDisplay.name || "User"}
                  </h3>
                  <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {profileToDisplay.bio}
                  </p>
                </div>
              )}
              {!profileToDisplay.bio && !isOwner && (
                <div className="mb-12 p-6 bg-zinc-800/60 rounded-lg border border-zinc-700/50 text-center text-zinc-400">
                  This user hasn't shared a bio yet.
                </div>
              )}

              {isOwner && ( // Show forms and danger zone only to the owner
                <>
                  <form
                    className="space-y-6 mb-12"
                    onSubmit={handleProfileUpdateSubmit}
                    noValidate
                  >
                    {/* ... (Profile Information Form unchanged from your code) ... */}
                    <h3 className="text-xl font-semibold text-zinc-200 border-b border-zinc-700 pb-3 mb-6">
                      Profile Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="name"
                          className="text-sm font-medium text-zinc-400 flex items-center gap-2"
                        >
                          <FaIdBadge className="text-zinc-500" /> Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={profileData.name}
                          onChange={handleProfileInputChange}
                          placeholder="Your full name"
                          className={`input input-bordered w-full bg-zinc-800 border-zinc-700 focus:border-blue-500 focus:ring-blue-500 ${
                            profileFormErrors.name
                              ? "input-error border-red-500"
                              : ""
                          }`}
                        />
                        {profileFormErrors.name && (
                          <p className="text-xs text-red-500 mt-1">
                            {profileFormErrors.name}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="username"
                          className="text-sm font-medium text-zinc-400 flex items-center gap-2"
                        >
                          <FaUserEdit className="text-zinc-500" /> Username
                        </label>
                        <input
                          id="username"
                          name="username"
                          type="text"
                          value={profileData.username}
                          onChange={handleProfileInputChange}
                          placeholder="Your unique username"
                          className={`input input-bordered w-full bg-zinc-800 border-zinc-700 focus:border-blue-500 focus:ring-blue-500 ${
                            profileFormErrors.username
                              ? "input-error border-red-500"
                              : ""
                          }`}
                        />
                        {profileFormErrors.username && (
                          <p className="text-xs text-red-500 mt-1">
                            {profileFormErrors.username}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="email"
                        className="text-sm font-medium text-zinc-400 flex items-center gap-2"
                      >
                        <FaEnvelope className="text-zinc-500" /> Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={profileData.email}
                        onChange={handleProfileInputChange}
                        placeholder="your.email@example.com"
                        className={`input input-bordered w-full bg-zinc-800 border-zinc-700 focus:border-blue-500 focus:ring-blue-500 ${
                          profileFormErrors.email
                            ? "input-error border-red-500"
                            : ""
                        }`}
                      />
                      {profileFormErrors.email && (
                        <p className="text-xs text-red-500 mt-1">
                          {profileFormErrors.email}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="bio"
                        className="text-sm font-medium text-zinc-400 flex items-center gap-2"
                      >
                        <FaInfoCircle className="text-zinc-500" /> Bio
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        rows={4}
                        value={profileData.bio}
                        onChange={handleProfileInputChange}
                        placeholder="Tell us a little about yourself..."
                        className="textarea textarea-bordered w-full bg-zinc-800 border-zinc-700 focus:border-blue-500 focus:ring-blue-500"
                      ></textarea>
                    </div>
                    <div className="mt-6">
                      <button
                        type="submit"
                        disabled={
                          isUpdatingProfile ||
                          isUploadingProfileImage ||
                          isUploadingBannerImage
                        }
                        className="btn btn-primary w-full sm:w-auto"
                      >
                        {isUpdatingProfile ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" /> Saving
                            Information...
                          </>
                        ) : (
                          "Save Profile Information"
                        )}
                      </button>
                      {renderFormFeedback(profileFormFeedback)}
                    </div>
                  </form>

                  <form
                    className="space-y-6 mb-12"
                    onSubmit={handleChangePasswordSubmit}
                    noValidate
                  >
                    {/* ... (Change Password Form unchanged from your code) ... */}
                    <h3 className="text-xl font-semibold text-zinc-200 border-b border-zinc-700 pb-3 mb-6">
                      Change Password
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="currentPassword"
                          className="text-sm font-medium text-zinc-400 flex items-center gap-2"
                        >
                          <FaLock className="text-zinc-500" /> Current Password
                        </label>
                        <div className="relative">
                          <input
                            id="currentPassword"
                            name="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Enter current password"
                            className={`input input-bordered w-full bg-zinc-800 border-zinc-700 focus:border-blue-500 focus:ring-blue-500 pr-10 ${
                              passwordFormErrors.currentPassword
                                ? "input-error border-red-500"
                                : ""
                            }`}
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-200"
                            aria-label={
                              showCurrentPassword
                                ? "Hide current password"
                                : "Show current password"
                            }
                          >
                            {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                        {passwordFormErrors.currentPassword && (
                          <p className="text-xs text-red-500 mt-1">
                            {passwordFormErrors.currentPassword}
                          </p>
                        )}
                      </div>
                      <div></div> {/* Spacer */}
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="newPassword"
                          className="text-sm font-medium text-zinc-400 flex items-center gap-2"
                        >
                          <FaKey className="text-zinc-500" /> New Password
                        </label>
                        <div className="relative">
                          <input
                            id="newPassword"
                            name="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Enter new password"
                            className={`input input-bordered w-full bg-zinc-800 border-zinc-700 focus:border-blue-500 focus:ring-blue-500 pr-10 ${
                              passwordFormErrors.newPassword
                                ? "input-error border-red-500"
                                : ""
                            }`}
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-200"
                            aria-label={
                              showNewPassword
                                ? "Hide new password"
                                : "Show new password"
                            }
                          >
                            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                        {passwordData.newPassword && (
                          <p
                            className={`text-xs mt-1 ${
                              newPasswordStrengthLabel === "Very Strong"
                                ? "text-green-600"
                                : newPasswordStrengthLabel === "Strong"
                                ? "text-green-500"
                                : newPasswordStrengthLabel === "Medium"
                                ? "text-yellow-500"
                                : newPasswordStrengthLabel === "Weak"
                                ? "text-orange-500"
                                : "text-red-500"
                            }`}
                          >
                            Strength: {newPasswordStrengthLabel || "Very Weak"}
                          </p>
                        )}
                        {passwordFormErrors.newPassword && (
                          <p className="text-xs text-red-500 mt-1">
                            {passwordFormErrors.newPassword}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="confirmNewPassword"
                          className="text-sm font-medium text-zinc-400 flex items-center gap-2"
                        >
                          <FaKey className="text-zinc-500" /> Confirm New
                          Password
                        </label>
                        <div className="relative">
                          <input
                            id="confirmNewPassword"
                            name="confirmNewPassword"
                            type={showConfirmNewPassword ? "text" : "password"}
                            value={passwordData.confirmNewPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Confirm new password"
                            className={`input input-bordered w-full bg-zinc-800 border-zinc-700 focus:border-blue-500 focus:ring-blue-500 pr-10 ${
                              passwordFormErrors.confirmNewPassword
                                ? "input-error border-red-500"
                                : ""
                            }`}
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmNewPassword(!showConfirmNewPassword)
                            }
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-200"
                            aria-label={
                              showConfirmNewPassword
                                ? "Hide confirm new password"
                                : "Show confirm new password"
                            }
                          >
                            {showConfirmNewPassword ? (
                              <FaEyeSlash />
                            ) : (
                              <FaEye />
                            )}
                          </button>
                        </div>
                        {passwordFormErrors.confirmNewPassword && (
                          <p className="text-xs text-red-500 mt-1">
                            {passwordFormErrors.confirmNewPassword}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-6">
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="btn btn-primary w-full sm:w-auto"
                      >
                        {isChangingPassword ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>{" "}
                            Updating Password...
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </button>
                      {renderFormFeedback(passwordFormFeedback)}
                      {(() => {
                        const activeErrors = Object.entries(passwordFormErrors)
                          .filter(([, errorMessage]) => !!errorMessage)
                          .map(([fieldKey, errorMessage]) => ({
                            id: `password-${fieldKey}`,
                            message: errorMessage as string,
                          }));
                        if (activeErrors.length > 0) {
                          return (
                            <div
                              className="mt-3 p-3 border border-red-500/50 bg-red-900/20 text-red-400 rounded-lg text-sm"
                              role="alert"
                            >
                              <div className="flex items-center gap-2 mb-1 font-medium text-red-300">
                                <FaExclamationCircle />
                                <span>
                                  Please correct the following issues:
                                </span>
                              </div>
                              <ul className="list-disc pl-5 space-y-0.5 text-xs">
                                {activeErrors.map((error) => (
                                  <li key={error.id}>{error.message}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    {(() => {
                      const activeErrors = Object.entries(profileFormErrors)
                        .filter(([, errorMessage]) => !!errorMessage)
                        .map(([fieldKey, errorMessage]) => ({
                          id: `profile-${fieldKey}`,
                          message: errorMessage as string,
                        }));
                      if (activeErrors.length > 0) {
                        return (
                          <div
                            className="mt-3 p-3 border border-red-500/50 bg-red-900/20 text-red-400 rounded-lg text-sm"
                            role="alert"
                          >
                            {" "}
                            <div className="flex items-center gap-2 mb-1 font-medium text-red-300">
                              <FaExclamationCircle />
                              <span>Please correct the following issues:</span>
                            </div>
                            <ul className="list-disc pl-5 space-y-0.5 text-xs">
                              {activeErrors.map((error) => (
                                <li key={error.id}>{error.message}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </form>

                  <div className="mt-12 pt-8 border-t border-zinc-700">
                    {/* ... (Danger Zone unchanged from your code) ... */}
                    <h3 className="text-xl font-semibold text-red-500 mb-4">
                      Danger Zone
                    </h3>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-zinc-800/60 rounded-lg border border-red-500/40">
                      <p className="text-sm text-zinc-300 max-w-md">
                        These actions are critical and may have irreversible
                        consequences. Proceed with caution.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
                        <button
                          onClick={handleLogOut}
                          disabled={isLoggingOut}
                          className="btn btn-outline border-zinc-600 hover:bg-zinc-700 text-zinc-300 hover:text-white w-full sm:w-auto"
                        >
                          {" "}
                          {isLoggingOut ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : null}{" "}
                          Log Out
                        </button>
                        <button
                          onClick={handleDeleteProfile}
                          disabled={isDeletingProfile || isLoggingOut}
                          className="btn btn-error btn-outline w-full sm:w-auto"
                        >
                          {" "}
                          {isDeletingProfile ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : null}{" "}
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Delete Account Modal unchanged */}
      <dialog
        ref={deleteModalRef}
        id="delete_account_modal"
        className="modal modal-bottom sm:modal-middle"
        onClose={() => {}}
      >
        <div className="modal-box bg-zinc-800 text-zinc-100">
          <form method="dialog">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              aria-label="Close modal"
              onClick={() => {}}
            >
              ✕
            </button>
          </form>
          <h3 className="font-bold text-lg text-red-500">
            Confirm Account Deletion
          </h3>
          <p className="py-4 text-zinc-300">
            Are you absolutely sure you want to delete your account? This action
            is permanent and cannot be undone. All your data will be removed.
          </p>
          <div className="modal-action">
            <form method="dialog" className="w-full flex justify-end gap-3">
              <button
                className="btn btn-outline border-zinc-600 hover:bg-zinc-700 text-zinc-300"
                onClick={() => {}}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={executeConfirmedDelete}
                disabled={isDeletingProfile}
                type="button"
              >
                {isDeletingProfile ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>{" "}
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete My Account"
                )}
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="button" onClick={() => {}}>
            close
          </button>
        </form>
      </dialog>

      {/* Image Cropper unchanged */}
      {croppingImageSrc && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <ImageCropper
            imageSrc={croppingImageSrc}
            aspectRatio={cropAspectRatio}
            onCropDone={handleCropDone}
            onCropCancel={handleCropCancel}
          />
        </div>
      )}
    </>
  );
}
