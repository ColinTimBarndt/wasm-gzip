import init, {compress, decompress} from "wasm-gzip";
import "chai";
const {assert} = chai;

await init();

const TEXT = "äöüß🍄↔👶🏽👨‍👩‍👦‍👦斤➟\uffff";
const compressed = compress(TEXT);

const original = new TextDecoder().decode(decompress(compressed));
assert.equal(original, TEXT);

console.log("DONE");