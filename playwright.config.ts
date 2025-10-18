import {defineConfig, devices} from "@playwright/test"
import dotenv from "dotenv"

// Load test environment variables
dotenv.config({path: ".env.test"})

export default defineConfig({
    testDir: "./e2e/tests",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [["list"], ["html", {open: "never"}]],
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
        viewport: {width: 1280, height: 720},
    },
    projects: [
        {
            name: "chromium",
            use: {...devices["Desktop Chrome"]},
        },
    ],
    webServer: {
        command: "npm run dev:e2e",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
})
