#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KEYS_DIR="${ROOT_DIR}/keys"

mkdir -p "${KEYS_DIR}"

openssl genrsa -out "${KEYS_DIR}/jwt-private.pem" 2048
openssl rsa -in "${KEYS_DIR}/jwt-private.pem" -pubout -out "${KEYS_DIR}/jwt-public.pem"

chmod 600 "${KEYS_DIR}/jwt-private.pem"
chmod 644 "${KEYS_DIR}/jwt-public.pem"

echo "JWT keys written to ${KEYS_DIR}/"
echo "Never commit jwt-private.pem (see keys/README.md)."
