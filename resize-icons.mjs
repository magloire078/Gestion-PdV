import sharp from 'sharp';

const source = 'public/icons/icon-512x512.png';

async function generate() {
    console.log('Generating PWA icons...');
    const metadata = await sharp(source).metadata();
    console.log(`Source image dimensions: ${metadata.width}x${metadata.height}`);

    // Ensure 512x512 is actually 512x512
    await sharp(source)
        .resize(512, 512)
        .toFile('public/icons/icon-512x512-fixed.png');

    // Generate 192x192
    await sharp(source)
        .resize(192, 192)
        .toFile('public/icons/icon-192x192.png');

    console.log('Successfully generated icon-192x192.png and icon-512x512-fixed.png');
}

generate().catch(console.error);
