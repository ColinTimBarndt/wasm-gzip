# Wasm-Gzip

Wasm-Gzip was built for the web and does not work with NodeJS.

This small library allows compression and decompression with Gzip
using the [libflate](https://crates.io/crates/libflate) Rust library.
It also comes with functions to convert a string into UTF-8 bytes and
back. The binary WASM is very lightweight (~125 KiB) which may be useful
to compress network traffic or for web applications that let a user save
and load files.

You can see the Rust source code on [GitHub](https://github.com/ColinTimBarndt/wasm-gzip).

## Examples

### Compress binary data

In this example, binary data in a Uint8Array is compressed and decompressed.

```js
import init, { compressGzip, decompressGzip } from "./wasm_gzip.js";

let inputData = new Uint8Array([
	0x0a,
	0x83,
	0xd8,
	0x4a,
	0x84,
	0x0d,
	0x44,
	0x02,
	0xbb,
	0x1f,
	0xcd,
	0x33,
	0x24,
	0x8e,
	0x49,
	0x99,
]);

// Load the WASM
init().then(() => {
	let compressed = compressGzip(inputData);
	console.log(compressed);

	// If decompressing fails, undefined is returned.
	let decompressed = decompressGzip(compressed);
	console.log(decompressed, inputData);
});
```

### Compress text

```js
import init, { compressStringGzip, decompressStringGzip } from "./wasm_gzip.js";

let text = `\
Exercitationem placeat consequatur cumque sint qui et tenetur. Quaerat vel ratione
vitae a perspiciatis consectetur numquam. Dicta illo ducimus explicabo molestiae
assumenda. Quisquam reiciendis aspernatur in ullam. Quia magnam in itaque quaerat
quisquam ipsa voluptatem.
`.repeat(10);

// Load the WASM
init().then(() => {
	let compressed = compressStringGzip(text);
	console.log(text.length, compressed.length);

	// If decompressing fails, undefined is returned.
	let reverse = decompressStringGzip(compressed);
	console.log(reverse == text);
});
```
