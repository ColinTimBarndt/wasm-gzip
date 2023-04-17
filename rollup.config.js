import {defineConfig} from "rollup";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

export default defineConfig([
    {
        input: "src/ts/wasm_gzip.ts",
        output: {
            dir: "dist",
            format: "esm",
            sourcemap: true,
        },
        plugins: [
            typescript(),
            terser(),
        ],
    },
    //{
    //    input: "src/ts/wasm_gzip.ts",
    //    output: {
    //        dir: "dist",
    //        format: "esm",
    //        plugins: [
    //            dts(),
    //        ]
    //    }
    //}
]);