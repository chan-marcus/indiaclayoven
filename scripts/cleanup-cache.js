#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const cacheDirs = [
  '.next/cache',
  '.next/dev',
  '.next/.turbopack',
  '.turbopack'
];

console.log('Cleaning build cache...');
cacheDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`Removed ${dir}`);
  }
});
console.log('Cache cleanup complete');
