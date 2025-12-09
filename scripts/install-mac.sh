#!/usr/bin/env bash

set -euo pipefail

DEFAULT_DMG=$(ls -t tauri-app/src-tauri/target/release/bundle/dmg/*.dmg 2>/dev/null | head -n 1 || true)
DMG_PATH="${1:-$DEFAULT_DMG}"

if [[ -z "${DMG_PATH}" ]]; then
  echo "No DMG found. Build the app first (npm run tauri:build) or pass a DMG path."
  exit 1
fi

if [[ ! -f "${DMG_PATH}" ]]; then
  echo "DMG not found at ${DMG_PATH}"
  exit 1
fi

MOUNT_DIR="$(mktemp -d /tmp/ganttgen-dmg.XXXXXX)"
cleanup() {
  if mount | grep -q "${MOUNT_DIR}"; then
    hdiutil detach "${MOUNT_DIR}" >/dev/null 2>&1 || true
  fi
  rmdir "${MOUNT_DIR}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Mounting ${DMG_PATH}..."
hdiutil attach "${DMG_PATH}" -nobrowse -mountpoint "${MOUNT_DIR}" >/dev/null

APP_SOURCE="${MOUNT_DIR}/GanttGen.app"
if [[ ! -d "${APP_SOURCE}" ]]; then
  echo "GanttGen.app not found inside DMG."
  exit 1
fi

DEST="/Applications/GanttGen.app"
if [[ -d "${DEST}" ]]; then
  echo "Removing existing ${DEST}..."
  rm -rf "${DEST}"
fi

echo "Copying GanttGen.app to /Applications..."
cp -R "${APP_SOURCE}" "/Applications/"

echo "Clearing quarantine attributes (if any)..."
xattr -cr "/Applications/GanttGen.app" 2>/dev/null || true

echo "Detaching DMG..."
hdiutil detach "${MOUNT_DIR}" >/dev/null

echo "GanttGen installed to /Applications."
