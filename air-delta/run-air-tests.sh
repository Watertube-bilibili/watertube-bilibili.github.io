#!/usr/bin/env bash
set -euo pipefail
if [ "$#" -ne 1 ]; then
  echo 'Usage: bash air-delta/run-air-tests.sh /path/to/replayed-source' >&2
  exit 2
fi
cd -- "$1"
node --test --test-concurrency=4 \
  source/runtime-candidate/sunset-coast/play/tests/browser-roadster-air.test.mjs \
  source/runtime-candidate/sunset-coast/play/tests/browser-roadster-integration.test.mjs \
  source/runtime-candidate/sunset-coast/play/tests/browser-motorcycle-integration.test.mjs \
  source/runtime-candidate/sunset-coast/play/tests/delivery-cold-asset-restore.test.mjs \
  source/runtime-candidate/sunset-coast/play/tests/browser-air-entry-policy.test.mjs \
  tests/load-vehicle-identity.test.mjs tests/native-reserve-differential.test.mjs
