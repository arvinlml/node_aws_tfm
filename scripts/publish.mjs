import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFile, readdir } from "fs/promises";
import { createReadStream } from "fs";
import { config } from "dotenv";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

config({ path: ".awsenv" }); // Load environment variables from .awsenv file

// Trim whitespace and quotes from environment variables
Object.keys(process.env).forEach(key => {
    if (typeof process.env[key] === 'string') {
        process.env[key] = process.env[key].trim().replace(/^["`']|["`'];?$/g, '');
    }
});

const bucketName = process.env.S3_BUCKET_NAME;
if (!bucketName) {
    console.error("❌ S3_BUCKET_NAME environment variable is not set.");
    process.exit(1);
}

console.log("📦 Publishing packages to AWS S3...");

const env = process.env.NODE_ENV || "dev";
const serviceName = process.env.SERVICE_NAME || "aj-workflow-service";
const version = process.env.GIT_SHA || execSync("git rev-parse --short HEAD").toString().trim();
const region = process.env.AWS_REGION || "us-east-1";
const s3 = new S3Client({ region });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "../dist");
const manifestPath = path.join(distDir, "manifest.json");
const zipsDir = path.join(distDir, "zips");

try {
    // Read manifest
    const manifestData = await readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(manifestData);

    console.log(`📋 Found manifest with ${manifest.handlers.length} handler(s) and ${manifest.layers.length} layer(s)`);

    // Upload handlers
    const zipFiles = await readdir(zipsDir);
    for (const zipFile of zipFiles) {
        const zipPath = path.join(zipsDir, zipFile);
        const s3Key = `${serviceName}/${env}/${version}/${zipFile}`;

        console.log(`📤 Uploading ${zipFile} to S3 bucket: ${bucketName}, key: ${s3Key}...`);

        const fileStream = createReadStream(zipPath);
        await s3.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: s3Key,
                Body: fileStream,
                ContentType: "application/zip",
                Metadata: {
                    "service": serviceName,
                    "version": version,
                    "env": env
                }
            })
        );

        console.log(`✅ Uploaded ${zipFile}`);
    }

    // Upload manifest
    const manifestS3Key = `${serviceName}/${env}/${version}/manifest.json`;
    console.log(`📤 Uploading manifest to S3 bucket: ${bucketName}, key: ${manifestS3Key}...`);

    await s3.send(
        new PutObjectCommand({
            Bucket: bucketName,
            Key: manifestS3Key,
            Body: manifestData,
            ContentType: "application/json",
            Metadata: {
                "service": serviceName,
                "version": version,
                "env": env
            }
        })
    );

    console.log("✅ All packages published successfully!");
    console.log(`📦 Package URL: https://${bucketName}.s3.${region}.amazonaws.com/${serviceName}/${env}/${version}/`);
    process.exit(0);
} catch (error) {
    console.error("❌ Failed to publish packages:", error.message);
    process.exit(1);
}