#!/usr/bin/env node

/**
 * Publish script - Publishes package to npm registry
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Publishing package...');

const distDir = path.join(process.cwd(), 'dist');
const originalDir = process.cwd();

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ Build directory not found. Please run: npm run build && npm run package');
  process.exit(1);
}

try {
  // Check if package.json exists in dist
  const distPkgPath = path.join(distDir, 'package.json');
  if (!fs.existsSync(distPkgPath)) {
    console.error('❌ package.json not found in dist. Please run: npm run package');
    process.exit(1);
  }

  // Change to dist directory
  process.chdir(distDir);

  console.log('📍 Current package version:');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`  Name: ${pkg.name}`);
  console.log(`  Version: ${pkg.version}`);

  console.log('\n⚠️  Before publishing, ensure:');
  console.log('  1. You are logged in to npm: npm login');
  console.log('  2. Version has been bumped appropriately');
  console.log('  3. All tests pass and code is built');

  console.log('\n📤 Publishing to npm registry...');
  console.log('   Run: npm publish');
  console.log('\n   Or with a specific tag: npm publish --tag beta');

  // Return to original directory
  process.chdir(originalDir);

  console.log('\n✅ Publishing instructions generated!');
  console.log('   To publish, run: cd dist && npm publish');
} catch (err) {
  process.chdir(originalDir);
  console.error('❌ Publishing error:', err.message);
  process.exit(1);
}
