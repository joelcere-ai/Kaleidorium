#!/bin/bash

# Kill any existing Next.js processes
pkill -f "next dev" 2>/dev/null

# Wait a moment for processes to clean up
sleep 2

# Start the development server
echo "Starting BlockMeister development server..."
WATCHPACK_POLLING=true NODE_ENV=development npm run dev 