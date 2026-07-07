const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const IMAGE_DIR = path.join(__dirname, "../src/assets/images");
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const JPG_QUALITY = 82;
const WEBP_QUALITY = 80;
const PNG_QUALITY = 85;

function getAllImages(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...getAllImages(fullPath));
        } else if (/\.(jpe?g|png)$/i.test(entry.name)) {
            results.push(fullPath);
        }
    }
    return results;
}

async function optimizeImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const originalSize = fs.statSync(filePath).size;

    try {
        const img = sharp(filePath).rotate(); // auto-rotate from EXIF
        const meta = await img.metadata();

        const needsResize = (meta.width > MAX_WIDTH || meta.height > MAX_HEIGHT);

        let pipeline = sharp(filePath).rotate();
        if (needsResize) {
            pipeline = pipeline.resize(MAX_WIDTH, MAX_HEIGHT, {
                fit: "inside",
                withoutEnlargement: true,
            });
        }

        let outputBuffer;
        if (ext === ".png") {
            outputBuffer = await pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9 }).toBuffer();
        } else {
            outputBuffer = await pipeline.jpeg({ quality: JPG_QUALITY, mozjpeg: true }).toBuffer();
        }

        // Only write if smaller
        if (outputBuffer.length < originalSize) {
            fs.writeFileSync(filePath, outputBuffer);
            const saved = ((originalSize - outputBuffer.length) / 1024).toFixed(0);
            const pct = (((originalSize - outputBuffer.length) / originalSize) * 100).toFixed(0);
            console.log(`✓ ${path.relative(IMAGE_DIR, filePath)} — saved ${saved}KB (${pct}%)`);
        } else {
            console.log(`- ${path.relative(IMAGE_DIR, filePath)} — already optimal`);
        }
    } catch (err) {
        console.error(`✗ ${filePath}: ${err.message}`);
    }
}

async function main() {
    const images = getAllImages(IMAGE_DIR);
    console.log(`Found ${images.length} images to optimize...\n`);

    const totalBefore = images.reduce((sum, f) => sum + fs.statSync(f).size, 0);

    for (const img of images) {
        await optimizeImage(img);
    }

    const totalAfter = images.reduce((sum, f) => sum + fs.statSync(f).size, 0);
    const savedMB = ((totalBefore - totalAfter) / 1024 / 1024).toFixed(1);
    const pct = (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(0);
    console.log(`\nDone! Total saved: ${savedMB}MB (${pct}% reduction)`);
    console.log(`  Before: ${(totalBefore / 1024 / 1024).toFixed(1)}MB → After: ${(totalAfter / 1024 / 1024).toFixed(1)}MB`);
}

main();
