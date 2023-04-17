import init, {compress, decompress, freeBuffer} from "wasm-gzip";
import "chai";
const {assert} = chai;

await init();
let dataForComparison;
const compressed = compress(10_000, data => {
    // *zero-copy* writing into WASM-memory
    // See https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
    crypto.getRandomValues(data);
    dataForComparison = new Uint8Array(data); // copy for verification
});
const original = decompress(compressed);
assert.deepEqual(original, dataForComparison);
// Optionally free up memory
freeBuffer();

console.log("DONE");