import init, {compress, decompress} from "wasm-gzip";
import "chai";
const {assert} = chai;

await init();
await init(); // can be called multiple times

const compressed = compress([1, 2, 3, 4]);

const original = decompress(compressed);
assert.deepEqual(original, new Uint8Array(
    [1, 2, 3, 4]
));

console.log("DONE");