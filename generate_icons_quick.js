const { createCanvas } = require('canvas');
const fs = require('fs');

function generateKaleidoriumIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    
    // White text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.08}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add subtle shadow
    ctx.shadowColor = 'rgba(255, 255, 255, 0.1)';
    ctx.shadowBlur = size / 48;
    ctx.shadowOffsetY = size / 128;
    
    // Draw "Kaleidorium"
    ctx.fillText('Kaleidorium', size / 2, size / 2);
    
    return canvas.toBuffer('image/png');
}

// Generate Android icons
console.log('Generating Kaleidorium PWA icons...');

try {
    const icon192 = generateKaleidoriumIcon(192);
    const icon512 = generateKaleidoriumIcon(512);
    
    fs.writeFileSync('public/android-chrome-192x192.png', icon192);
    fs.writeFileSync('public/android-chrome-512x512.png', icon512);
    
    console.log('✅ Icons generated successfully!');
    console.log('📱 Now clear your Samsung S22 cache and reinstall the PWA');
} catch (error) {
    console.log('❌ Error:', error.message);
    console.log('💡 Use the HTML generator instead: generate_kaleidorium_text_icons.html');
}
