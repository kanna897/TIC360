import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The application contains several data-import boundaries whose payloads are
    // intentionally dynamic. TypeScript still checks their downstream usage.
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // One-off CommonJS data-extraction utilities are not part of the Next app.
    "scratch/**",
    "scripts/**",
    "extract_gids.js",
    "fetch_gids.js",
    "parse_excel.js",
  ]),
]);

export default eslintConfig;
