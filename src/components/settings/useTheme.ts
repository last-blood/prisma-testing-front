// src/context/useTheme.ts (or your preferred path)
"use client";

import { useContext } from "react";
import { ThemeContext, ThemeContextType } from "./ThemeContext"; // Ensure ThemeContextType is exported

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
