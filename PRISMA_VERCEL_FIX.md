# Prisma Vercel Deployment Fix - MongoDB

## Problem
Prisma cannot locate the Query Engine binary for runtime "rhel-openssl-3.0.x" on Vercel serverless functions when using MongoDB.

## Root Cause
The hardcoded `PRISMA_QUERY_ENGINE_LIBRARY` path in `vercel.json` was pointing to a location that doesn't exist at runtime, preventing Prisma from auto-detecting the engine binary.

## Changes Made

### 1. Fixed `vercel.json`
- **Removed** hardcoded `PRISMA_QUERY_ENGINE_LIBRARY` environment variable
- **Removed** `PRISMA_CLIENT_ENGINE_TYPE` (not needed - schema config is sufficient)
- Prisma will now auto-detect the engine binary from `node_modules/.prisma/client`

### 2. Verified Prisma Schema Configuration
Your `prisma/schema.prisma` already has the correct configuration:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
  engineType    = "library"
}
```

### 3. Build Process
Your `package.json` already has the correct build scripts:
- `postinstall`: Runs `prisma generate` after npm install
- `build`: Runs `prisma generate && next build`

## Immediate Solution

After these changes:
1. **Commit and push** the updated `vercel.json`
2. **Redeploy** on Vercel
3. The build should:
   - Run `prisma generate` which creates binaries for `rhel-openssl-3.0.x`
   - Include the binaries in the deployment
   - Prisma will auto-detect them at runtime

## Recommended Long-term Solution: Prisma Accelerate

For MongoDB on serverless platforms like Vercel, **Prisma Accelerate** is the most reliable solution:

### Why Prisma Accelerate?
- ✅ **No binary files needed** - eliminates this entire issue
- ✅ **Connection pooling** built-in
- ✅ **Global edge locations** for low latency
- ✅ **Designed for serverless** environments
- ✅ **Free tier available**

### Setup Steps:
1. Sign up at https://accelerate.prisma.io/
2. Connect your MongoDB Atlas database
3. Get your Accelerate connection string (format: `prisma://accelerate.prisma-data.net/?api_key=...`)
4. Update `DATABASE_URL` in Vercel environment variables
5. **No code changes needed!** Your Prisma Client code works the same

## Verification

After deploying:
1. Check Vercel build logs - should see "✔ Generated Prisma Client"
2. Check function logs - should NOT see binary errors
3. Test signup/login endpoints

## If Issues Persist

If you still see binary errors after redeploying:

1. **Check Vercel Build Logs**:
   - Ensure `prisma generate` runs successfully
   - Look for any errors about missing binaries

2. **Verify Binary Generation**:
   - The build should generate: `node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node`

3. **Consider Prisma Accelerate**:
   - This is the official recommended solution for MongoDB on serverless
   - Completely eliminates binary issues

## Technical Details

- **Binary Target**: `rhel-openssl-3.0.x` is correct for Vercel's serverless runtime
- **Engine Type**: `library` is correct for serverless (uses Node-API)
- **Auto-detection**: Prisma will automatically find the binary in `node_modules/.prisma/client` when no hardcoded path is specified

