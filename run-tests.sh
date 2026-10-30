#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
python3 bootstrap-source.py
node --test --test-concurrency=4 tests/*.test.mjs \
  source/integration.test.mjs source/crescent/tests/*.test.mjs source/crescent-tests/*.test.mjs \
  source/runtime-candidate/sunset-coast/play/tests/*.test.mjs \
  source/runtime-candidate/sunset-coast/play/*.test.mjs
