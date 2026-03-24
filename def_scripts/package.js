#!/usr/bin/env node

/**
 * Package script - Creates a distributable package
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Packaging project...');

// Verify build exists
const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  console.error('❌ Build directory not found. Please run build first: npm run build');
  process.exit(1);
}

try {
  // Copy package.json to dist
  const packageJson = require('./package.json');
  const pkgPath = path.join(process.cwd(), 'package.json');
  const distPkgPath = path.join(distDir, 'package.json');

  // Create a minimal package.json for distribution
  const distPackage = {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    main: 'index.js',
    types: 'index.d.ts',
    engines: packageJson.engines,
    keywords: packageJson.keywords,
    author: packageJson.author,
    license: packageJson.license,
    dependencies: packageJson.dependencies
  };

  fs.writeFileSync(distPkgPath, JSON.stringify(distPackage, null, 2));
  console.log('  ✓ Copied package.json to dist/');

  // Copy README if exists
  const readmePath = path.join(process.cwd(), 'README.md');
  if (fs.existsSync(readmePath)) {
    fs.copyFileSync(readmePath, path.join(distDir, 'README.md'));
    console.log('  ✓ Copied README.md to dist/');
  }

  // Copy LICENSE if exists
  const licensePath = path.join(process.cwd(), 'LICENSE');
  if (fs.existsSync(licensePath)) {
    fs.copyFileSync(licensePath, path.join(distDir, 'LICENSE'));
    console.log('  ✓ Copied LICENSE to dist/');
  }

  console.log('✅ Package created successfully!');
  console.log(`📁 Package directory: dist/`);
} catch (err) {
  console.error('❌ Packaging error:', err.message);
  process.exit(1);
}
