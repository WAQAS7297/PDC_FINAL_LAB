#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/clients/node-client"
npm install
npm run all
