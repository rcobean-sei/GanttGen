// Fix icon color depth from 16-bit to 8-bit RGBA for Tauri compatibility
const fs = require('fs');
const path = require('path');

// Try to use sharp if available, otherwise use a PNG library
async function convertIcon(inputPath, outputPath) {
    try {
        const sharp = require('sharp');
        await sharp(inputPath)
            .png({ compressionLevel: 9, palette: false })
            .toFile(outputPath + '.tmp');

        // Replace original with converted
        fs.renameSync(outputPath + '.tmp', outputPath);
        console.log(`✓ Converted ${path.basename(inputPath)} to 8-bit RGBA`);
    } catch (error) {
        console.error(`✗ Failed to convert ${path.basename(inputPath)}:`, error.message);
        throw error;
    }
}

async function main() {
    const iconsDir = path.join(__dirname, 'src-tauri', 'icons');
    const pngFiles = [
        '32x32.png',
        '128x128.png',
        '128x128@2x.png'
    ];

    console.log('Converting icons to 8-bit RGBA...\n');

    for (const file of pngFiles) {
        const filePath = path.join(iconsDir, file);
        if (fs.existsSync(filePath)) {
            await convertIcon(filePath, filePath);
        }
    }

    console.log('\n✓ All icons converted successfully!');
}

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
