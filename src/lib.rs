use js_sys::JSON;
use libflate::gzip::{Decoder, Encoder};
use std::io::{self, Read};
use wasm_bindgen::prelude::*;

/// Compresses binary data using GZip.
#[wasm_bindgen(js_name = "compressGzip")]
pub fn gzip_compress(mut data: &[u8]) -> Option<Vec<u8>> {
	let mut encoder: Encoder<Vec<u8>> = Encoder::new(Vec::new()).unwrap();
	io::copy(&mut data, &mut encoder).unwrap();
	match encoder.finish().into_result() {
		Ok(data) => Some(data),
		Err(_e) => return None,
	}
}

/// Decompresses GZip data and returns the binary result.
#[wasm_bindgen(js_name = "decompressGzip")]
pub fn gzip_decompress(data: &[u8]) -> Option<Vec<u8>> {
	let mut decoder: Decoder<&[u8]> = match Decoder::new(data) {
		Ok(v) => v,
		Err(_e) => return None,
	};
	let mut decoded = Vec::new();
	match decoder.read_to_end(&mut decoded) {
		Ok(_len) => Some(decoded),
		Err(_e) => None,
	}
}

#[wasm_bindgen(js_name = "compressStringGzip")]
pub fn gzip_compress_string(string: &str) -> Option<Vec<u8>> {
	gzip_compress(string.as_bytes())
}

#[wasm_bindgen(js_name = "decompressStringGzip")]
pub fn gzip_decompress_string(data: &[u8]) -> Option<String> {
	gzip_decompress(data).map(|decoded| String::from_utf8_lossy(&decoded).to_string())
}

#[wasm_bindgen(js_name = "compressJsonGzip")]
pub fn gzip_compress_json(data: &JsValue) -> Result<Vec<u8>, JsValue> {
	match gzip_compress(String::from(JSON::stringify(data)?).as_bytes()) {
		Some(r) => Ok(r),
		None => return Err(JsValue::from_str("Compression failed.")),
	}
}

#[wasm_bindgen(js_name = "decompressJsonGzip")]
pub fn gzip_decompress_json(data: &[u8]) -> Result<JsValue, JsValue> {
	let text = match gzip_decompress_string(data) {
		Some(s) => s,
		None => return Err(JsValue::from_str("Decompression failed.")),
	};
	JSON::parse(&text)
}
