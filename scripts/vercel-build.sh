#!/bin/bash
# Script to ensure Prisma binaries are properly generated for Vercel
set -e

echo "Generating Prisma Client with binary targets..."
npx prisma generate

echo "Verifying Prisma binaries..."
if [ -f "node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node" ]; then
  echo "✓ RHEL binary found"
else
  echo "✗ RHEL binary NOT found - this may cause issues on Vercel"
fi

echo "Prisma generation complete"

