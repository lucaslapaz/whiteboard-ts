import { defineConfig, devices } from "@playwright/test";

const PORT = 5174;

export default defineConfig({
    testDir: "./tests/e2e",
    fullyParallel: true,
    reporter: process.env.CI ? "github" : "list",
    use: {
        baseURL: `http://127.0.0.1:${PORT}`,
        trace: "on-first-retry",
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    // Sobe o servidor de desenvolvimento sozinho: os testes leem o estado do
    // quadro pelo hook que so existe em modo dev.
    webServer: {
        command: `npx vite --host 127.0.0.1 --port ${PORT} --strictPort`,
        url: `http://127.0.0.1:${PORT}`,
        reuseExistingServer: !process.env.CI,
        stdout: "ignore",
    },
});
