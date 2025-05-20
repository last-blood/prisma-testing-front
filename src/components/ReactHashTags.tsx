// src/components/ReactHashTags.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import techStack from "@/data/techStack"; // Adjust path if needed

// --- Constants ---
const SUGGESTION_LIMIT = 10;

const impossibleCombinations: string[][] = [
  ["React", "Angular"],
  ["React", "Vue"],
  ["Angular", "Vue"],
  ["MySQL", "MongoDB"],
  ["Django", "Express"],
];

// --- Props Interface ---
interface ReactHashTagsProps {
  initialTags?: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number; // Optional: to enforce max tags from parent
}

// --- Component ---
const ReactHashTags: React.FC<ReactHashTagsProps> = ({
  initialTags = [],
  onChange,
  maxTags = 10, // Default max tags
}) => {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState<string>("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [error, setError] = useState<string>("");

  const containerRef = useRef<HTMLDivElement>(null);

  // --- Effect to update internal tags state when initialTags prop changes ---
  useEffect(() => {
    // Only update if initialTags is truly different to avoid potential loops
    // This simple check works for array of primitives if order doesn't matter for "sameness"
    // For more complex scenarios, a deep comparison might be needed.
    if (JSON.stringify(tags) !== JSON.stringify(initialTags)) {
      setTags(initialTags);
    }
  }, [initialTags]); // Rerun when initialTags prop changes

  const checkImpossibleCombinations = useCallback(
    (currentTags: string[]): string => {
      const currentTagsSet = new Set(
        currentTags.map((tag) => tag.toLowerCase())
      );
      for (const combo of impossibleCombinations) {
        const lowerCombo = combo.map((tech) => tech.toLowerCase());
        if (lowerCombo.every((tech) => currentTagsSet.has(tech))) {
          const displayCombo = combo.join(" and ");
          return `Combining ${displayCombo} is not recommended. Please choose one.`;
        }
      }
      return "";
    },
    []
  );

  useEffect(() => {
    onChange(tags); // Report changes to parent
  }, [tags, onChange]);

  const handleRemoveTag = useCallback(
    (indexToRemove: number) => {
      setTags((prevTags) => {
        const newTags = prevTags.filter((_, i) => i !== indexToRemove);
        setError(checkImpossibleCombinations(newTags));
        return newTags;
      });
    },
    [checkImpossibleCombinations]
  );

  const handleAddTag = useCallback(
    (tagToAdd: string) => {
      const trimmedTag = tagToAdd.trim();
      if (!trimmedTag) return;

      if (tags.length >= maxTags) {
        setError(`Maximum of ${maxTags} tags allowed.`);
        setInputValue("");
        setFilteredSuggestions([]);
        setHighlightedIndex(-1);
        return;
      }

      const normalizedTag = trimmedTag.toLowerCase();
      if (tags.some((t) => t.toLowerCase() === normalizedTag)) {
        setInputValue("");
        setFilteredSuggestions([]);
        setHighlightedIndex(-1);
        return;
      }

      const officialTag =
        techStack.find((t) => t.toLowerCase() === normalizedTag) || trimmedTag;
      const potentialNewTags = [...tags, officialTag];
      const errorMessage = checkImpossibleCombinations(potentialNewTags);

      if (errorMessage) {
        setError(errorMessage);
      } else {
        setTags(potentialNewTags);
        setError("");
      }

      setInputValue("");
      setFilteredSuggestions([]);
      setHighlightedIndex(-1);
    },
    [tags, checkImpossibleCombinations, maxTags]
  );

  const handleClearAll = useCallback(() => {
    setTags([]);
    setError("");
    setInputValue("");
    setFilteredSuggestions([]);
    setHighlightedIndex(-1);
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    setHighlightedIndex(-1);
    setError(""); // Clear general error on new input

    if (value.trim()) {
      const lowerValue = value.toLowerCase();
      const matches = techStack.filter(
        (tech) =>
          tech.toLowerCase().startsWith(lowerValue) &&
          !tags.some((t) => t.toLowerCase() === tech.toLowerCase())
      );
      setFilteredSuggestions(matches.slice(0, SUGGESTION_LIMIT));
    } else {
      setFilteredSuggestions([]);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const hasSuggestions = filteredSuggestions.length > 0;
    switch (event.key) {
      case "ArrowDown":
        if (hasSuggestions) {
          event.preventDefault();
          setHighlightedIndex(
            (prev) => (prev + 1) % filteredSuggestions.length
          );
        }
        break;
      case "ArrowUp":
        if (hasSuggestions) {
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev <= 0 ? filteredSuggestions.length - 1 : prev - 1
          );
        }
        break;
      case "Enter":
        event.preventDefault();
        if (hasSuggestions && highlightedIndex > -1) {
          handleAddTag(filteredSuggestions[highlightedIndex]);
        } else if (!hasSuggestions && inputValue.trim()) {
          handleAddTag(inputValue);
        }
        break;
      case "Escape":
        setFilteredSuggestions([]);
        setHighlightedIndex(-1);
        break;
      case "Tab":
        setFilteredSuggestions([]);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleAddTag(suggestion);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setFilteredSuggestions([]);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section
      ref={containerRef}
      className="p-4 md:p-6 bg-zinc-800/30 text-zinc-200 rounded-lg shadow-lg space-y-4 border border-zinc-700"
    >
      <h3 className="text-base font-medium text-zinc-100 mb-1 sr-only">
        Tech Stack Selector
      </h3>
      <p className="text-xs text-zinc-400 mb-3 sr-only">
        Add technologies. Some combinations might be flagged.
      </p>

      <div className="relative">
        <label htmlFor="tech-input" className="sr-only">
          Type Tech stack tags
        </label>
        <div className="flex items-stretch gap-2">
          <input
            id="tech-input"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g., React, Python..."
            className="flex-grow input input-sm sm:input-md bg-zinc-700/50 border border-zinc-600 text-zinc-100 placeholder-zinc-500 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150"
            autoComplete="off"
            role="combobox"
            aria-expanded={filteredSuggestions.length > 0}
            aria-controls="tech-suggestions-list"
            aria-activedescendant={
              highlightedIndex > -1
                ? `suggestion-${highlightedIndex}`
                : undefined
            }
          />
          <button
            onClick={() => handleAddTag(inputValue)}
            type="button"
            disabled={!inputValue.trim() || tags.length >= maxTags}
            className="btn btn-sm sm:btn-md bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-medium px-4 rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 shrink-0"
          >
            Add
          </button>
        </div>

        {filteredSuggestions.length > 0 && (
          <ul
            id="tech-suggestions-list"
            role="listbox"
            className="absolute mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-md shadow-lg max-h-60 overflow-y-auto z-20 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                id={`suggestion-${index}`}
                role="option"
                aria-selected={index === highlightedIndex}
                className={`px-3 py-2 text-sm text-zinc-200 cursor-pointer transition-colors duration-100 ease-in-out ${
                  index === highlightedIndex
                    ? "bg-blue-700 text-white"
                    : "hover:bg-zinc-700"
                }`}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseDown={(e) => e.preventDefault()}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <div
          className="mt-2 p-2.5 bg-red-900/60 border border-red-700/70 text-red-300 text-xs rounded-md transition-opacity duration-200"
          role="alert"
          aria-live="polite"
        >
          <span className="font-medium">Warning:</span> {error}
        </div>
      )}

      {tags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-700/50">
          <div className="flex flex-wrap gap-2 items-center min-h-[28px]">
            {tags.map((tag, index) => (
              <div
                key={`${tag}-${index}`} // More robust key
                className="flex items-center bg-zinc-700/80 rounded-full px-3 py-1 text-sm font-medium text-zinc-100 shadow-sm"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(index)}
                  aria-label={`Remove tag ${tag}`}
                  className="ml-1.5 text-zinc-400 hover:text-red-400 focus:outline-none focus:text-red-400 transition-colors duration-150 ease-in-out flex items-center justify-center w-4 h-4 rounded-full hover:bg-zinc-600 focus:bg-zinc-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleClearAll}
              type="button"
              className="btn btn-xs border border-zinc-600 hover:border-red-500 hover:text-red-400 text-zinc-400 font-medium px-3 py-1 rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-1 focus:ring-offset-zinc-900"
            >
              Clear All Tags
            </button>
          </div>
        </div>
      )}
      {tags.length === 0 && !error && (
        <p className="text-zinc-500 text-xs italic mt-2">
          No tech stack selected yet.
        </p>
      )}
    </section>
  );
};

export default ReactHashTags;
