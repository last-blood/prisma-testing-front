// filePath: @/components/project/CreateProjectPage.tsx
"use client";

import React, { useState, useCallback, FormEvent, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NextImage from "next/image"; // For displaying previews in a grid

import ReactHashTags from "@/components/ReactHashTags";
import RichTextEditor from "@/components/RichTextEditor";
import ImageComponent from "../ImageComponent"; // Your existing component
import { dataURLtoFile } from "../dataURLtoFile";
import { useCreatePostMutation } from "@/lib/post/postSlice";
import {
  selectCurrentUserId,
  selectIsAuthenticated,
} from "@/lib/auth/authSlice";
import {
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaPlusCircle,
  FaArrowLeft,
  FaTimesCircle, // Icon for remove button
} from "react-icons/fa";

type Tag = string;

interface FormErrors {
  title?: string;
  description?: string;
  content?: string;
  postTags?: string;
  postImages?: string; // Changed from postImage to postImages
  auth?: string;
}

interface FormFeedbackMessage {
  type: "success" | "error" | "info";
  text: string;
}

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB per image
const MAX_IMAGES_COUNT = 6;

export default function CreateProjectPage() {
  const router = useRouter();

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [postTags, setPostTags] = useState<Tag[]>([]);

  // --- MODIFIED: State for multiple images ---
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  // --- END MODIFICATION ---

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formFeedback, setFormFeedback] = useState<FormFeedbackMessage | null>(
    null
  );
  const [imageComponentKey, setImageComponentKey] = useState<number>(
    Date.now()
  );

  const [
    createPostTrigger,
    {
      data: createPostResponseData,
      isLoading: isCreatePostLoading,
      isSuccess: isCreatePostSuccess,
      error: createPostApiError,
      reset: resetCreateMutation,
    },
  ] = useCreatePostMutation();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUserId = useSelector(selectCurrentUserId);

  useEffect(() => {
    if (!isAuthenticated) {
      setFormErrors((prev) => ({
        ...prev,
        auth: "You must be logged in to create a project. Please log in.",
      }));
    } else if (formErrors.auth) {
      setFormErrors((prev) => ({ ...prev, auth: undefined }));
    }
  }, [isAuthenticated, formErrors.auth]);

  useEffect(() => {
    console.log(
      "CreateProjectPage: formFeedback state changed to:",
      formFeedback
    );
  }, [formFeedback]);

  useEffect(() => {
    console.log(
      "CreateProjectPage: Success useEffect triggered. Current state:",
      { isCreatePostSuccess, createPostResponseData }
    );
    if (
      isCreatePostSuccess &&
      createPostResponseData &&
      createPostResponseData.newPost &&
      typeof createPostResponseData.newPost.title === "string"
    ) {
      console.log(
        "CreateProjectPage: Success condition MET. New post details:",
        createPostResponseData.newPost
      );
      const successfulTitle = createPostResponseData.newPost.title;
      setFormFeedback({
        type: "success",
        text: `Project "${successfulTitle}" created successfully!`,
      });
      setTitle("");
      setDescription("");
      setContent("");
      setPostTags([]);
      // --- MODIFIED: Reset multiple images state ---
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setImagePreviewUrls([]);
      // --- END MODIFICATION ---
      setFormErrors({});
      setImageComponentKey((prev) => prev + 1);
    } else if (isCreatePostSuccess) {
      console.warn(
        "CreateProjectPage: isCreatePostSuccess is TRUE, but data is problematic.",
        { responseData: createPostResponseData }
      );
    }
  }, [isCreatePostSuccess, createPostResponseData, imagePreviewUrls]); // Added imagePreviewUrls for cleanup context

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  // --- UNCHANGED: handleInputChange from your original code ---
  const handleInputChange =
    (
      setter: React.Dispatch<React.SetStateAction<string>>,
      fieldName: keyof FormErrors
    ) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setter(e.target.value);
      if (formErrors[fieldName]) {
        setFormErrors((prev) => ({ ...prev, [fieldName]: undefined }));
      }
      if (formFeedback) setFormFeedback(null);
      if (isCreatePostSuccess) {
        resetCreateMutation();
      }
    };

  // --- UNCHANGED: handleTagsChange from your original code ---
  // This includes your original error clearing logic for tags.
  const handleTagsChange = useCallback(
    (newTags: Tag[]) => {
      setPostTags(newTags);
      if (formErrors.postTags) {
        if (
          formErrors.postTags === "At least one technology tag is required." &&
          newTags.length > 0
        ) {
          setFormErrors((prev) => ({ ...prev, postTags: undefined }));
        } else if (
          formErrors.postTags === "Maximum of 10 tags allowed." &&
          newTags.length <= 10
        ) {
          setFormErrors((prev) => ({ ...prev, postTags: undefined }));
        }
      }
      // The line "if (formFeedback) setFormFeedback(null);" was commented out
      // in the version you provided as the base, so keeping it that way.
      if (isCreatePostSuccess) resetCreateMutation();
    },
    [
      formErrors.postTags,
      formFeedback, // Kept formFeedback in deps as per your original structure for this handler
      isCreatePostSuccess,
      resetCreateMutation,
    ]
  );

  // --- UNCHANGED: handleContentChange from your original code ---
  const handleContentChange = useCallback(
    (htmlContent: string) => {
      setContent(htmlContent);
      if (
        formErrors.content &&
        htmlContent.trim() !== "" &&
        htmlContent.trim() !== "<p></p>" &&
        htmlContent.trim() !== "<div><br></div>"
      ) {
        setFormErrors((prev) => ({ ...prev, content: undefined }));
      }
      if (formFeedback) setFormFeedback(null);
      if (isCreatePostSuccess) resetCreateMutation();
    },
    [formErrors.content, formFeedback, isCreatePostSuccess, resetCreateMutation]
  );

  // --- MODIFIED: Renamed from handleImageSelected to handleImageAdded ---
  // Logic to add image to arrays, using your existing ImageComponent flow
  const handleImageAdded = (base64String: string | null) => {
    if (formFeedback) setFormFeedback(null);
    if (isCreatePostSuccess) resetCreateMutation();
    setFormErrors((prev) => ({ ...prev, postImages: undefined })); // Clear general image error

    if (selectedFiles.length >= MAX_IMAGES_COUNT) {
      setFormErrors((prev) => ({
        ...prev,
        postImages: `You can upload a maximum of ${MAX_IMAGES_COUNT} images.`,
      }));
      setImageComponentKey((prevKey) => prevKey + 1); // Reset ImageComponent to clear its state
      return;
    }

    if (base64String) {
      const imageFile = dataURLtoFile(
        base64String,
        `project-image-${Date.now()}.png`
      ); // Unique name
      if (imageFile) {
        if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
          setFormErrors((prev) => ({
            ...prev,
            postImages: "Invalid image type (JPG, PNG, GIF, WEBP allowed).",
          }));
          setImageComponentKey((prevKey) => prevKey + 1);
          return;
        }
        if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
          setFormErrors((prev) => ({
            ...prev,
            postImages: `Image too large (Max ${
              MAX_IMAGE_SIZE_BYTES / (1024 * 1024)
            }MB).`,
          }));
          setImageComponentKey((prevKey) => prevKey + 1);
          return;
        }
        // Add to the list
        setSelectedFiles((prevFiles) => [...prevFiles, imageFile]);
        setImagePreviewUrls((prevUrls) => [
          ...prevUrls,
          URL.createObjectURL(imageFile),
        ]);
      } else {
        setFormErrors((prev) => ({
          ...prev,
          postImages: "Could not process selected image.",
        }));
      }
    }
    // Reset ImageComponent for next potential upload
    setImageComponentKey((prevKey) => prevKey + 1);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    URL.revokeObjectURL(imagePreviewUrls[indexToRemove]);
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
    setImagePreviewUrls((prevUrls) =>
      prevUrls.filter((_, index) => index !== indexToRemove)
    );
    // Clear image error if it was about max count and now it's fine, or if it was a general error.
    if (formErrors.postImages) {
      setFormErrors((prev) => ({ ...prev, postImages: undefined }));
    }
  };
  // --- END MODIFICATION for image handling ---

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    if (!isAuthenticated || !currentUserId)
      newErrors.auth = "Authentication is required to create a project.";
    if (!title.trim()) newErrors.title = "Title is required.";
    else if (title.trim().length < 3 || title.trim().length > 255)
      newErrors.title = "Title must be 3-255 characters.";
    if (!description.trim())
      newErrors.description = "Short description is required.";
    if (
      !content.trim() ||
      content === "<p></p>" ||
      content === "<div><br></div>"
    )
      newErrors.content = "Main content cannot be empty.";
    if (!postTags || postTags.length === 0)
      newErrors.postTags = "At least one technology tag is required.";
    else if (postTags.length > 10)
      newErrors.postTags = "Maximum of 10 tags allowed.";

    // --- MODIFIED: Validate multiple images ---
    if (selectedFiles.length === 0) {
      newErrors.postImages = "At least one project image is required.";
    } else if (selectedFiles.length > MAX_IMAGES_COUNT) {
      newErrors.postImages = `Maximum of ${MAX_IMAGES_COUNT} images allowed. You currently have ${selectedFiles.length}.`;
    }
    // If there was a specific error during single image selection (like type/size) and it's not overridden by count error
    if (formErrors.postImages && !newErrors.postImages) {
      newErrors.postImages = formErrors.postImages;
    }
    // --- END MODIFICATION ---

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    isAuthenticated,
    currentUserId,
    title,
    description,
    content,
    postTags,
    selectedFiles,
    formErrors.postImages,
  ]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetCreateMutation();
    setFormFeedback(null);

    if (!isAuthenticated || !currentUserId) {
      /* ...auth check as original... */ return;
    }
    if (formErrors.auth) {
      /* ...clear auth error as original... */
    }

    if (!validateForm()) {
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("content", content);
    formData.append("postTags", JSON.stringify(postTags));

    // --- MODIFIED: Append multiple files ---
    if (selectedFiles.length > 0) {
      selectedFiles.forEach((file) => {
        formData.append("postImages", file, file.name); // Backend needs to handle "postImages" as an array
      });
    }
    // --- END MODIFICATION ---

    try {
      const result = await createPostTrigger(formData).unwrap();
      console.log(
        "CreateProjectPage: API call successful in handleSubmit. Result:",
        result
      );
    } catch (err: any) {
      console.error(
        "CreateProjectPage: API call failed in handleSubmit. Error:",
        err
      );
      let apiErrorMessage = "Failed to create project. Please try again.";
      if (typeof err === "object" && err !== null) {
        if ("data" in err && typeof (err as any).data?.message === "string") {
          apiErrorMessage = (err as any).data.message;
        } else if ("error" in err && typeof (err as any).error === "string") {
          apiErrorMessage = (err as any).error;
        } else if (
          "message" in err &&
          typeof (err as any).message === "string"
        ) {
          apiErrorMessage = (err as any).message;
        }
      }
      setFormFeedback({ type: "error", text: apiErrorMessage });
    }
  };

  return (
    <div className="p-4 md:p-8 bg-zinc-950 text-zinc-100 min-h-screen">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 group text-sm"
      >
        <FaArrowLeft className="transform transition-transform group-hover:-translate-x-1" />
        Back to Projects
      </Link>
      <h2 className="text-center text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
        Create New Project
      </h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 max-w-4xl w-full mx-auto bg-zinc-900 p-6 sm:p-8 rounded-xl shadow-2xl border border-zinc-700"
        noValidate
      >
        {/* Auth Error Display Unchanged */}
        {formErrors.auth && (
          <div
            className="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-sm flex items-center gap-2"
            role="alert"
          >
            <FaExclamationTriangle /> {formErrors.auth}
          </div>
        )}

        {/* Title Input Unchanged */}
        <div>
          <label
            htmlFor="project-title"
            className="block text-sm font-medium mb-1.5 text-zinc-300"
          >
            Project Title <span className="text-red-500">*</span>
          </label>
          <input
            id="project-title"
            type="text"
            required
            value={title}
            onChange={handleInputChange(setTitle, "title")}
            className={`input input-bordered w-full bg-zinc-800 border ${
              formErrors.title ? "border-red-500" : "border-zinc-600"
            } focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-zinc-500`}
          />
          {formErrors.title && (
            <p id="title-error" className="mt-1 text-xs text-red-400">
              {formErrors.title}
            </p>
          )}
        </div>

        {/* Description Input Unchanged */}
        <div>
          <label
            htmlFor="project-description"
            className="block text-sm font-medium mb-1.5 text-zinc-300"
          >
            Short Description <span className="text-red-500">*</span>
          </label>
          <input
            id="project-description"
            type="text"
            required
            value={description}
            onChange={handleInputChange(setDescription, "description")}
            className={`input input-bordered w-full bg-zinc-800 border ${
              formErrors.description ? "border-red-500" : "border-zinc-600"
            } focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-zinc-500`}
          />
          {formErrors.description && (
            <p id="description-error" className="mt-1 text-xs text-red-400">
              {formErrors.description}
            </p>
          )}
        </div>

        {/* Tags Input Unchanged */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-zinc-300">
            Technology Tags <span className="text-red-500">*</span> (Max 10)
          </label>
          <ReactHashTags
            onChange={handleTagsChange}
            initialTags={postTags}
            key={`tags-create-${postTags.join(",")}`}
          />
          {formErrors.postTags && (
            <p id="postTags-error" className="mt-1 text-xs text-red-400">
              {formErrors.postTags}
            </p>
          )}
        </div>

        {/* --- MODIFIED: Image Input Section --- */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-zinc-300">
            Project Images <span className="text-red-500">*</span> (
            {selectedFiles.length}/{MAX_IMAGES_COUNT} added)
          </label>

          {/* Grid for Image Previews */}
          {imagePreviewUrls.length > 0 && (
            <div className="mt-3 mb-3 p-3 border border-dashed border-zinc-700 rounded-lg bg-zinc-800/40">
              <p className="text-xs text-zinc-400 mb-3">Selected Images:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {imagePreviewUrls.map((url, index) => (
                  <div
                    key={url}
                    className="relative group aspect-square bg-zinc-700 rounded-md overflow-hidden h-24"
                  >
                    {" "}
                    {/* Added fixed height for previews */}
                    <NextImage
                      src={url}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 150px" // Adjusted sizes
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 z-10 leading-none flex items-center justify-center w-5 h-5"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <FaTimesCircle size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ImageComponent for adding new images, shown if less than max */}
          {selectedFiles.length < MAX_IMAGES_COUNT && (
            <div className="mt-2 p-4 border border-zinc-700 rounded-lg bg-zinc-800/40">
              <p className="text-sm text-zinc-300 mb-2">
                Add Image ({selectedFiles.length + 1} of {MAX_IMAGES_COUNT})
              </p>
              <ImageComponent
                key={imageComponentKey} // Resets the component
                onFileSelect={handleImageAdded}
              />
            </div>
          )}
          {selectedFiles.length >= MAX_IMAGES_COUNT &&
            !formErrors.postImages && (
              <p className="mt-2 text-sm text-green-400 p-4 border border-green-700 rounded-lg bg-green-900/30">
                Maximum {MAX_IMAGES_COUNT} images selected.
              </p>
            )}

          {formErrors.postImages && (
            <p id="postImages-error" className="mt-2 text-xs text-red-400">
              {formErrors.postImages}
            </p>
          )}
        </div>
        {/* --- END MODIFICATION --- */}

        {/* Content Editor Unchanged */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-zinc-300">
            Main Content / Project Details{" "}
            <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            onChange={handleContentChange}
            initialContent={content}
          />
          {formErrors.content && (
            <p id="content-error" className="mt-1 text-xs text-red-400">
              {formErrors.content}
            </p>
          )}
        </div>

        {/* Submit Button and Form Feedback Area Unchanged */}
        <div className="mt-6">
          <button
            type="submit"
            className="btn btn-lg w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isCreatePostLoading || !!formErrors.auth}
          >
            {isCreatePostLoading ? (
              <>
                <FaSpinner className="animate-spin" /> Creating Project...
              </>
            ) : (
              <>
                <FaPlusCircle /> Create Project
              </>
            )}
          </button>
          {formFeedback && (
            <div
              className={`mt-4 p-3 border text-sm rounded-lg flex items-center gap-2 ${
                formFeedback.type === "success"
                  ? "bg-green-900/50 border-green-700 text-green-300"
                  : ""
              } ${
                formFeedback.type === "error"
                  ? "bg-red-900/50 border-red-700 text-red-300"
                  : ""
              } ${
                formFeedback.type === "info"
                  ? "bg-blue-900/50 border-blue-700 text-blue-300"
                  : ""
              }`}
              role={formFeedback.type === "success" ? "status" : "alert"}
            >
              {formFeedback.type === "success" && <FaCheckCircle />}{" "}
              {formFeedback.type === "error" && <FaExclamationTriangle />}{" "}
              {formFeedback.type === "info" && <FaInfoCircle />}{" "}
              {formFeedback.text}
            </div>
          )}
          {(() => {
            const activeErrors = Object.entries(formErrors)
              .filter(([key, errorMessage]) => key !== "auth" && !!errorMessage)
              .map(([fieldKey, errorMessage]) => ({
                id: `create-summary-error-${fieldKey}`,
                message: errorMessage as string,
              }));
            if (activeErrors.length > 0) {
              return (
                <div
                  className="mt-4 p-3 border border-red-700 bg-red-900/50 text-red-300 rounded-lg text-sm"
                  role="alert"
                >
                  <div className="flex items-center gap-2 mb-2 font-semibold">
                    <FaExclamationTriangle />
                    <span>Please address the following issues:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
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
      </form>
    </div>
  );
}
