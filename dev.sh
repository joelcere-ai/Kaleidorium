#!/bin/bash

# Export environment variable to disable Turbopack
export DISABLE_TURBOPACK=1

# Run Next.js with local nodemon
npx nodemon --watch '**/*' -e js,jsx,ts,tsx,json --exec 'npm run dev' 