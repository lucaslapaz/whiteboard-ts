import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        // Os testes de ponta a ponta ficam em tests/e2e e rodam pelo Playwright.
        include: ["tests/unit/**/*.test.ts"],
        environment: "jsdom",
    },
});
