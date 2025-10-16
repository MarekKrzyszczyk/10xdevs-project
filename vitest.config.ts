import {defineConfig} from "vitest/config"
import react from "@vitejs/plugin-react"
import {fileURLToPath} from "node:url"

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        setupFiles: ["./vitest.setup.ts"],
        globals: true,
        css: true,
        coverage: {
            reporter: ["text", "lcov"],
        },
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
    },
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
})
