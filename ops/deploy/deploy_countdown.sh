#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${GITHUB_WORKSPACE:-$(pwd)}"
BUILD_DIR="${BUILD_DIR:-${SOURCE_DIR}/out}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/srv/www/countdown}"
RELEASES_DIR="${DEPLOY_ROOT}/releases"
CURRENT_LINK="${DEPLOY_ROOT}/current"
KEEP_RELEASES="${KEEP_RELEASES:-10}"

TIMESTAMP_UTC="$(date -u +%Y%m%d%H%M%S)"
if [[ -n "${GITHUB_SHA:-}" ]]; then
  RELEASE_ID="${TIMESTAMP_UTC}-${GITHUB_SHA::12}"
else
  RELEASE_ID="${TIMESTAMP_UTC}-manual"
fi

RELEASE_PATH="${RELEASES_DIR}/${RELEASE_ID}"
TMP_RELEASE_PATH="${RELEASES_DIR}/.tmp-${RELEASE_ID}"

mkdir -p "${RELEASES_DIR}"
rm -rf "${TMP_RELEASE_PATH}"
mkdir -p "${TMP_RELEASE_PATH}"

if [[ ! -d "${BUILD_DIR}" ]]; then
  echo "Build output directory not found: ${BUILD_DIR}" >&2
  exit 1
fi

rsync -a --delete \
  --exclude ".DS_Store" \
  "${BUILD_DIR}/" "${TMP_RELEASE_PATH}/"

if [[ ! -f "${TMP_RELEASE_PATH}/index.html" ]]; then
  echo "index.html not found in deployment payload" >&2
  exit 1
fi

rm -rf "${RELEASE_PATH}"
mv "${TMP_RELEASE_PATH}" "${RELEASE_PATH}"
ln -sfn "${RELEASE_PATH}" "${CURRENT_LINK}"
CURRENT_RELEASE_NAME="$(basename "$(readlink "${CURRENT_LINK}")")"

# Keep only the most recent N release directories.
if [[ "${KEEP_RELEASES}" =~ ^[0-9]+$ ]] && (( KEEP_RELEASES > 0 )); then
  ls -1 "${RELEASES_DIR}" 2>/dev/null | sort -r | tail -n +$((KEEP_RELEASES + 1)) | while IFS= read -r dir_name; do
    [[ -n "${dir_name}" ]] || continue
    [[ "${dir_name}" == "${CURRENT_RELEASE_NAME}" ]] && continue
    rm -rf "${RELEASES_DIR}/${dir_name}"
  done
fi

echo "Deployment completed: ${RELEASE_PATH}"
