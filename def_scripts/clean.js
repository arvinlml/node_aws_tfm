#!/usr/bin/env node

/**
 * Clean script - Removes build artifacts and caches
 */

const fs = require('fs');
const path = require('path');

const dirsToRemove = ['dist', 'coverage', '.nyc_output'];

console.log('🧹 Cleaning project...');

dirsToRemove.forEach((dir) => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`  ✓ Removed ${dir}/`);
  }
});

console.log('✅ Clean completed successfully!');
