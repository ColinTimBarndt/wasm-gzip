mod state;

use libflate::finish::AutoFinishUnchecked;
use libflate::gzip::{Decoder, Encoder};
use std::alloc::Layout;
use std::io::{Read, Write};
use std::ptr::{slice_from_raw_parts, NonNull};
use wasm_bindgen::prelude::wasm_bindgen;

use state::LocalState;

const ERROR: usize = 0xffff_ffff;

/// Gets the buffer address in memory
#[wasm_bindgen]
pub fn buffer() -> *const u8 {
	LocalState::with_buffer(|buf| buf.as_ptr())
}

#[wasm_bindgen]
pub fn error_message() -> *const u8 {
	LocalState::with_error_message(|buf| buf.as_ptr())
}

#[wasm_bindgen]
pub fn error_message_len() -> usize {
	LocalState::with_error_message(|buf| buf.len())
}

#[wasm_bindgen]
pub fn malloc_u8(size: usize) -> *mut u8 {
	if size == 0 {
		NonNull::dangling().as_ptr()
	} else {
		// safety: size is nonzero
		unsafe { std::alloc::alloc(Layout::array::<u8>(size).unwrap()) }
	}
}

/// # Safety
/// Pointer must have been allocated with `malloc_u8` and the same size.
#[wasm_bindgen]
pub unsafe fn free_u8(ptr: *mut u8, size: usize) {
	if size == 0 {
		return;
	}
	std::alloc::dealloc(ptr, Layout::array::<u8>(size).unwrap());
}

/// Deallocates the buffer to free memory
#[wasm_bindgen]
pub fn deallocate_buffer() {
	LocalState::with_buffer(|buf| *buf = Vec::new());
	LocalState::with_error_message(|msg| *msg = String::new());
}

/// Compresses the given bytes and returns the buffer length
///
/// # Safety
/// Data must point to an allocation with at least `len` bytes.
#[wasm_bindgen]
pub unsafe fn gzip_compress(ptr: *const u8, len: usize) -> usize {
	let data = &*slice_from_raw_parts(ptr, len);
	return compress(data);

	fn compress(data: &[u8]) -> usize {
		LocalState::with_buffer(|buf| {
			buf.clear();
			let mut encoder = AutoFinishUnchecked::new(Encoder::new(&mut *buf).unwrap());
			let _ = encoder.write_all(data);
			drop(encoder);
			buf.len()
		})
	}
}

/// Decompresses the given bytes and returns the buffer length
///
/// # Safety
/// Data must point to an allocation with at least `len` bytes.
#[wasm_bindgen]
pub unsafe fn gzip_decompress(ptr: *const u8, len: usize) -> usize {
	let data = &*slice_from_raw_parts(ptr, len);
	return decompress(data);

	fn decompress(data: &[u8]) -> usize {
		let res: Result<usize, String> = LocalState::with_buffer(|buf| {
			buf.clear();
			let mut decoder = Decoder::new(data).map_err(|e| e.to_string())?;
			decoder.read_to_end(buf).map_err(|e| e.to_string())
		});
		res.unwrap_or_else(|err| {
			LocalState::with_error_message(|msg| *msg = err);
			ERROR
		})
	}
}
