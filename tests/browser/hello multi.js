import init, { compress, decompress } from "wasm-gzip";
import "chai";
const { assert } = chai;

await init();

const compressed = new Uint8Array(
    (function* () {
        yield* compress("Hello, ");
        yield* compress("World!");
    })(),
);
assert.deepEqual(
    new Uint8Array(compressed),
    new Uint8Array([
        31, 139, 8, 0, 0, 0, 0, 0, 0, 3, 5, 192, 49, 13, 0, 0, 0, 194, 48, 43,
        8, 64, 8, 70, 248, 150, 224, 255, 163, 41, 204, 58, 5, 111, 87, 222, 7,
        0, 0, 0, 31, 139, 8, 0, 0, 0, 0, 0, 0, 3, 5, 192, 49, 9, 0, 0, 0, 2,
        193, 44, 166, 178, 128, 163, 32, 216, 127, 248, 243, 222, 8, 222, 157,
        40, 118, 6, 0, 0, 0,
    ]),
);

const combinedRaw = decompress(compressed, { multi: true });

const combined = new TextDecoder().decode(combinedRaw);
assert.equal(combined, "Hello, World!");

console.log("DONE");
