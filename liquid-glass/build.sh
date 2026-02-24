#!/bin/bash
set -e

# Build liquid_glass.wasm from liquid_glass.c
#
# Prerequisites:
#   Option A (recommended): Install Emscripten
#     git clone https://github.com/emscripten-core/emsdk.git
#     cd emsdk && ./emsdk install latest && ./emsdk activate latest
#     source ./emsdk_env.sh
#
#   Option B: Install LLVM with WASM target
#     brew install llvm
#     export PATH="/opt/homebrew/opt/llvm/bin:$PATH"

cd "$(dirname "$0")"

if command -v emcc &>/dev/null; then
  echo "Building with Emscripten..."
  emcc liquid_glass.c -O3 --no-entry \
    -s EXPORTED_FUNCTIONS='["_lg_init","_lg_input_ptr","_lg_output_ptr","_lg_process"]' \
    -s INITIAL_MEMORY=16777216 \
    -s ALLOW_MEMORY_GROWTH=0 \
    -s STANDALONE_WASM \
    -o liquid_glass.wasm
  echo "Built: liquid_glass.wasm ($(wc -c < liquid_glass.wasm) bytes)"

elif command -v clang &>/dev/null && clang --print-targets 2>/dev/null | grep -q wasm; then
  echo "Building with clang (standalone WASM)..."
  clang --target=wasm32 -O3 -nostdlib \
    -Wl,--no-entry \
    -Wl,--export=lg_init \
    -Wl,--export=lg_input_ptr \
    -Wl,--export=lg_output_ptr \
    -Wl,--export=lg_process \
    -Wl,--initial-memory=16777216 \
    -o liquid_glass.wasm liquid_glass.c
  echo "Built: liquid_glass.wasm ($(wc -c < liquid_glass.wasm) bytes)"

else
  echo "Error: No WASM compiler found."
  echo "Install Emscripten: https://emscripten.org/docs/getting_started/downloads.html"
  exit 1
fi
