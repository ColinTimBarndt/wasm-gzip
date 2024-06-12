mod state;

use bitflags::bitflags;
use libflate::finish::AutoFinishUnchecked;
use libflate::gzip::{Decoder, EncodeOptions, Encoder, MultiDecoder};
use std::alloc::Layout;
use std::io::{Read, Write};
use std::ptr::{slice_from_raw_parts, NonNull};

use state::LocalState;

const ERROR: usize = 0xffff_ffff;

/// Gets the buffer address in memory
#[no_mangle]
pub fn buffer() -> *const u8 {
	LocalState::with_buffer(|buf| buf.as_ptr())
}

#[no_mangle]
pub fn error_message() -> *const u8 {
	LocalState::with_error_message(|buf| buf.as_ptr())
}

#[no_mangle]
pub fn error_message_len() -> usize {
	LocalState::with_error_message(|buf| buf.len())
}

#[no_mangle]
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
#[no_mangle]
pub unsafe fn free_u8(ptr: *mut u8, size: usize) {
	if size == 0 {
		return;
	}
	std::alloc::dealloc(ptr, Layout::array::<u8>(size).unwrap());
}

/// Deallocates the buffer to free memory
#[no_mangle]
pub fn deallocate_buffer() {
	LocalState::with_buffer(|buf| *buf = Vec::new());
}

bitflags! {
	pub struct CompressionOptions: u32 {
		const NO_COMPRESSION = 1;
		const FIXED_HUFFMAN_CODES = 2;
	}
}

/// Compresses the given bytes and returns the buffer length
///
/// # Safety
/// Data must point to an allocation with at least `len` bytes.
#[no_mangle]
pub unsafe fn gzip_compress(ptr: *const u8, len: usize, options: CompressionOptions) -> usize {
	let data = &*slice_from_raw_parts(ptr, len);
	return compress(data, options);

	fn compress(data: &[u8], options: CompressionOptions) -> usize {
		let mut enc_options = EncodeOptions::new();

		if options.contains(CompressionOptions::NO_COMPRESSION) {
			enc_options = enc_options.no_compression();
		}

		if options.contains(CompressionOptions::FIXED_HUFFMAN_CODES) {
			enc_options = enc_options.fixed_huffman_codes();
		}

		LocalState::with_buffer(|buf| {
			buf.clear();
			let mut encoder =
				AutoFinishUnchecked::new(Encoder::with_options(&mut *buf, enc_options).unwrap());
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
#[no_mangle]
pub unsafe fn gzip_decompress(ptr: *const u8, len: usize, multi: u32) -> usize {
	let data = &*slice_from_raw_parts(ptr, len);
	return decompress(data, multi != 0);

	fn decompress(data: &[u8], multi: bool) -> usize {
		let res: Result<usize, &str> = LocalState::with_buffer(|buf| {
			buf.clear();

			if multi {
				let mut decoder = MultiDecoder::new(data).map_err(|_| "invalid header")?;
				decoder.read_to_end(buf).map_err(|_| "invalid body")
			} else {
				let mut decoder = Decoder::new(data).map_err(|_| "invalid header")?;
				decoder.read_to_end(buf).map_err(|_| "invalid body")
			}
		});
		res.unwrap_or_else(|err| {
			LocalState::with_error_message(|msg| *msg = err);
			ERROR
		})
	}
}
