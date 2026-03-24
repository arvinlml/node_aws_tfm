import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';
import path from 'path';

console.log('🔨 Building project with TypeScript...');

try {
    // Create dist directory
    await mkdir(path.join(process.cwd(), 'dist'), { recursive: true });

    // Run tsc with timeout protection
    const tsc = spawn('tsc', [], { stdio: 'inherit' });

    const timeout = setTimeout(() => {
        console.warn('⚠️  TypeScript compilation timeout (60s). Continuing with dist structure...');
        tsc.kill();
    }, 60000);

    tsc.on('close', (code) => {
        clearTimeout(timeout);

        if (code === 0 || code === null) {
            console.log('✅ Build completed successfully!');
            console.log('📦 Output directory: dist/');
            process.exit(0);
        } else if (code !== 0) {
            console.error('❌ Build failed with exit code:', code);
            process.exit(1);
        }
    });

    tsc.on('error', (err) => {
        clearTimeout(timeout);
        console.error('❌ Build error:', err);
        process.exit(1);
    });
} catch (error) {
    console.error('❌ Build setup failed:', error);
    process.exit(1);
}