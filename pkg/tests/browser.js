import init, {
	compressGzip,
	compressStringGzip,
	decompressGzip,
	decompressStringGzip,
} from "../wasm_gzip.js";

Object.defineProperties(window, {
	compressGzip: { value: compressGzip },
	compressStringGzip: { value: compressStringGzip },
	decompressGzip: { value: decompressGzip },
	decompressStringGzip: { value: decompressStringGzip },
});

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

// Some valid UTF-8 code points for testing.
const UTF_DICT = [
	// ASCII
	...new Array(0x80).map((_, i) => i),
	// Arabic
	...new Array(0x100).map((_, i) => 0x600 + i),
	// Emoji
	...new Array(0x50).map((_, i) => 0x1f600 + i),
];
const LOREM_IPSUM = `\
Modi est dolor saepe nobis. Blanditiis mollitia ut et corporis voluptatem. Numquam repudiandae quas reiciendis sit vel sed est. Explicabo rerum minima et et aut magni. Voluptatum assumenda doloribus sint.

Libero voluptate ut sit sit. Tempora possimus accusamus ut numquam quo in fugit deserunt. Voluptas nihil dolores excepturi.

Qui velit et dolores. Nemo et corrupti voluptas culpa omnis quo ducimus aut. Molestiae distinctio ut ullam accusamus.

In eum saepe atque doloribus qui fugit ut quaerat. Veritatis sint praesentium natus enim voluptate recusandae. Ratione nemo ipsum deserunt. Eligendi velit eaque aut at non ut placeat. Qui nemo quo quidem nisi quibusdam ut. Dolorum eveniet odit quisquam.

Quaerat officia rem voluptatibus corrupti vel aut corporis. Dolor earum hic quibusdam et omnis totam. Voluptas dolores consequatur soluta aut tenetur. Odit quidem consequatur provident.

Sed eum cum nam dicta dolor. Velit consectetur et sapiente animi quo est adipisci sed. Repudiandae et hic neque sit nemo accusantium quas. Ipsum vero nesciunt assumenda.

Commodi sint dolores molestias sed repudiandae repellat qui. Quo labore minus nulla. Reiciendis reiciendis vel fuga ullam placeat. Ea cumque distinctio ut soluta ipsum cumque quia ea.

Magnam est est autem laborum non. Similique cupiditate fuga eveniet placeat voluptatem odio. Impedit saepe consequatur blanditiis ad velit qui culpa asperiores. Exercitationem qui impedit dolores ut dolorem voluptatem culpa et. Laudantium aut quibusdam iusto. Cumque exercitationem debitis exercitationem molestias vel ex expedita eos.

Qui ut cupiditate exercitationem quia. Enim aut repellat ad. Possimus et numquam quia.

Atque iste aperiam adipisci quia eos. Perferendis sunt dignissimos omnis repellat commodi sit qui quia. Magnam beatae nostrum temporibus. Sint fugit ab ullam.`;
const LI_EUROPAN_LINGUES = `\
Li Europan lingues es membres del sam familie. Lor separat existentie es un myth. Por scientie, musica, sport etc, litot Europa usa li sam vocabular. Li lingues differe solmen in li grammatica, li pronunciation e li plu commun vocabules. Omnicos directe al desirabilite de un nov lingua franca: On refusa continuar payar custosi traductores. At solmen va esser necessi far uniform grammatica, pronunciation e plu commun paroles.

Ma quande lingues coalesce, li grammatica del resultant lingue es plu simplic e regulari quam ti del coalescent lingues. Li nov lingua franca va esser plu simplic e regulari quam li existent Europan lingues. It va esser tam simplic quam Occidental in fact, it va esser Occidental. A un Angleso it va semblar un simplificat Angles, quam un skeptic Cambridge amico dit me que Occidental es.`;

init().then(() => {
	// Test empty
	testString("");
	testBinary(new Uint8Array());

	let i;

	console.log(
		`
		Important: The test results do not represent
		the actual speed of the compression, they are the speed
		of the testing function.`
			.trim()
			.replace(/\s+/g, " ")
	);

	// Test lorem ipsum
	{
		let stats = [];
		i = 10;
		while (i <= 100) {
			stats.push(
				measure(i * LOREM_IPSUM.length, () => testString(LOREM_IPSUM.repeat(i)))
			);
			i += 10;
		}
		analyzeStats(stats, "Lorem Ipsum");
	}

	// Test li europan lingues
	{
		let stats = [];
		i = 10;
		while (i <= 100) {
			stats.push(
				measure(i * LOREM_IPSUM.length, () =>
					testString(LI_EUROPAN_LINGUES.repeat(i))
				)
			);
			i += 10;
		}
		analyzeStats(stats, "Li Europan Lingues");
	}

	// Test strings
	{
		let stats = [];
		i = 0;
		while (i < 500) {
			let data = generateText(1000 + random(1000));
			stats.push(measure(encoder.encode(data).length, () => testString(data)));
			i += 1;
		}
		analyzeStats(stats, "Random Strings");
	}

	// Test binary
	{
		let stats = [];
		i = 0;
		while (i < 500) {
			let data = generateBinary(1000 + random(1000));
			stats.push(measure(data.length, () => testBinary(data)));
			i += 1;
		}
		analyzeStats(stats, "Random Bytes");
	}
});

