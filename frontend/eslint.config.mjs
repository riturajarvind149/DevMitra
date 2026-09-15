import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
  ]),
  {
    rules: {
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
