import { build } from 'esbuild';
import { readdir, mkdir } from 'fs/promises';
import path from 'path';

console.log('🔨 Building project with esbuild...');

try {
    // Create dist directory
    await mkdir(path.join(process.cwd(), 'dist'), { recursive: true });
    await mkdir(path.join(process.cwd(), 'dist', 'handlers'), { recursive: true });
    await mkdir(path.join(process.cwd(), 'dist', 'services'), { recursive: true });

    // Scan for handler files
    const handlersDir = path.join(process.cwd(), 'src', 'handlers');
    let handlers = [];

    try {
        const entries = await readdir(handlersDir, { withFileTypes: true });
        handlers = entries
            .filter((e) => e.isFile() && e.name.endsWith('.ts'))
            .map((file) => path.join(handlersDir, file.name));
    } catch (err) {
        console.warn('⚠️  No handlers directory found at src/handlers');
    }

    // Scan for service files
    const servicesDir = path.join(process.cwd(), 'src', 'services');
    let services = [];

    try {
        const entries = await readdir(servicesDir, { withFileTypes: true });
        services = entries
            .filter((e) => e.isFile() && e.name.endsWith('.ts'))
            .map((file) => path.join(servicesDir, file.name));
    } catch (err) {
        console.warn('⚠️  No services directory found at src/services');
    }

    if (handlers.length === 0) {
        console.warn('⚠️  No handler files found. Skipping handler bundling.');
    } else {
        console.log(`📦 Found ${handlers.length} handler(s). Bundling with esbuild...`);

        // Bundle each handler
        await Promise.all(
            handlers.map((handlerPath) => {
                return build({
                    entryPoints: [handlerPath],
                    outfile: path.join(process.cwd(), 'dist', 'handlers', `${path.basename(handlerPath, '.ts')}.js`),
                    bundle: true,
                    platform: 'node',
                    target: 'node18',
                    sourcemap: true,
                    format: 'cjs',
                    minify: true,
                    external: ['aws-sdk', '@aws-sdk/*', 'uuid', 'pg']
                });
            })
        );

        console.log('✅ Handlers bundled successfully!');
    }

    if (services.length === 0) {
        console.warn('⚠️  No service files found. Skipping service bundling.');
    } else {
        console.log(`📦 Found ${services.length} service(s). Bundling with esbuild...`);

        // Bundle each service
        await Promise.all(
            services.map((servicePath) => {
                return build({
                    entryPoints: [servicePath],
                    outfile: path.join(process.cwd(), 'dist', 'services', `${path.basename(servicePath, '.ts')}.js`),
                    bundle: true,
                    platform: 'node',
                    target: 'node18',
                    sourcemap: true,
                    format: 'cjs',
                    minify: true,
                    external: ['aws-sdk', '@aws-sdk/*', 'uuid', 'pg']
                });
            })
        );

        console.log('✅ Services bundled successfully!');
    }

    console.log('✅ Build completed successfully!');
    console.log('📦 Output directory: dist/');
    process.exit(0);
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}