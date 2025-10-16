import {defineConfig, devices} from "@playwright/test"

export default defineConfig({
    testDir: "./tests",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [["list"], ["html", {open: "never"}]],
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:4321",
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
        command: "npm run dev",
        url: "http://127.0.0.1:4321",
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
})
