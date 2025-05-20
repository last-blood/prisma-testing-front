// src/components/SignUp.jsx
// @ts-nocheck
"use client";

import { useSignupMutation } from "@/lib/user/userSlice";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react"; // Added useCallback
import { BsGoogle } from "react-icons/bs";
import {
  FaUser,
  FaEnvelope,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaExclamationTriangle,
  FaCheckCircle, // Added for success feedback
  FaSpinner, // Added for loading state
} from "react-icons/fa";
import { useRouter } from "next/navigation";

// --- Component ---
function SignUp() {
  const router = useRouter();

  const [
    signupTrigger,
    {
      data: signupResponseData,
      error: signupApiError, // Renamed for clarity
      isLoading: isSignupLoading,
      isSuccess: isSignupSuccess,
      isError: isApiError, // Renamed from isSignupError for clarity regarding API errors
      reset: resetSignupMutation, // Renamed from reset
    },
  ] = useSignupMutation();

  // --- State Management ---
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    repeatPassword: "",
  });

  const [formErrors, setFormErrors] = useState({}); // For client-side validation errors
  const [formFeedback, setFormFeedback] = useState(null); // For API responses or general form info/errors

  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [passwordStrengthLabel, setPasswordStrengthLabel] = useState("");

  // --- Input Change Handler ---
  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;

    if (type === "checkbox") {
      setAcceptTerms(checked);
      // Clear terms error if checkbox is interacted with
      if (formErrors.acceptTerms) {
        setFormErrors((prev) => ({ ...prev, acceptTerms: null }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [id]: value,
      }));
      // Clear client-side error for this field
      if (formErrors[id]) {
        setFormErrors((prev) => ({ ...prev, [id]: null }));
      }
    }

    // Clear general form feedback (API errors, etc.) on any input change
    if (formFeedback) {
      setFormFeedback(null);
    }
    // If there was an API error or success, and user starts typing, reset mutation state
    if (isApiError || isSignupSuccess) {
      resetSignupMutation();
    }

    if (id === "password") {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password) => {
    if (!password) {
      setPasswordStrengthLabel("");
      return;
    }
    let score = 0;
    if (password.length >= 8) score++;
    if (/\d/.test(password)) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++; // Mix of case
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) score++;

    let label = "Too Short";
    if (password.length >= 8) {
      label = "Weak";
      if (score === 2) label = "Medium";
      if (score === 3) label = "Strong";
      if (score >= 4) label = "Very Strong";
    }
    setPasswordStrengthLabel(label);
  };

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    if (!formData.username.trim()) newErrors.username = "Username is required.";
    else if (formData.username.length < 3)
      newErrors.username = "Username must be at least 3 characters.";
    else if (!/^[a-zA-Z0-9_]+$/.test(formData.username))
      newErrors.username =
        "Username can only contain letters, numbers, and underscores.";
    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email address is invalid.";
    if (!formData.password) newErrors.password = "Password is required.";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters.";
    if (!formData.repeatPassword)
      newErrors.repeatPassword = "Please confirm your password.";
    else if (formData.password !== formData.repeatPassword)
      newErrors.repeatPassword = "Passwords do not match.";
    if (!acceptTerms)
      newErrors.acceptTerms = "You must accept the terms and conditions.";

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, acceptTerms]);

  // --- Form Submission Handler ---
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    resetSignupMutation(); // Reset mutation state for a fresh attempt
    setFormFeedback(null); // Clear previous general feedback

    if (!validateForm()) {
      // formErrors are already set by validateForm.
      // No general formFeedback needed here; individual errors and summary will show.
      return;
    }

    try {
      await signupTrigger({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      }).unwrap();
      // Success is now handled by the useEffect below
    } catch (error) {
      let errorMessage = "Signup failed. Please try again.";
      const newApiFieldErrors = {};

      if (error?.data?.message) {
        errorMessage = error.data.message;
        // Check for specific backend field errors (customize based on your API response)
        if (errorMessage.toLowerCase().includes("username")) {
          // Simple check
          newApiFieldErrors.username = errorMessage;
        }
        if (errorMessage.toLowerCase().includes("email")) {
          // Simple check
          newApiFieldErrors.email = errorMessage;
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
    if (isSignupSuccess && signupResponseData) {
      setFormFeedback({
        type: "success",
        text: signupResponseData.message || "Signup successful! Redirecting...",
      });
      setFormData({
        name: "",
        username: "",
        email: "",
        password: "",
        repeatPassword: "",
      });
      setAcceptTerms(false);
      setFormErrors({}); // Clear client-side validation errors
      setPasswordStrengthLabel("");

      const timer = setTimeout(() => {
        router.push("/auth/login"); // Redirect to login or dashboard after signup
      }, 2000); // Delay for user to see success message
      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [isSignupSuccess, signupResponseData, router]);

  const handleGoogleSignUp = () => {
    console.log("Initiate Google Sign Up");
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
            Create Account
          </h2>
          <p className="text-sm text-zinc-400">
            Join us and start your journey!
          </p>
        </div>

        <p className="text-sm text-center text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Log In
          </Link>
        </p>

        {/* Input Fields (using form-control structure for better spacing and DaisyUI compatibility) */}
        {/* Name */}
        <div className="form-control w-full">
          <label className="label" htmlFor="name">
            <span className="label-text text-zinc-300 flex items-center gap-2">
              <FaUser className="text-zinc-500" /> Full Name
            </span>
          </label>
          <input
            id="name"
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            className={`input input-bordered w-full bg-zinc-800 border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
              formErrors.name ? "input-error border-red-500" : "border-zinc-600"
            }`}
          />
          {formErrors.name && (
            <label className="label">
              <span className="label-text-alt text-red-400 text-xs">
                {formErrors.name}
              </span>
            </label>
          )}
        </div>

        {/* Username */}
        <div className="form-control w-full">
          <label className="label" htmlFor="username">
            <span className="label-text text-zinc-300 flex items-center gap-2">
              <FaUser className="text-zinc-500" /> Username
            </span>
          </label>
          <input
            id="username"
            type="text"
            placeholder="Choose a unique username"
            autoComplete="username"
            value={formData.username}
            onChange={handleChange}
            className={`input input-bordered w-full bg-zinc-800 border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
              formErrors.username
                ? "input-error border-red-500"
                : "border-zinc-600"
            }`}
          />
          {formErrors.username && (
            <label className="label">
              <span className="label-text-alt text-red-400 text-xs">
                {formErrors.username}
              </span>
            </label>
          )}
        </div>

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
              placeholder="Create a strong password"
              autoComplete="new-password"
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
          {formData.password && (
            <label className="label">
              <span
                className={`label-text-alt text-xs ${
                  passwordStrengthLabel === "Very Strong"
                    ? "text-green-500"
                    : passwordStrengthLabel === "Strong"
                    ? "text-green-400"
                    : passwordStrengthLabel === "Medium"
                    ? "text-yellow-500"
                    : passwordStrengthLabel === "Weak"
                    ? "text-orange-500"
                    : "text-red-500"
                }`}
              >
                Strength: {passwordStrengthLabel || "Too Short"}
              </span>
            </label>
          )}
          {formErrors.password && (
            <label className="label">
              <span className="label-text-alt text-red-400 text-xs">
                {formErrors.password}
              </span>
            </label>
          )}
        </div>

        {/* Repeat Password */}
        <div className="form-control w-full">
          <label className="label" htmlFor="repeatPassword">
            <span className="label-text text-zinc-300 flex items-center gap-2">
              <FaKey className="text-zinc-500" /> Confirm Password
            </span>
          </label>
          <div className="relative">
            <input
              id="repeatPassword"
              type={showRepeatPassword ? "text" : "password"}
              placeholder="Confirm your password"
              autoComplete="new-password"
              value={formData.repeatPassword}
              onChange={handleChange}
              className={`input input-bordered w-full bg-zinc-800 border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-10 ${
                formErrors.repeatPassword
                  ? "input-error border-red-500"
                  : "border-zinc-600"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowRepeatPassword(!showRepeatPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-200"
              aria-label="Toggle password confirmation visibility"
            >
              {showRepeatPassword ? (
                <FaEyeSlash size={18} />
              ) : (
                <FaEye size={18} />
              )}
            </button>
          </div>
          {formErrors.repeatPassword && (
            <label className="label">
              <span className="label-text-alt text-red-400 text-xs">
                {formErrors.repeatPassword}
              </span>
            </label>
          )}
        </div>

        {/* Terms and Conditions */}
        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-3 py-1">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptTerms}
              onChange={handleChange}
              className={`checkbox checkbox-sm ${
                formErrors.acceptTerms ? "checkbox-error" : "checkbox-primary"
              }`}
            />
            <span className="label-text text-zinc-300 text-sm">
              I accept the{" "}
              <Link
                href="/terms"
                target="_blank"
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                Terms and Conditions
              </Link>
            </span>
          </label>
          {formErrors.acceptTerms && (
            <label className="label">
              <span className="label-text-alt text-red-400 text-xs">
                {formErrors.acceptTerms}
              </span>
            </label>
          )}
        </div>

        {/* Feedback Area: General Feedback (API Success/Error) + Client Validation Summary */}
        <div className="mt-2 space-y-3">
          {" "}
          {/* Container for all feedback messages */}
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
                id: `signup-summary-error-${fieldKey}`,
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
          disabled={isSignupLoading}
          className="btn btn-primary w-full mt-3"
        >
          {isSignupLoading ? (
            <>
              {" "}
              <FaSpinner className="animate-spin" /> Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </button>

        <div className="divider text-zinc-500 text-xs">OR</div>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          className="btn btn-outline border-zinc-600 hover:bg-zinc-800 w-full"
        >
          <BsGoogle className="mr-2" /> Sign up with Google
        </button>
      </form>
    </div>
  );
}
export default SignUp;
