import {defineConfig, devices, PlaywrightTestConfig} from "@playwright/test";

export default {
    testDir: "tests",
    projects: [
        {
            name: "chromium",
            ...devices["Desktop Chrome"],
        }
    ],
    webServer: {
        command: "npx http-server .",
        reuseExistingServer: true,
        port: 8080,
    }
} satisfies PlaywrightTestConfig;