'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const desktopRoot = __dirname;
const sourceSvg = path.join(desktopRoot, 'payload', 'site', 'favicon.svg');
const buildDir = path.join(desktopRoot, 'build');
const buildIcon = path.join(buildDir, 'icon.png');
const runtimeIcon = path.join(desktopRoot, 'payload', 'icon.png');

async function main() {
    if (!fs.existsSync(sourceSvg)) {
        throw new Error(`Platform icon not found: ${sourceSvg}`);
    }

    fs.mkdirSync(buildDir, { recursive: true });
    fs.mkdirSync(path.dirname(runtimeIcon), { recursive: true });

    await sharp(sourceSvg, { density: 384 })
        .resize(512, 512, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(buildIcon);

    fs.copyFileSync(buildIcon, runtimeIcon);
    console.log(`Desktop platform icon generated from ${sourceSvg}`);
}

main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
});
