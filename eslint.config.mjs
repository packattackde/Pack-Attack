import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "check-user.js",
    "create-admin-now.js",
    "verify-admin.js",
    "tmp-*.js",
    "ecosystem.config.js",
    "scripts/**/*.js",
  ]),
]);

export default eslintConfig;

