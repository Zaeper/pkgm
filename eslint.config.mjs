import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: ["dist/**", "node_modules/**", "coverage/**", "docs/**"]
    },
    {
        files: ["src/**/*.ts"],
        rules: {
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
            "no-console": "off"
        }
    },
    {
        files: ["src/test/**/*.ts"],
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-require-imports": "off"
        }
    }
);
