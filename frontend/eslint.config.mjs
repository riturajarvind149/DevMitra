import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Downgrade to warn — widespread across API layer; type coverage is tracked separately
      "@typescript-eslint/no-explicit-any": "warn",
      // Stylistic only — apostrophes in JSX text are safe; tracked separately
      "react/no-unescaped-entities": "warn",
      // Hydration-init pattern (setState in effect to sync from fetched data) — valid and intentional
      "react-hooks/set-state-in-effect": "warn",
      // React Compiler memoization hints — not errors, informational only
      "react-hooks/preserve-manual-memoization": "warn",
      // RAF-based animation pattern using forward reference — valid JS closure pattern
      "react-hooks/immutability": "warn",
    },
  },
]);

export default eslintConfig;
