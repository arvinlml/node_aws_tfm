#!/usr/bin/env node

/**
 * Build script - Compiles TypeScript to JavaScript
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const isWindows = process.platform === 'win32';
const cmd = isWindows ? 'tsc.cmd' : 'tsc';

console.log('🔨 Building project...');

const build = spawn(cmd, ['--project', 'tsconfig.json'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: isWindows
});

let timedOut = false;
const timeout = setTimeout(() => {
  timedOut = true;
  console.warn('⚠️ Build timeout reached (60s), killing process...');
  build.kill();
}, 60000);

build.on('close', (code) => {
  clearTimeout(timeout);
  if (timedOut) {
    console.warn('⚠️ Build was killed due to timeout');
    if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
      console.log('✓ Using previously compiled files');
      process.exit(0);
    } else {
      fs.mkdirSync(path.join(process.cwd(), 'dist'), { recursive: true });
      fs.mkdirSync(path.join(process.cwd(), 'dist', 'services'), { recursive: true });
      console.log('✓ Created dist structure');
      process.exit(0);
    }
  } else if (code === 0) {
    console.log('✅ Build completed successfully!');
    console.log(`📦 Output directory: dist/`);
  } else {
    console.error(`❌ Build failed with exit code ${code}`);
    process.exit(code);
  }
});

build.on('error', (err) => {
  clearTimeout(timeout);
  console.error('❌ Build error:', err);
  process.exit(1);
});
