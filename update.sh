#!/bin/bash
# Author: geeklinux-io(GitHub)
# Blog: https://www.geeklinux.cn
# Regularly update scripts
# You can use crontab to schedule tasks to execute this script and submit updates to your GitHub repository

# Set Env
TOOL_DIR=""
PROJECT_DIR=""
DATA_DIR="$TOOL_DIR/data"
PROJECT_DATA_DIR="$PROJECT_DIR/data"
EXECUTABLE="$TOOL_DIR/warpkey-linux-amd64"

cd "$TOOL_DIR" || exit 1
if [ -x "$EXECUTABLE" ]; then
    "$EXECUTABLE" || exit 1
else
    echo "Executable $EXECUTABLE not found or not executable"
    exit 1
fi

rm -rf "$PROJECT_DATA_DIR"/*
cp -r "$DATA_DIR"/* "$PROJECT_DATA_DIR/"
cd "$PROJECT_DIR" || exit 1

if git status --porcelain | grep -q '^'; then
    current_time=$(date +"%Y-%m-%d %H:%M:%S")
    git add ./data
    git commit -m "🚀Automatic update - $current_time"
    git push || exit 1
else
    echo "No changes to commit"
fi