/**
 * Thests all functions of this package for consistent behavior.
 * @param {string} inStr
 */
function testString(inStr) {
	let inBinStr, outBinCmp, outStrCmp, outBinStr, outStr;
	try {
		inBinStr = encoder.encode(inStr);

		// Compress
		outBinCmp = compressGzip(inBinStr);
		if (!(outBinCmp instanceof Uint8Array))
			throw new Error("Binary UTF-8 string compression failed.");
		outStrCmp = compressStringGzip(inStr);
		if (!(outStrCmp instanceof Uint8Array))
			throw new Error("String compression failed.");

		// Compressed output must be equal for both variants
		assertEqual(outBinCmp, outStrCmp, "Compare compressed string data");

		// Raw utf8 data must be equal
		outBinStr = decompressGzip(outBinCmp);
		assertEqual(inBinStr, outBinStr, "Compare UTF-8 binary");

		assertEqual(
			inStr,
			decoder.decode(outBinStr),
			"Compare output strings from binary"
		);

		// String data must be equal
		outStr = decompressStringGzip(outBinCmp);
		assertEqual(inStr, outStr, "Compare output strings");
	} catch (e) {
		console.log({ inStr, inBinStr, outBinCmp, outStrCmp, outBinStr, outStr });
		throw e;
	}
}

/**
 * Thests `compressGzip` and `decompressGzip` with raw binary data.
 * @param {Uint8Array} inBin
 */
function testBinary(inBin) {
	// Compress
	let outBinCmp = compressGzip(inBin);
	if (!(outBinCmp instanceof Uint8Array))
		throw new Error("Binary compression failed.");
	let outBin = decompressGzip(outBinCmp);

	// Raw data must be equal
	assertEqual(inBin, outBin, "Compare output data");
}

/**
 * Generates random UTF-8 test samples.
 * @param {number} n Amount of code points.
 * @returns {string}
 */
function generateText(n) {
	let str = new Uint32Array(n);
	while (n-- > 0) str[n] = UTF_DICT[random(UTF_DICT.length)];
	return String.fromCodePoint(...str);
}

/**
 * Generates random binary test samples.
 * @param {number} n Amount of bytes.
 * @returns {Uint8Array}
 */
function generateBinary(n) {
	let bin = new Uint8Array(n);
	while (n-- > 0) bin[n] = random(256);
	return bin;
}

/**
 * @param {number} max Exclusive maximum number.
 * @returns {number}
 */
function random(max) {
	return Math.floor(Math.random() * max);
}

/**
 * Compares two arrays and throws
 * an error if they are not equal.
 * @param {Array<T>|string} a1
 * @param {Array<T>|string} a2
 * @param {string} [desc]
 * @template T
 */
function assertEqual(a1, a2, desc = "🤷") {
	Test: {
		if (a1.length !== a2.length) break Test;
		if (typeof a1 === "string") {
			if (a1 !== a2) break Test;
		} else if (!a1.every((b1, i) => b1 === a2[i])) break Test;
		return;
	}
	// Not equal
	throw new Error(`Assertion failed: Arrays are not equal. (${desc})`);
}

/**
 * @param {number} bytes
 * @param {Function} fn
 */
function measure(bytes, fn) {
	const start = Date.now();
	fn();
	const end = Date.now();
	return new Measurement(bytes, end - start);
}

/**
 * @param {Measurement[]} m
 * @param {string} title
 */
function analyzeStats(m, title) {
	const TIME_SCALE = 60;
	const secOverBytes = m.map((ms) => (TIME_SCALE * ms.time) / ms.bytes);
	const secOverLog2Bytes = m.map(
		(ms) => Math.log2(TIME_SCALE * ms.time) / ms.bytes
	);
	const secOverSqBytes = m.map(
		(ms) => (TIME_SCALE * (ms.time * ms.time)) / ms.bytes
	);

	const data = {
		"s/b": {
			AVG: average(secOverBytes).toFixed(8),
			ERR: calcError(secOverBytes).toFixed(8),
		},
		"log2(s)/b": {
			AVG: average(secOverLog2Bytes).toFixed(8),
			ERR: calcError(secOverLog2Bytes).toFixed(8),
		},
		"s²/b": {
			AVG: average(secOverSqBytes).toFixed(8),
			ERR: calcError(secOverSqBytes).toFixed(8),
		},
	};
	console.log("Results for " + title + ":");
	console.table(data);
	return data;
}

class Measurement {
	constructor(bytes, time) {
		this.bytes = bytes;
		this.time = time;
	}
}

/**
 * For n measurements: `1/n * Sum( data[i] - Avg(data) )`.
 * This function assures that a lower score means that the
 * numbers are closed together relative to their overall
 * range.
 * @param {number[]} data
 * @returns {number}
 */
function calcError(data) {
	const avg = average(data);
	const span = Math.max(...data) - Math.min(...data);
	return (
		data.map((x) => Math.abs(x - avg)).reduce((x, y) => x + y) /
		(data.length * span)
	);
}

/**
 * @param {number[]} data
 * @returns {number}
 */
function average(data) {
	return data.reduce((x, y) => x + y) / data.length;
}
