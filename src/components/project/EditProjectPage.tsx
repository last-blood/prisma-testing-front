// filePath: @/components/project/EditProjectPage.tsx
"use client";

import React, { useState, useCallback, FormEvent, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import NextImage from "next/image"; // For displaying previews

import ReactHashTags from "@/components/ReactHashTags";
import RichTextEditor from "@/components/RichTextEditor";
import ImageComponent from "@/components/ImageComponent";
import { dataURLtoFile } from "@/components/dataURLtoFile";
import {
  useGetPostByIdQuery,
  useUpdatePostMutation,
  BackendPost, // Ensure this type in postSlice has `postImages: string[]`
} from "@/lib/post/postSlice";
import {
  selectCurrentUserId,
  selectIsAuthenticated,
} from "@/lib/auth/authSlice";
import {
  FaSpinner,
  FaArrowLeft,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaTimesCircle, // For remove button
} from "react-icons/fa";

type Tag = string;
interface FormErrors {
  title?: string;
  description?: string;
  content?: string;
  postTags?: string;
  auth?: string;
  postImages?: string; // Changed from postImage
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

// Helper functions (from your original code)
function arraysAreEqual(
  arr1: string[] | null | undefined,
  arr2: string[] | null | undefined
): boolean {
  if (!arr1 && !arr2) return true;
  if (!arr1 || !arr2) return false;
  if (arr1.length !== arr2.length) return false;
  const sortedArr1 = [...arr1].sort();
  const sortedArr2 = [...arr2].sort();
  return sortedArr1.every((value, index) => value === sortedArr2[index]);
}
function normalizeHTMLContent(html: string): string {
  if (!html) return "";
  if (typeof document !== "undefined") {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const textContent = (tempDiv.textContent || tempDiv.innerText || "").trim();
    if (
      textContent === "" &&
      (html.includes("<p><br></p>") ||
        html.includes("<div><br></div>") ||
        html === "<p></p>" ||
        html === "<div></div>")
    ) {
      return "";
    }
    return html.trim();
  }
  return html.trim();
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = typeof params.id === "string" ? params.id : "";

  const {
    data: existingProject, // Should be BackendPost with postImages: string[]
    isLoading: isFetchingLoading,
    isFetching: isActuallyFetching,
    isSuccess: isFetchingSuccess,
    isError: isFetchingError,
    error: fetchingError,
    refetch,
  } = useGetPostByIdQuery(projectId, {
    skip: !projectId,
    refetchOnMountOrArgChange: true,
  });

  const [
    updatePostTrigger,
    {
      data: updateResponseData,
      isLoading: isUpdateLoading,
      isSuccess: isUpdateSuccess,
      error: updatePostApiError,
      reset: resetUpdateMutation,
    },
  ] = useUpdatePostMutation();

  // Form state for text fields
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [postTags, setPostTags] = useState<Tag[]>([]);
  const [isFormDataReady, setIsFormDataReady] = useState<boolean>(false);

  // --- MODIFIED: State for multiple images ---
  const [initialImageUrls, setInitialImageUrls] = useState<string[]>([]); // Original image URLs from server
  const [currentDisplayImages, setCurrentDisplayImages] = useState<
    { url: string; type: "existing" | "new"; file?: File }[]
  >([]);
  const [newlyAddedFiles, setNewlyAddedFiles] = useState<File[]>([]); // New File objects for upload
  // --- END MODIFICATION ---

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formFeedback, setFormFeedback] = useState<FormFeedbackMessage | null>(
    null
  );
  const [imageComponentKey, setImageComponentKey] = useState<number>(
    Date.now()
  );

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUserId = useSelector(selectCurrentUserId);

  // Effect to populate form when existingProject data is available
  useEffect(() => {
    if (existingProject) {
      setTitle(existingProject.title || "");
      setDescription(existingProject.description || "");
      setContent(existingProject.content || "");
      setPostTags(existingProject.postTags || []);

      // --- MODIFIED: Populate multiple image states ---
      // Assuming existingProject.postImages is string[]
      const serverImages = existingProject.postImages || [];
      setInitialImageUrls([...serverImages]); // Store original server URLs
      setCurrentDisplayImages(
        serverImages.map((url) => ({ url, type: "existing" }))
      );
      setNewlyAddedFiles([]); // Clear any pending new files from previous renders/attempts
      // --- END MODIFICATION ---

      setImageComponentKey((prev) => prev + 1); // Reset ImageComponent
      setFormErrors({});
      setIsFormDataReady(true);

      if (!isAuthenticated) {
        setFormErrors((prev) => ({
          ...prev,
          auth: "You must be logged in to edit.",
        }));
      } else if (existingProject.author?.id !== currentUserId) {
        setFormErrors((prev) => ({
          ...prev,
          auth: "You are not authorized to edit this project.",
        }));
      }
    } else {
      setIsFormDataReady(false);
    }
  }, [existingProject, isAuthenticated, currentUserId]);

  // Effect for update success feedback (Unchanged from your original)
  useEffect(() => {
    if (isUpdateSuccess && updateResponseData) {
      setFormFeedback({
        type: "success",
        text:
          updateResponseData.message ||
          `Project "${title}" updated successfully!`,
      });
      // After successful update, refetch to get latest project data which includes
      // potentially new URLs for newly uploaded images.
      // The useEffect[existingProject] will then repopulate the form states.
      refetch();
      setNewlyAddedFiles([]); // Clear files that were just uploaded
    }
  }, [isUpdateSuccess, updateResponseData, title, refetch]); // Added refetch

  // Cleanup object URLs from currentDisplayImages of type 'new'
  useEffect(() => {
    return () => {
      currentDisplayImages.forEach((img) => {
        if (img.type === "new" && img.url.startsWith("blob:")) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [currentDisplayImages]);

  // --- Input Handlers (Unchanged from your original EditProjectPage code) ---
  const handleInputChange =
    (
      setter: React.Dispatch<React.SetStateAction<string>>,
      fieldName: keyof FormErrors
    ) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setter(e.target.value);
      if (formErrors[fieldName])
        setFormErrors((prev) => ({ ...prev, [fieldName]: undefined }));
      if (formFeedback) setFormFeedback(null);
      if (isUpdateSuccess) resetUpdateMutation();
    };

  const handleTagsChange = useCallback(
    (newTags: Tag[]) => {
      const currentTagsSorted = [...postTags].sort();
      const newTagsSorted = [...newTags].sort();
      const tagsContentChanged =
        JSON.stringify(currentTagsSorted) !== JSON.stringify(newTagsSorted);
      const feedbackExists = formFeedback !== null;

      if (isFormDataReady) setPostTags(newTags);
      if (tagsContentChanged && feedbackExists) setFormFeedback(null);

      if (formErrors.postTags) {
        if (
          (newTags.length > 0 &&
            formErrors.postTags ===
              "At least one technology tag is required.") ||
          (newTags.length <= 10 &&
            formErrors.postTags === "Maximum of 10 tags allowed.")
        ) {
          setFormErrors((prev) => ({ ...prev, postTags: undefined }));
        }
      }
      if (isUpdateSuccess) resetUpdateMutation();
    },
    [
      isFormDataReady,
      formErrors.postTags,
      formFeedback,
      postTags,
      isUpdateSuccess,
      resetUpdateMutation,
    ]
  );

  const handleContentChange = useCallback(
    (htmlContent: string) => {
      setContent(htmlContent);
      if (formFeedback) setFormFeedback(null);
      if (
        formErrors.content &&
        htmlContent.trim() !== "<p></p>" &&
        htmlContent.trim() !== "" &&
        htmlContent.trim() !== "<div><br></div>"
      ) {
        setFormErrors((prev) => ({ ...prev, content: undefined }));
      }
      if (isUpdateSuccess) resetUpdateMutation();
    },
    [formErrors.content, formFeedback, isUpdateSuccess, resetUpdateMutation]
  );
  // --- END UNCHANGED INPUT HANDLERS ---

  // --- MODIFIED: Image Handling for Multiple Images (was handleImageSelected) ---
  const handleImageAddedFromComponent = (base64String: string | null) => {
    if (formFeedback) setFormFeedback(null);
    if (isUpdateSuccess) resetUpdateMutation();
    setFormErrors((prev) => ({ ...prev, postImages: undefined }));

    if (currentDisplayImages.length >= MAX_IMAGES_COUNT) {
      setFormErrors((prev) => ({
        ...prev,
        postImages: `Maximum of ${MAX_IMAGES_COUNT} images allowed.`,
      }));
      setImageComponentKey((prev) => prev + 1);
      return;
    }

    if (base64String) {
      const imageFile = dataURLtoFile(
        base64String,
        `new-project-image-${Date.now()}.png`
      );
      if (imageFile) {
        if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
          setFormErrors((prev) => ({
            ...prev,
            postImages: "Invalid image type.",
          }));
          setImageComponentKey((prev) => prev + 1);
          return;
        }
        if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
          setFormErrors((prev) => ({
            ...prev,
            postImages: `Image too large (Max 5MB).`,
          }));
          setImageComponentKey((prev) => prev + 1);
          return;
        }

        const previewUrl = URL.createObjectURL(imageFile);
        setCurrentDisplayImages((prev) => [
          ...prev,
          { url: previewUrl, type: "new", file: imageFile },
        ]);
        setNewlyAddedFiles((prev) => [...prev, imageFile]);
      } else {
        setFormErrors((prev) => ({
          ...prev,
          postImages: "Could not process image.",
        }));
      }
    }
    setImageComponentKey((prev) => prev + 1);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const imageToRemove = currentDisplayImages[indexToRemove];

    if (imageToRemove.type === "new" && imageToRemove.url.startsWith("blob:")) {
      URL.revokeObjectURL(imageToRemove.url);
      setNewlyAddedFiles((prev) =>
        prev.filter((file) => file !== imageToRemove.file)
      );
    }
    // For 'existing' images, removing them from currentDisplayImages means they won't be in 'retainedImageUrls'
    // during submit, implying they should be deleted by the backend if it's set up that way.

    setCurrentDisplayImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );

    if (formErrors.postImages) {
      setFormErrors((prev) => ({ ...prev, postImages: undefined }));
    }
  };
  // --- END MODIFICATION ---

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    // ... (auth, title, description, content, postTags validation as per your original) ...
    if (!isAuthenticated || !currentUserId)
      newErrors.auth = "You must be logged in to edit.";
    else if (existingProject && existingProject.author?.id !== currentUserId)
      newErrors.auth = "You are not authorized to edit this project.";
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

    // --- MODIFIED: Image validation ---
    if (currentDisplayImages.length === 0) {
      newErrors.postImages = "At least one project image is required.";
    } else if (currentDisplayImages.length > MAX_IMAGES_COUNT) {
      newErrors.postImages = `Maximum of ${MAX_IMAGES_COUNT} images. You have ${currentDisplayImages.length}.`;
    }
    if (formErrors.postImages && !newErrors.postImages)
      newErrors.postImages = formErrors.postImages; // Keep specific type/size error if not overridden by count
    // --- END MODIFICATION ---

    setFormErrors(newErrors);
    return !Object.values(newErrors).some(
      (err) => err !== undefined && err !== ""
    );
  }, [
    isAuthenticated,
    currentUserId,
    existingProject,
    title,
    description,
    content,
    postTags,
    currentDisplayImages,
    formErrors.postImages,
  ]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetUpdateMutation();
    setFormFeedback(null);

    if (!validateForm()) return;
    if (!existingProject) {
      /* ... original error handling ... */ return;
    }

    const titleChanged = title.trim() !== (existingProject.title || "").trim();
    const descriptionChanged =
      description.trim() !== (existingProject.description || "").trim();
    const contentChanged =
      normalizeHTMLContent(content) !==
      normalizeHTMLContent(existingProject.content || "");
    const tagsChanged = !arraysAreEqual(
      postTags || [],
      existingProject.postTags || []
    );

    // --- MODIFIED: Image changed detection ---
    const retainedExistingImageUrlsFromDisplay = currentDisplayImages
      .filter((img) => img.type === "existing")
      .map((img) => img.url);

    const imageSetChanged =
      newlyAddedFiles.length > 0 ||
      !arraysAreEqual(initialImageUrls, retainedExistingImageUrlsFromDisplay);
    // --- END MODIFICATION ---

    if (
      !titleChanged &&
      !descriptionChanged &&
      !contentChanged &&
      !tagsChanged &&
      !imageSetChanged
    ) {
      setFormFeedback({ type: "info", text: "No changes were made." });
      return;
    }

    const formData = new FormData();
    if (titleChanged) formData.append("title", title.trim());
    if (descriptionChanged) formData.append("description", description.trim());
    if (contentChanged) formData.append("content", content);
    if (tagsChanged) formData.append("postTags", JSON.stringify(postTags));

    // --- MODIFIED: Append image data for backend ---
    // IMPORTANT: This structure depends on how your backend 'updatePost' is designed
    // to handle partial updates and lists of new/retained images.
    // The current `updatePost` in `postSlice.ts` and backend likely only handles a single `postImage`.
    // This will need to be updated on the backend and in postSlice.ts to work correctly.
    if (imageSetChanged) {
      newlyAddedFiles.forEach((file) => {
        formData.append("newPostImages", file, file.name); // Field for new image files
      });
      // Send the list of URLs for existing images that should be kept.
      // The backend can use this to determine which old images were removed.
      formData.append(
        "retainedImageUrls",
        JSON.stringify(retainedExistingImageUrlsFromDisplay)
      );
      console.log(
        "FormData for images: new files count:",
        newlyAddedFiles.length,
        "retained URLs:",
        retainedExistingImageUrlsFromDisplay
      );
    }
    // --- END MODIFICATION ---

    try {
      console.log("Submitting FormData for update..."); // Log before sending
      // for (let [key, value] of formData.entries()) { // Optional: log FormData contents
      //   console.log(`${key}:`, value);
      // }
      await updatePostTrigger({ postId: projectId, formData }).unwrap();
      // Success message handled by useEffect watching isUpdateSuccess
      // On success, refetch() is called, which triggers useEffect[existingProject],
      // this will reset currentDisplayImages based on new server data and clear newlyAddedFiles.
    } catch (err: any) {
      // ... (original error handling) ...
      let apiErrorMessage = "Update failed.";
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

  // --- Loading and Initial Error/Auth States (Unchanged from your original) ---
  if (!projectId || (isFetchingLoading && !existingProject)) {
    return (
      <div className="flex flex-col gap-4 justify-center items-center min-h-screen bg-zinc-950 text-zinc-100">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <p className="text-lg">Loading Project Data...</p>
      </div>
    );
  }
  if (
    isFetchingError ||
    (!existingProject &&
      !isActuallyFetching &&
      isFetchingSuccess === false &&
      projectId)
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-center p-6 text-zinc-100">
        <FaExclamationTriangle className="text-5xl text-red-500 mb-4" />{" "}
        <h2 className="text-2xl font-semibold text-red-400 mb-2">
          Error Loading Project
        </h2>
        <p className="text-zinc-400 mb-6">Could not load data.</p>
        {fetchingError && (
          <p className="text-xs text-zinc-500 mb-6">
            Details:{" "}
            {(fetchingError as any)?.data?.message ||
              (fetchingError as any)?.error ||
              "Unknown error"}
          </p>
        )}
        <button onClick={() => refetch()} className="btn btn-primary mb-4">
          Reload
        </button>
        <Link
          href="/projects"
          className="btn btn-outline border-zinc-600 text-zinc-300 hover:bg-zinc-700"
        >
          Back to Projects
        </Link>
      </div>
    );
  }
  if (existingProject && !isFormDataReady && !isFetchingError) {
    return (
      <div className="flex flex-col gap-4 justify-center items-center min-h-screen bg-zinc-950 text-zinc-100">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <p className="text-lg">Preparing Form...</p>
      </div>
    );
  }
  if (existingProject && formErrors.auth && !isUpdateLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-center p-6 text-zinc-100">
        <FaExclamationTriangle className="text-5xl text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold text-red-400 mb-2">
          {" "}
          Authorization Error{" "}
        </h2>
        <p className="text-zinc-400 mb-6">{formErrors.auth}</p>
        <Link
          href={`/projects/${projectId}`}
          className="btn btn-outline border-zinc-600 text-zinc-300 hover:bg-zinc-700"
        >
          Back to Project
        </Link>
      </div>
    );
  }
  if (
    !existingProject &&
    projectId &&
    !isFetchingLoading &&
    !isActuallyFetching
  ) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-zinc-950 text-zinc-400 p-6 text-center">
        Project data unavailable.
        <button
          onClick={() => refetch()}
          className="text-blue-400 underline ml-2"
        >
          Reload
        </button>
        <Link href="/projects" className="text-blue-400 underline ml-2">
          To projects
        </Link>
      </div>
    );
  }
  if (!existingProject || !isFormDataReady) {
    return (
      <div className="flex flex-col gap-4 justify-center items-center min-h-screen bg-zinc-950 text-zinc-100">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <p className="text-lg">Loading or Preparing Form...</p>
      </div>
    );
  }

  const reactHashTagsKey = `tags-edit-${projectId}-${postTags.join(",")}`;

  return (
    <div className="p-4 md:p-8 bg-zinc-950 text-zinc-100 min-h-screen">
      <Link
        href={`/projects/${projectId}`}
        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 group text-sm"
      >
        <FaArrowLeft className="transform transition-transform group-hover:-translate-x-1" />{" "}
        Cancel Edit & Back to Project
      </Link>
      <h2 className="text-center text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
        Edit Project:{" "}
        <span className="text-green-300 line-clamp-1">
          {" "}
          {existingProject.title}{" "}
        </span>
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

        {/* Title, Description, Tags Inputs Unchanged from your original EditProjectPage */}
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
            <p className="mt-1 text-xs text-red-400">{formErrors.title}</p>
          )}
        </div>
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
            <p className="mt-1 text-xs text-red-400">
              {formErrors.description}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-zinc-300">
            Technology Tags <span className="text-red-500">*</span> (Max 10)
          </label>
          {isFormDataReady ? (
            <ReactHashTags
              onChange={handleTagsChange}
              initialTags={postTags}
              key={reactHashTagsKey}
            />
          ) : (
            <div className="p-2 text-sm text-zinc-400 rounded-md bg-zinc-800 border border-zinc-700">
              Initializing tags...
            </div>
          )}
          {formErrors.postTags && (
            <p id="tags-error" className="mt-1 text-xs text-red-400">
              {formErrors.postTags}
            </p>
          )}
        </div>

        {/* --- MODIFIED: Image Handling Section --- */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-zinc-300">
            Project Images ({currentDisplayImages.length}/{MAX_IMAGES_COUNT}{" "}
            images) <span className="text-red-500">*</span>
          </label>

          {currentDisplayImages.length > 0 && (
            <div className="mt-3 mb-3 p-3 border border-dashed border-zinc-700 rounded-lg bg-zinc-800/40">
              <p className="text-xs text-zinc-400 mb-3">
                Current Images (click লাল icon to remove):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {currentDisplayImages.map((image, index) => (
                  <div
                    key={
                      image.type === "existing"
                        ? image.url
                        : image.file?.name || `new-${index}`
                    }
                    className="relative group aspect-square bg-zinc-700 rounded-md overflow-hidden h-24" // Fixed height for previews
                  >
                    <NextImage
                      src={image.url}
                      alt={`Project image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 150px"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-500 text-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 z-10 leading-none flex items-center justify-center w-5 h-5"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <FaTimesCircle size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentDisplayImages.length < MAX_IMAGES_COUNT && (
            <div className="mt-2 p-4 border border-zinc-700 rounded-lg bg-zinc-800/40">
              <p className="text-sm text-zinc-300 mb-2">
                Add New Image ({currentDisplayImages.length + 1} of{" "}
                {MAX_IMAGES_COUNT})
              </p>
              <ImageComponent
                key={imageComponentKey}
                onFileSelect={handleImageAddedFromComponent}
              />
            </div>
          )}
          {currentDisplayImages.length >= MAX_IMAGES_COUNT &&
            !formErrors.postImages && (
              <p className="mt-2 text-sm text-green-400 p-4 border border-green-700 rounded-lg bg-green-900/30">
                Maximum {MAX_IMAGES_COUNT} images. Remove an image to add a new
                one.
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
            <p className="mt-1 text-xs text-red-400">{formErrors.content}</p>
          )}
        </div>

        {/* Submit Button and Form Feedback Area Unchanged from your original EditProjectPage */}
        <div className="mt-6">
          <button
            type="submit"
            className="btn btn-lg w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isUpdateLoading || !!formErrors.auth}
          >
            {isUpdateLoading ? (
              <>
                <FaSpinner className="animate-spin" /> Updating Project...
              </>
            ) : (
              "Save Changes"
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
              .filter(([, errorMessage]) => !!errorMessage)
              .map(([fieldKey, errorMessage]) => ({
                id: fieldKey,
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
