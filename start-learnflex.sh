#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
node -e "const v=process.versions.node.split('.').map(Number);if(v[0]<22||(v[0]===22&&v[1]<5)){console.error('Install Node.js 22.5 or later (built-in SQLite is used).');process.exit(1)}"
npm start
