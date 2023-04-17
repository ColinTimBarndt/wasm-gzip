import init, {compress, decompress} from "wasm-gzip";
import "chai";
const {assert} = chai;

await init();

const compressed = compress("Hello, World!");
assert.deepEqual(compressed, new Uint8Array([
    31, 139, 8, 0, 0, 0, 0, 0, 0, 3, 5, 192, 49, 13, 0, 0, 8, 3, 65, 43,
    176, 35, 4, 7, 24, 128, 237, 147, 38, 248, 31, 122, 125, 160, 138, 209,
    179, 105, 208, 195, 74, 236, 13, 0, 0, 0
]));

const originalRaw = decompress(compressed);
assert.deepEqual(originalRaw, new Uint8Array(
    [72, 101, 108, 108, 111, 44, 32, 87, 111, 114, 108, 100, 33]
));

const original = new TextDecoder().decode(originalRaw);
assert.equal(original, "Hello, World!");

console.log("DONE");