import { createWriteStream } from "fs";
import { stat, readdir, mkdir, rmdir, rm } from "fs/promises";
import path from "path";
import archiver from "archiver";
import crypto, { generateKey } from "crypto";
import { createReadStream } from "fs";
import { spawn } from "child_process";

function zipDir(sourceDir, outPath) {
    return new Promise((resolve, reject) => {
        const output = createWriteStream(outPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => {
            console.log(`✅ Created zip: ${outPath} (${archive.pointer()} bytes)`);
            resolve();
        });

        archive.on("error", (err) => {
            reject(err);
        });

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

async function sha256File(filePath) {
    await stat(filePath); // Ensure file exists
    const hash = crypto.createHash("sha256");
    return new Promise((resolve, reject) => {
        const stream = createReadStream(filePath);
        stream.on("data", (data) => hash.update(data));
        stream.on("end", () => resolve(hash.digest("hex")));
        stream.on("error", (err) => reject(err));
    });
}

async function writeJsonBundle(filePath, jsonObject) {
    return new Promise((resolve, reject) => {
        const jsonString = JSON.stringify(jsonObject, null, 2);
        const writeStream = createWriteStream(filePath);
        writeStream.write(jsonString);
        writeStream.end();
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
    });
}

async function run(command, args) {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, { stdio: "inherit", shell: true });
        proc.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });
        proc.on("error", (err) => {
            reject(err);
        });
    });
}

await mkdir(path.join(process.cwd(), "dist"), { recursive: true });
await mkdir(path.join(process.cwd(), "dist", "zips"), { recursive: true });
console.log('📦 Packaging project...');

const entries = await readdir(path.join(process.cwd(), "dist", "handlers"), { withFileTypes: true });
const handlers = entries.filter((e) => e.isFile() && e.name.endsWith(".js"));

if (handlers.length === 0) {
    console.warn('⚠️  No handler files found in dist/handlers. Skipping packaging.');
} else {
    console.log(`📦 Found ${handlers.length} handler(s). Creating zip packages...`)


    // Process each handler file - create a zip package for each

    const handlerBundles = [];

    for (const handler of handlers) {
        const handlerName = path.basename(handler.name, ".js");
        const handlerDir = path.join(process.cwd(), "dist", "handlers", handlerName);
        const handlerFile = path.join(process.cwd(), "dist", "handlers", handler.name);
        const zipPath = path.join(process.cwd(), "dist", "zips", `${handlerName}.zip`);

        try {
            // Create a temporary directory for the handler
            await mkdir(handlerDir, { recursive: true });
            await mkdir(path.join(handlerDir, "node_modules"), { recursive: true });
            // Copy the handler file to the temporary directory
            await new Promise((resolve, reject) => {
                const readStream = createReadStream(handlerFile);
                const writeStream = createWriteStream(path.join(handlerDir, handler.name));
                readStream.pipe(writeStream);
                writeStream.on("finish", resolve);
                writeStream.on("error", reject);
            });
            // Zip the handler directory
            await zipDir(handlerDir, zipPath);
            // Clean up the temporary directory
            await rm(handlerDir, { recursive: true, force: true });
            // Compute and log the SHA256 hash of the zip file
            const hash = await sha256File(zipPath);
            console.log(`  ✓ Packaged ${handler.name} -> ${zipPath} (SHA256: ${hash})`);
            handlerBundles.push({ name: handler.name, zipPath, hash });
        } catch (err) {
            console.error(`❌ Error packaging ${handler.name}:`, err);
        }
    }

    // Build lambda layers if needed (not implemented here, but could be added similarly by zipping node_modules or shared code)

    await mkdir(path.join(process.cwd(), "dist", "layer", "nodejs"), { recursive: true });
    // Example: zip node_modules for a layer (not implemented here)
    // await zipDir(path.join(process.cwd(), "dist", "node_modules"), path.join(process.cwd(), "dist", "layers", "node_modules.zip"));

    // create a minimal package.json for the layer if needed (not implemented here)
    const layerPkgJsonPath = path.join(process.cwd(), "dist", "layer", "nodejs", "package.json");
    const service = process.env.SERVICE_NAME || "aj-workflow-service";
    const layerPkgJson = {
        name: `${service}-layer`,
        // version: "1.0.0",
        private: true,
        description: `Lambda layer for ${service}`,
        // main: "index.js",
        types: "commonjs",
        dependencies: {
            "aws-sdk": "^2.1350.0",
            "@aws-sdk/client-sfn": "^3.420.0",
            "@aws-sdk/client-sns": "^3.420.0",
            "@aws-sdk/util-dynamodb": "^3.420.0",
            uuid: "^9.0.0",
        }
    };
    await writeJsonBundle(layerPkgJsonPath, layerPkgJson);
    await run("npm", ["install", "--prefix", path.join(process.cwd(), "dist", "layer", "nodejs"), "--omit=dev", "--no-audit", "--no-fund", "aws-sdk", "@aws-sdk/client-sfn", "@aws-sdk/client-sns", "@aws-sdk/util-dynamodb", "uuid"]);

    const layerZipPath = path.join(process.cwd(), "dist", "zips", `${service}-layer.zip`);
    await zipDir(path.join(process.cwd(), "dist", "layer", "nodejs"), layerZipPath);
    const layerHash = await sha256File(layerZipPath);
    console.log(`  ✓ Packaged Lambda layer -> ${layerZipPath} (SHA256: ${layerHash})`);

    const manifest = {
        generatedAt: new Date().toISOString(),
        service,
        handlers: handlerBundles,
        layers: [{
            name: `${service}-layer`,
            zipPath: layerZipPath,
            hash: layerHash
        }]
    };

    await writeJsonBundle(path.join(process.cwd(), "dist", "manifest.json"), manifest);

    console.log('✅ Packaging completed successfully!');
    console.log(`📁 Zip packages located in: dist/zips/`);
}