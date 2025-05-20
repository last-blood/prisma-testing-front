// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc"; // Utility to use older eslintrc configs in flat config

// These lines are to get the __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize FlatCompat
const compat = new FlatCompat({
  baseDirectory: __dirname, // Specifies the directory to resolve relative paths from for extended configs
});

// Define your ESLint configuration array
const eslintConfig = [
  // Spread the configurations you are extending.
  // "next/core-web-vitals" provides base Next.js linting rules.
  // The "next/typescript" part within compat.extends likely adds TypeScript-specific rules via @typescript-eslint.
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Add a new configuration object here to customize/override rules
  {
    rules: {
      // Rules set to "off" to ignore them for your test project:

      // For "Unexpected any. Specify a different type."
      "@typescript-eslint/no-explicit-any": "off",

      // For "'variableName' is defined but never used."
      "@typescript-eslint/no-unused-vars": "off",

      // For "'variableName' is never reassigned. Use 'const' instead."
      "prefer-const": "off",

      // For "Using <img> could result in slower LCP..."
      "@next/next/no-img-element": "off",

      // If other specific TypeScript-ESLint rules (often part of "plugin:@typescript-eslint/recommended"
      // which next/typescript might include) are causing build failures, you can add them here too.
      // For example:
      // "@typescript-eslint/explicit-module-boundary-types": "off",
      // "@typescript-eslint/no-empty-function": "off",
    },
  },
];

export default eslintConfig;
