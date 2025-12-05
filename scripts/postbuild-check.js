#!/usr/bin/env node
/**
 * Post-build script to ensure Prisma binaries are available
 * This script runs after Prisma generates to verify binaries exist
 */

const fs = require('fs');
const path = require('path');

const prismaClientPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
const binaryName = 'libquery_engine-rhel-openssl-3.0.x.so.node';
const binaryPath = path.join(prismaClientPath, binaryName);

console.log('🔍 Checking Prisma binaries...');
console.log('Looking for:', binaryPath);

if (fs.existsSync(binaryPath)) {
  const stats = fs.statSync(binaryPath);
  console.log('✅ Found binary:', binaryName);
  console.log('   Size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  console.log('   Path:', binaryPath);
} else {
  console.log('❌ Binary not found:', binaryName);
  console.log('   This may cause issues on Vercel');
  console.log('   Available files in .prisma/client:');
  
  if (fs.existsSync(prismaClientPath)) {
    const files = fs.readdirSync(prismaClientPath);
    files.forEach(file => {
      if (file.includes('query_engine') || file.includes('libquery')) {
        console.log('   -', file);
      }
    });
  }
}

console.log('✅ Post-build check complete');


