// src/context/ThemeProvider.tsx (or your preferred path)
"use client";

import React, { useEffect, useState, ReactNode, useCallback } from "react";
import { ThemeContext, ThemeName, DEFAULT_APP_THEME } from "./ThemeContext";
// No Redux interaction here for setting the theme initially from user settings,
// as per the focus on a simpler context for now, matching the example structure.

const LOCAL_STORAGE_THEME_KEY = "app-custom-theme"; // Use a distinct key from any DaisyUI key

// Define the valid themes for type checking and iteration
const VALID_THEMES: ThemeName[] = ["light", "dark", "cyberpunk"];

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    // Get initial theme from localStorage or default
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem(
        LOCAL_STORAGE_THEME_KEY
      ) as ThemeName | null;
      if (storedTheme && VALID_THEMES.includes(storedTheme)) {
        return storedTheme;
      }
    }
    return DEFAULT_APP_THEME; // Use the default defined in ThemeContext
  });

  // Effect to apply the theme to the <html> tag and save to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
      console.log(
        `[ThemeProvider] Applied data-theme: ${theme} to html and localStorage.`
      );
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeName) => {
    if (VALID_THEMES.includes(newTheme)) {
      setThemeState(newTheme);
    } else {
      console.warn(
        `[ThemeProvider] Attempted to set invalid theme: ${newTheme}. Reverting to default.`
      );
      setThemeState(DEFAULT_APP_THEME); // Revert to default if invalid theme is passed
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
