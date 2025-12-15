#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/services/api-service"
npm install
npm run start
