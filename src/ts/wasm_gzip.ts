import * as module from "./module.js";

const ERROR = 0xffff_ffff;

let wasm: module.WasmExports | null = null;

/**
 * If `module_or_path` is {@link RequestInfo} or {@link URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param init
 */
export default async function init(init?: module.InitInput | undefined) {
    wasm = await module.init(init);
}

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param module
 */
export function initSync(init: module.SyncInitInput) {
    wasm = module.initSync(init);
}

/**
 * Represents an error that occured while attempting to decompress
 * gzipped data.
 */
export class DecompressionError extends Error {
    name = "DecompressionError";

    constructor(message: string) {
        super(message);
    }
}

/**
 * Determines the amount of bytes needed to encode the given string in UTF-8.
 * @param str
 */
function utf8size(str: string) {
    let i = 0,
        cp = 0,
        sz = 0;
    const len = str.length;
    while (i < len) {
        cp = str.codePointAt(i)!;
        if (cp <= 0x7f) {
            sz += 1;
            i++;
        } else if (cp <= 0x7ff) {
            sz += 2;
            i++;
        } else if (cp <= 0xffff) {
            sz += 3;
            i++;
        } else {
            sz += 4;
            i += 2;
        }
    }
    return sz;
}

let passedLength: number = 0;

let encoder: TextEncoder | null = null;
let memory8: Uint8Array | null = null;

type ByteArrayInput =
    | Uint8Array
    | Int8Array
    | Uint8ClampedArray
    | readonly number[];

/**
 * Passes bytes to WASM.
 * @param wasm WASM module.
 * @param dataOrLen Either data or a length to be filled by {@link cb}.
 * @param cb Callback filling the data array.
 * @return Address of allocated data. Sets {@link passedLength}.
 */
function passData(
    wasm: module.WasmExports,
    dataOrLen: ByteArrayInput | string | number,
    cb?: (data: Uint8Array) => void,
): module.MutPointer<"u8"> {
    let ptr: module.MutPointer<"u8">;
    if (cb) {
        const len = dataOrLen as number;
        ptr = wasm.malloc_u8(len);
        const buf = new Uint8Array(wasm.memory.buffer, ptr, len);
        try {
            cb(buf);
        } catch (e) {
            wasm.free_u8(ptr, len);
            throw e;
        }
        passedLength = len;
        return ptr;
    }
    if (typeof dataOrLen === "string") {
        const len = (passedLength = utf8size(dataOrLen));
        ptr = wasm.malloc_u8(len);
        const buf = new Uint8Array(wasm.memory.buffer, ptr, len);
        if (!encoder) encoder = new TextEncoder();
        encoder.encodeInto(dataOrLen, buf);
        return ptr;
    }
    const buf = dataOrLen as ByteArrayInput;
    ptr = wasm.malloc_u8((passedLength = buf.length));
    if (!memory8 || !memory8.length)
        memory8 = new Uint8Array(wasm.memory.buffer);
    memory8.set(buf, ptr);
    return ptr;
}

export interface CompressionOptions {
    /**
     * Disables LZ77 compression.
     */
    noCompression?: boolean;
    /**
     * Specifies to compress with fixed huffman codes.
     */
    fixedHuffmanCodes?: boolean;
}

export interface DecompressionOptions {
    /**
     * A decoder that decodes all members in a GZIP data array.
     */
    multi?: boolean;
}

const OPTION_BITS = {
    noCompression: 1,
    fixedHuffmanCodes: 2,
    multi: 1,
} satisfies Record<
    keyof CompressionOptions | keyof DecompressionOptions,
    number
>;

/**
 * Compresses the given bytes / UTF-8 string and returns a buffer.
 *
 * **NOTE:** The returned buffer is only valid until new data is (de-)compressed.
 *
 * @param data Binary data or UTF-8 string.
 * @returns GZip compressed binary data.
 */
export function compress(
    data: ByteArrayInput | string,
    options?: CompressionOptions,
): Uint8Array;
/**
 * Compresses the data provided by {@link cb}. This method is the most
 * efficient as it writes directly into WASM memory without copying.
 *
 * **NOTE:** The returned buffer is only valid until new data is (de-)compressed.
 *
 * @param len Length in bytes.
 * @param cb Callback which initializes the data array.
 * @returns GZip compressed binary data.
 */
export function compress(
    len: number,
    cb: (data: Uint8Array) => void,
    options?: CompressionOptions,
): Uint8Array;
export function compress(
    dataOrLen: ByteArrayInput | string | number,
    cb: ((data: Uint8Array) => void) | CompressionOptions | undefined,
    options: CompressionOptions = {},
) {
    checkWasm(wasm);
    if (cb && !(cb instanceof Function)) {
        options = cb;
        cb = undefined;
    }

    const flags = makeFlags(options, OPTION_BITS);
    const ptrIn = passData(wasm, dataOrLen, cb);
    const lenOut = wasm.gzip_compress(ptrIn, passedLength, flags) >>> 0;
    wasm.free_u8(ptrIn, passedLength);
    const ptrOut = wasm.buffer() >>> 0;
    return new Uint8Array(wasm.memory.buffer, ptrOut, lenOut);
}

/**
 * Decompresses the given bytes and returns a buffer.
 *
 * **NOTE:** The returned buffer is only valid until new data is (de-)compressed.
 *
 * @param data GZip compressed binary data.
 * @returns Raw binary data.
 */
export function decompress(
    data: ByteArrayInput,
    options?: DecompressionOptions,
): Uint8Array;
/**
 * Decompresses the data provided by {@link cb}. This method is the most
 * efficient as it writes directly into WASM memory without copying.
 *
 * **NOTE:** The returned buffer is only valid until new data is (de-)compressed.
 *
 * @param len Length in bytes.
 * @param cb Callback which initializes the data array.
 * @returns Raw binary data.
 */
export function decompress(
    len: number,
    cb: (data: Uint8Array) => void,
    options?: DecompressionOptions,
): Uint8Array;
export function decompress(
    dataOrLen: ByteArrayInput | number,
    cb: ((data: Uint8Array) => void) | DecompressionOptions | undefined,
    options: DecompressionOptions = {},
) {
    checkWasm(wasm);
    if (cb && !(cb instanceof Function)) {
        options = cb;
        cb = undefined;
    }

    const flags = makeFlags(options, OPTION_BITS);

    const ptrIn = passData(wasm, dataOrLen, cb);
    const lenOut = wasm.gzip_decompress(ptrIn, passedLength, flags) >>> 0;
    wasm.free_u8(ptrIn, passedLength);
    if (lenOut === ERROR) {
        const ptrMsg = wasm.error_message();
        const lenMsg = wasm.error_message_len();
        const msgRaw = new Uint8Array(wasm.memory.buffer, ptrMsg, lenMsg);
        const msg = new TextDecoder().decode(msgRaw);
        throw new DecompressionError(msg);
    }
    const ptrOut = wasm.buffer() >>> 0;
    return new Uint8Array(wasm.memory.buffer, ptrOut, lenOut);
}

/**
 * Deallocates the buffer used to store the result of (de-)compression.
 */
export function freeBuffer() {
    checkWasm(wasm);
    wasm.deallocate_buffer();
}

function checkWasm(wasm: any): asserts wasm {
    if (!wasm) throw new Error("WASM not initialized");
}

function makeFlags<K extends string>(
    options: Partial<Record<K, boolean>>,
    bits: Record<K, number>,
): number {
    let flags = 0;
    for (const name in options) {
        flags |= +options[name]! * bits[name];
    }
    return flags;
}
