#!/bin/bash

SCRIPT_DIR="$(dirname "$(realpath "$0")")"
PROJECT_DIR="$SCRIPT_DIR/warpkey"
OUTPUT_DIR="$SCRIPT_DIR/build"

mkdir -p "$OUTPUT_DIR"

PLATFORMS=("linux/amd64" "linux/arm64" "windows/amd64" "windows/arm64")

for PLATFORM in "${PLATFORMS[@]}"; do
    IFS="/" read -r OS ARCH <<< "$PLATFORM"
    export GOOS=$OS
    export GOARCH=$ARCH

    OUTPUT_FILE="$OUTPUT_DIR/warpkey-${OS}-${ARCH}"

    echo "Building for $OS/$ARCH..."
    go build -o "$OUTPUT_FILE"

    if [ $? -eq 0 ]; then
        echo "Build successful for $OS/$ARCH! Executable is located at $OUTPUT_FILE"
    else
        echo "Build failed for $OS/$ARCH!"
    fi
done
