extern crate wee_alloc;

use libflate::gzip::{Decoder, Encoder};
use std::alloc::{GlobalAlloc, Layout};
use std::io::{Read, Write};
use std::ptr::slice_from_raw_parts;
use wasm_bindgen::prelude::wasm_bindgen;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

static mut BUFFER: Vec<u8> = Vec::new();

/// Gets the buffer address in memory
#[wasm_bindgen]
pub fn buffer() -> *const u8 {
	unsafe {
		// safety: WASM is single-threaded
		BUFFER.as_ptr()
	}
}

#[wasm_bindgen]
pub unsafe fn malloc_u8(size: usize) -> *mut u8 {
	ALLOC.alloc(Layout::array::<u8>(size).unwrap())
}

#[wasm_bindgen]
pub unsafe fn free_u8(ptr: *mut u8, size: usize) {
	ALLOC.dealloc(ptr, Layout::array::<u8>(size).unwrap());
}

/// Deallocates the buffer to free memory
#[wasm_bindgen]
pub unsafe fn deallocate_buffer() {
	// safety: WASM is single-threaded
	BUFFER = Vec::new()
}

/// Compresses the given bytes and returns the buffer length
#[wasm_bindgen]
pub unsafe fn gzip_compress(ptr: *const u8, len: usize) -> usize {
	let data = &*slice_from_raw_parts(ptr, len);
	// safety: WASM is single-threaded and libflate does not call into JS
	let buf = &mut BUFFER;
	buf.clear();
	let mut encoder = Encoder::new(buf).unwrap();
	encoder.write_all(data).unwrap();
	let res = encoder.finish().into_result().unwrap();
	res.len()
}

/// Decompresses the given bytes and returns the buffer length
#[wasm_bindgen]
pub unsafe fn gzip_decompress(ptr: *const u8, len: usize) -> usize {
	let data = &*slice_from_raw_parts(ptr, len);
	// safety: WASM is single-threaded and libflate does not call into JS
	let buf = &mut BUFFER;
	buf.clear();
	let res = Decoder::new(data);
	let mut decoder = res.unwrap();
	decoder.read_to_end(buf).unwrap_or(0xffff_ffff)
}
