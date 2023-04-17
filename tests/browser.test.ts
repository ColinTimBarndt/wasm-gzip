import {test} from '@playwright/test';
import * as fs from "node:fs";
import {fileURLToPath} from "node:url";

const importmap = JSON.stringify({
    imports: {
        "chai": "/node_modules/chai/chai.js",
        "wasm-gzip": "/dist/wasm_gzip.js",
    }
});

test.beforeEach(async ({page}) => {
    await page.goto("/tests/index.html");
    await page.addScriptTag({
        type: "importmap",
        content: importmap,
    });
    await page.evaluate(() => {
        window.addEventListener("error", ev => {
            console.error("ERROR", ev.error);
        });
    });
});

const testsDir = fileURLToPath(new URL("./browser", import.meta.url));

fs.readdirSync(testsDir).forEach(file => {
    const match = /^([^.]+)\.js$/.exec(file);
    if (!match) return;
    const [, name] = match;
    test(name, async ({page}) => {
        page.on("console", async msg => {
            const args = msg.args();
            if (args.length === 2 && await args[0].jsonValue() === "ERROR") {
                const msg = await args[1].evaluate((it: Error) =>
                    it.stack || it.message || ""
                );
                throw new Error(msg);
            }
            const text = msg.text();
            if (text !== "DONE") {
                console.log(msg.text());
            }
        });
        await page.addScriptTag({
            type: "module",
            url: `./browser/${file}`,
        });
        await page.waitForEvent("console", {predicate: msg => msg.text() === "DONE"});
    });
});