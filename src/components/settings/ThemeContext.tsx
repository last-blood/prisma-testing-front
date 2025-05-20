// src/context/ThemeContext.tsx (or your preferred path)
"use client";

import { createContext } from "react";

// Define your specific theme names
export type ThemeName = "light" | "dark" | "cyberpunk";

export interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  // isLoadingTheme could be added if ThemeProvider handles async initial theme loading
  // For this version, we'll keep it simple as per the example.
}

// Default theme for the context before ThemeProvider initializes it
export const DEFAULT_APP_THEME: ThemeName = "dark"; // Your application's default

export const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_APP_THEME,
  setTheme: (theme) => {
    // This is a placeholder and should be overridden by the Provider.
    // It's good practice to warn if called without a provider.
    console.warn(
      "setTheme called on default ThemeContext. Did you wrap your app in ThemeProvider?",
      theme
    );
  },
});
