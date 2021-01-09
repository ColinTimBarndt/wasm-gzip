import init, * as Zip from "../wasm_gzip.js";

Object.defineProperty(window, "Zip", { value: Zip, writable: false });

init().then(() => {
	const inputText = `\
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
	const uncompressed = Zip.stringToUtf8(inputText);
	const compressed = Zip.compressGzip(uncompressed).slice(0);
	const result = Zip.decompressGzip(compressed).slice(0);
	const outputText = Zip.utf8ToString(result);
	console.table({ inputText, outputText });
	console.log("Uncompressed size:", uncompressed.length);
	console.log("Compressed size:", compressed.length);

	if (outputText != inputText) throw new Error("Test failed.");
});
