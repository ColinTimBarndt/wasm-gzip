wasm-pack build --target web
wasm-snip --snip-rust-panicking-code --snip-rust-fmt-code -o .\pkg\wasm_gzip_bg.wasm .\pkg\wasm_gzip_bg.wasm
cd pkg
del /F .\.gitignore
npx terser --compress --mangle -o .\wasm_gzip.js -- .\wasm_gzip.js