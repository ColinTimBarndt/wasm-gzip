export type SyncInitInput = BufferSource | WebAssembly.Module;
export type InitInput =
    | RequestInfo
    | URL
    | Response
    | PromiseLike<Response>
    | SyncInitInput;

declare const DATA: unique symbol;

export type Pointer<T = unknown> = number & { [DATA]: { type: T } };
export type MutPointer<T = unknown> = Pointer<T> & { [DATA]: { mut: true } };

export interface WasmExports {
    readonly memory: WebAssembly.Memory;
    readonly buffer: () => Pointer<"u8">;
    readonly error_message: () => Pointer<"u8">;
    readonly error_message_len: () => number;
    readonly malloc_u8: (a: number) => MutPointer<"u8">;
    readonly free_u8: (a: MutPointer<"u8">, len: number) => void;
    readonly deallocate_buffer: () => void;
    readonly gzip_compress: (
        ptr: Pointer<"u8">,
        len: number,
        options: number,
    ) => number;
    readonly gzip_decompress: (
        ptr: Pointer<"u8">,
        len: number,
        multi: number,
    ) => number;
}

let instance: WasmExports | Promise<WasmExports> | null = null;

export async function init(
    module_or_path?: InitInput | undefined,
): Promise<WasmExports> {
    if (instance) return instance;

    const promise = (async () => {
        if (!module_or_path) {
            module_or_path = new URL("wasm_gzip.wasm", import.meta.url);
        }

        if (
            typeof module_or_path === "string" ||
            (typeof Request === "function" &&
                module_or_path instanceof Request) ||
            (typeof URL === "function" && module_or_path instanceof URL)
        ) {
            module_or_path = fetch(module_or_path);
        }

        const instantiated = await load(
            await (module_or_path as
                | Response
                | PromiseLike<Response>
                | SyncInitInput),
        );

        // check race condition: initSync may have been called
        if ((instance as unknown) instanceof Promise) {
            instance = instantiated.instance.exports as unknown as WasmExports;
        }

        return instance!;
    })();

    return (instance = promise);
}

export function initSync(module: SyncInitInput) {
    if (instance && !(instance instanceof Promise)) return instance;

    const importObject = {};

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    instance = new WebAssembly.Instance(module, importObject)
        .exports as unknown as WasmExports;

    return instance;
}

async function load(module: Response | SyncInitInput) {
    const importObject = {};

    if (typeof Response === "function" && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === "function") {
            try {
                return await WebAssembly.instantiateStreaming(
                    module,
                    importObject,
                );
            } catch (e) {
                if (module.headers.get("Content-Type") != "application/wasm") {
                    console.warn(
                        "`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",
                        e,
                    );
                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, importObject);
    } else {
        const instance:
            | WebAssembly.Instance
            | WebAssembly.WebAssemblyInstantiatedSource =
            await WebAssembly.instantiate(module, importObject);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }
}
