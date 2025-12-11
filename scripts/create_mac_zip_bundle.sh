#!/bin/bash
# Build a macOS-friendly .zip that mirrors the DMG contents so users can simply unzip and drag.
# Usage: ./scripts/create_mac_zip_bundle.sh [APP_PATH] [HELPER_SCRIPT] [OUTPUT_DIR] [ZIP_NAME]

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "${SCRIPT_DIR}/.." && pwd )"

DEFAULT_APP_PATH="${REPO_ROOT}/tauri-app/src-tauri/target/aarch64-apple-darwin/release/bundle/macos/GanttGen.app"
DEFAULT_HELPER_PATH="${REPO_ROOT}/scripts/ClearGanttGenAttributes.command"
DEFAULT_OUTPUT_DIR="${REPO_ROOT}/tauri-app/src-tauri/target/aarch64-apple-darwin/release/bundle/zip"
DEFAULT_ZIP_NAME="GanttGen_mac_bundle.zip"

FALLBACK_APP_PATH="${REPO_ROOT}/tauri-app/src-tauri/target/release/bundle/macos/GanttGen.app"
FALLBACK_OUTPUT_DIR="${REPO_ROOT}/tauri-app/src-tauri/target/release/bundle/zip"

if [[ ! -d "${DEFAULT_APP_PATH}" && -d "${FALLBACK_APP_PATH}" ]]; then
    DEFAULT_APP_PATH="${FALLBACK_APP_PATH}"
fi

if [[ ! -d "${DEFAULT_OUTPUT_DIR}" && -d "${FALLBACK_OUTPUT_DIR}" ]]; then
    DEFAULT_OUTPUT_DIR="${FALLBACK_OUTPUT_DIR}"
fi

APP_PATH="${1:-$DEFAULT_APP_PATH}"
HELPER_SCRIPT="${2:-$DEFAULT_HELPER_PATH}"
OUTPUT_DIR="${3:-$DEFAULT_OUTPUT_DIR}"
ZIP_NAME="${4:-$DEFAULT_ZIP_NAME}"

PAYLOAD_NAME="GanttGen Mac Bundle"

if [[ ! -d "${APP_PATH}" ]]; then
    echo "❌ Could not find app bundle at ${APP_PATH}"
    exit 1
fi

if [[ ! -f "${HELPER_SCRIPT}" ]]; then
    echo "❌ Could not find helper script at ${HELPER_SCRIPT}"
    exit 1
fi

mkdir -p "${OUTPUT_DIR}"

STAGING_ROOT="$(mktemp -d)"
PAYLOAD_DIR="${STAGING_ROOT}/${PAYLOAD_NAME}"
mkdir -p "${PAYLOAD_DIR}"

echo "→ Copying GanttGen.app into bundle payload..."
cp -R "${APP_PATH}" "${PAYLOAD_DIR}/"

echo "→ Adding attribute reset helper..."
cp "${HELPER_SCRIPT}" "${PAYLOAD_DIR}/Clear GanttGen Attributes.command"
chmod +x "${PAYLOAD_DIR}/Clear GanttGen Attributes.command"

echo "→ Creating Applications alias..."
ln -s /Applications "${PAYLOAD_DIR}/Applications"

ZIP_PATH="${OUTPUT_DIR}/${ZIP_NAME}"
echo "→ Creating zip archive at ${ZIP_PATH}"
(
    cd "${STAGING_ROOT}"
    zip -ry "${ZIP_PATH}" "${PAYLOAD_NAME}" >/dev/null
)

rm -rf "${STAGING_ROOT}"

echo ""
echo "✅ macOS zip bundle created!"
echo "Contents:"
echo "  - ${ZIP_PATH} (contains GanttGen.app, helper script, and /Applications alias)"
