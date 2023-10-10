import init, {decompress, DecompressionError} from "wasm-gzip";
import "chai";
const {assert} = chai;

await init();

const compressed = new Uint8Array([42, 0, 7]);
assert.throws(() => decompress(compressed), DecompressionError);

console.log("DONE");