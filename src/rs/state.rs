use std::cell::UnsafeCell;

thread_local! {
	static STATE: LocalState = const { LocalState::new() };
}

pub(crate) struct LocalState {
	// invariant 1: only with_buffer can access the data
	buffer: UnsafeCell<Vec<u8>>,
	// invariant: only with_error_message can access the data
	error_message: UnsafeCell<&'static str>,
}

impl LocalState {
	const fn new() -> Self {
		Self {
			buffer: UnsafeCell::new(Vec::new()),
			error_message: UnsafeCell::new(""),
		}
	}

	pub(crate) fn with_buffer<R>(cb: impl for<'a> FnOnce(&'a mut Vec<u8>) -> R) -> R {
		STATE.with(|state| cb(unsafe { &mut *state.buffer.get() }))
	}

	pub(crate) fn with_error_message<R>(cb: impl for<'a> FnOnce(&'a mut &'static str) -> R) -> R {
		STATE.with(|state| cb(unsafe { &mut *state.error_message.get() }))
	}
}
