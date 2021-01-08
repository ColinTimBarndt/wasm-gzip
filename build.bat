wasm-pack build --target web
cd .\pkg
wasm-snip --snip-rust-panicking-code --snip-rust-fmt-code -o .\wasm_gzip_bg.wasm .\wasm_gzip_bg.wasm