#!/bin/bash
set -e

# Disable Next.js caching during build
export NODE_ENV=production
export NEXT_BUILD_ID=$(date +%s)

# Remove any existing cache
rm -rf .next .turbopack 2>/dev/null || true

# Build
npx next build

# Remove cache files immediately after build
rm -rf .next/cache .next/dev .next/.turbopack .turbopack 2>/dev/null || true

echo "Build complete with cache cleaned"
