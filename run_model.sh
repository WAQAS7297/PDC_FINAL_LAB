#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/services/model-service"
npm install
npm run start
