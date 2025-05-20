// src/components/LogIn.jsx (or your component path)
// @ts-nocheck
"use client";

import { useLoginMutation } from "@/lib/user/userSlice";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react"; // Added useCallback
import { BsGoogle } from "react-icons/bs";
import {
  FaEnvelope,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaExclamationTriangle, // For error summary
  FaCheckCircle, // For success feedback
  FaSpinner, // For loading state
} from "react-icons/fa";
import { useRouter } from "next/navigation";

// --- Component ---
function LogIn() {
  const router = useRouter();

  const [
    loginTrigger,
    {
      data: loginResponseData,
      error: loginApiError, // Renamed for clarity
      isLoading: isLoginLoading,
      isSuccess: isLoginSuccess,
      isError: isApiError, // Renamed for clarity regarding API errors
      reset: resetLoginMutation, // Renamed for clarity
    },
  ] = useLoginMutation();

  // --- State Management ---
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState({}); // For client-side validation errors
  const [formFeedback, setFormFeedback] = useState(null); // For API responses or general form info/errors

  const [showPassword, setShowPassword] = useState(false);

  // --- Input Change Handler ---
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));

    // Clear client-side error for this field
    if (formErrors[id]) {
      setFormErrors((prev) => ({ ...prev, [id]: null }));
    }

    // Clear general form feedback (API errors, etc.) on any input change
    if (formFeedback) {
      setFormFeedback(null);
    }
    // If there was an API error or success, and user starts typing, reset mutation state
    if (isApiError || isLoginSuccess) {
      resetLoginMutation();
    }
  };

  // --- Validation Logic ---
  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email address is invalid.";
    }
    if (!formData.password) {
      newErrors.password = "Password is required.";
    }
    // No min length for password on login, backend will validate actual password
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // --- Form Submission Handler ---
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    resetLoginMutation(); // Reset mutation state for a fresh attempt
    setFormFeedback(null); // Clear previous general feedback

    if (!validateForm()) {
      // formErrors are already set by validateForm.
      // No general formFeedback needed here; individual errors and summary will show.
      return;
    }

    try {
      await loginTrigger({
        email: formData.email,
        password: formData.password,
      }).unwrap();
      // Success is now handled by the useEffect below
    } catch (error) {
      let errorMessage =
        "Login failed. Please check your credentials or try again.";
      const newApiFieldErrors = {};

      // Customize based on your backend's error response structure
      if (error?.data?.message) {
        errorMessage = error.data.message;
        if (
          errorMessage.toLowerCase().includes("user not found") ||
          errorMessage.toLowerCase().includes("email")
        ) {
          newApiFieldErrors.email = "Email not found or incorrect.";
        }
        if (
          errorMessage.toLowerCase().includes("invalid credentials") ||
          errorMessage.toLowerCase().includes("password")
        ) {
          newApiFieldErrors.password = "Incorrect password.";
          // If it's a general invalid credentials message, you might not want to highlight a specific field
          // but the main feedback is usually enough.
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setFormFeedback({ type: "error", text: errorMessage });
      if (Object.keys(newApiFieldErrors).length > 0) {
        setFormErrors((prev) => ({ ...prev, ...newApiFieldErrors }));
      }
    }
  };

  // --- Effect for API Success ---
  useEffect(() => {
    if (isLoginSuccess && loginResponseData) {
      setFormFeedback({
        type: "success",
        text: loginResponseData.message || "Login successful! Redirecting...",
      });
      setFormData({ email: "", password: "" }); // Clear form
      setFormErrors({}); // Clear client-side validation errors

      const timer = setTimeout(() => {
        router.push("/"); // Redirect to dashboard or home page
      }, 1500); // Delay for user to see success message
      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [isLoginSuccess, loginResponseData, router]);

  const handleGoogleLogin = () => {
    console.log("Initiate Google Log in");
    // Actual Google OAuth implementation needed here
  };

  // --- Render ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 px-4 py-12 w-full font-sans">
      <form
        onSubmit={handleSubmitForm}
        className="w-full max-w-lg bg-zinc-900 p-6 sm:p-8 rounded-xl shadow-2xl border border-zinc-700 flex flex-col gap-5"
        noValidate
        autoComplete="off"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-zinc-100 mb-2">
            Welcome Back!
          </h2>
          <p className="text-sm text-zinc-400">
            Log in to continue to your account.
          </p>
        </div>

        <p className="text-sm text-center text-zinc-400">
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Sign Up
          </Link>
        </p>

        {/* Email */}
        <div className="form-control w-full">
          <label className="label" htmlFor="email">
            <span className="label-text text-zinc-300 flex items-center gap-2">
              <FaEnvelope className="text-zinc-500" /> Email Address
            </span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className={`input input-bordered w-full bg-zinc-800 border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
              formErrors.email
                ? "input-error border-red-500"
                : "border-zinc-600"
            }`}
          />
          {formErrors.email && (
            <label className="label">
              <span className="label-text-alt text-red-400 text-xs">
                {formErrors.email}
              </span>
            </label>
          )}
        </div>

        {/* Password */}
        <div className="form-control w-full">
          <label className="label" htmlFor="password">
            <span className="label-text text-zinc-300 flex items-center gap-2">
              <FaKey className="text-zinc-500" /> Password
            </span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              className={`input input-bordered w-full bg-zinc-800 border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-10 ${
                formErrors.password
                  ? "input-error border-red-500"
                  : "border-zinc-600"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-200"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>
          {formErrors.password && (
            <label className="label">
              <span className="label-text-alt text-red-400 text-xs">
                {formErrors.password}
              </span>
            </label>
          )}
        </div>

        <div className="flex justify-end mt-1">
          <Link
            href="/auth/forgot-password" // Adjust link as needed
            className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Feedback Area: General Feedback (API Success/Error) + Client Validation Summary */}
        <div className="mt-2 space-y-3">
          {/* General Form Feedback (API responses, etc.) */}
          {formFeedback && (
            <div
              className={`p-3 border text-sm rounded-lg flex items-center gap-2 ${
                formFeedback.type === "success"
                  ? "bg-green-900/50 border-green-700 text-green-300"
                  : ""
              } ${
                formFeedback.type === "error"
                  ? "bg-red-900/50 border-red-700 text-red-300"
                  : ""
              }`}
              role={formFeedback.type === "success" ? "status" : "alert"}
            >
              {formFeedback.type === "success" && <FaCheckCircle />}
              {formFeedback.type === "error" && <FaExclamationTriangle />}
              {formFeedback.text}
            </div>
          )}

          {/* Client-side Validation Errors Summary */}
          {(() => {
            const activeErrors = Object.entries(formErrors)
              .filter(([, errorMessage]) => !!errorMessage)
              .map(([fieldKey, errorMessage]) => ({
                id: `login-summary-error-${fieldKey}`,
                message: errorMessage,
              }));

            if (activeErrors.length > 0) {
              return (
                <div
                  className="p-3 border border-red-700 bg-red-900/50 text-red-300 rounded-lg text-sm"
                  role="alert"
                >
                  <div className="flex items-center gap-2 mb-2 font-medium">
                    <FaExclamationTriangle />
                    <span>Please address the following issues:</span>
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

        <button
          type="submit"
          disabled={isLoginLoading}
          className="btn btn-primary w-full mt-3"
        >
          {isLoginLoading ? (
            <>
              {" "}
              <FaSpinner className="animate-spin" /> Logging In...
            </>
          ) : (
            "Log In"
          )}
        </button>

        <div className="divider text-zinc-500 text-xs">OR</div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="btn btn-outline border-zinc-600 hover:bg-zinc-800 w-full"
        >
          <BsGoogle className="mr-2" /> Log In with Google
        </button>
      </form>
    </div>
  );
}
export default LogIn;
