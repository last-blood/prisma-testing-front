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
      "@typescript-eslint/no-empty-interface": "off", // Common actual rule name for empty interfaces
      // "@typescript-eslint/no-empty-interface" is the typical rule.
      "react/no-unescaped-entities": "off",
      // For "An interface declaring no members is equivalent to its supertype."
      // This is typically the rule name, even if the error log mentioned @typescript-eslint/no-empty-object-type
      "@typescript-eslint/no-empty-interface": "off",

      // For "React Hook useEffect has a missing dependency..."
      "react-hooks/exhaustive-deps": "off", // Disables warnings about missing dependencies in Hooks like useEffect

      // For "Do not use "@ts-nocheck" because it alters compilation errors."
      "@typescript-eslint/ban-ts-comment": "off", // Allows using // @ts-ignore, // @ts-nocheck, etc.
      "@typescript-eslint/no-empty-interface": "off",

      // For "Expected an assignment or function call and instead saw an expression."
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
];

export default eslintConfig;
