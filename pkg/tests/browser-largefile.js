import init, { compressJsonGzip, decompressJsonGzip } from "../wasm_gzip.js";

init().then(() => {
	fetch("./test-data.json")
		.then((response) => response.text())
		.then((textInput) => {
			console.log(`Raw: ${textInput.length} bytes`);
			let jsonInput = JSON.parse(textInput);
			let compressed = compressJsonGzip(jsonInput);
			console.log(`Compressed: ${compressed.length} bytes`);
			let jsonOutput = decompressJsonGzip(compressed);
			console.log(JSON.stringify(jsonInput) == JSON.stringify(jsonOutput));
		});
});
