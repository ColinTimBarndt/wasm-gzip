# Wasm-Gzip

**Note:** Wasm-Gzip was primarily built for the web and might not work with NodeJS.

This small library allows compression and decompression with Gzip
using the [libflate] Rust library.
The binary WASM is lightweight (~103 kB WASM + ~2.8 kB JS)
which may be useful for compressing network traffic or for web applications
that let a user save or load compressed files.

The source code can be found on [GitHub](https://github.com/ColinTimBarndt/wasm-gzip).

[libflate]: https://crates.io/crates/libflate

## Examples

```ts
import init, {compress, decompress} from "wasm-gzip";

await init();
const compressed = compress("Hello, World!");
// [31, 139, 8, 0, 0, 0, 0, 0, 0, 3, 5, 192, 49, 13, 0, 0, 8, 3, 65, 43,
// 176, 35, 4, 7, 24, 128, 237, 147, 38, 248, 31, 122, 125, 160, 138, 209,
// 179, 105, 208, 195, 74, 236, 13, 0, 0, 0]
const originalRaw = decompress(compressed);
// [72, 101, 108, 108, 111, 44, 32, 87, 111, 114, 108, 100, 33]
const original = new TextDecoder().decode(originalRaw);
// "Hello, World!"
```

```ts
import init, {compress, decompress} from "wasm-gzip";

await init();
await init(); // can be called multiple times
// The array is *copied* as bytes into WASM memory
const compressed = compress([1, 2, 3, 4]);
// [31, 139, 8, 0, 0, 0, 0, 0, 0, 3, …]
```

```ts
import init, {compress, decompress, freeBuffer} from "wasm-gzip";

await init();
const compressed = compress(10_000, data => {
    // *zero-copy* writing into WASM-memory
    // See https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
    crypto.getRandomValues(data);
});
// Optionally free up memory
freeBuffer();
// `compressed` is no longer safe to access from this point on
```

## Build Requirements

- [Wasm-Pack]
- [Wasm-Snip]
- NodeJS, I recommend [Node Version Manager]

Before building, run `npm install` to install all NodeJS dependencies

[Wasm-Pack]: https://rustwasm.github.io/wasm-pack/installer/
[Wasm-Snip]: https://github.com/rustwasm/wasm-snip
[Node Version Manager]: https://github.com/nvm-sh/nvm
