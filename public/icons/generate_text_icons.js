const fs = require('fs');
const path = require('path');

// Try to use canvas - install with: npm install canvas
let Canvas;
try {
    Canvas = require('canvas');
} catch (e) {
    console.log('Canvas not available. Please install with: npm install canvas');
    console.log('Or use the HTML generator: generate_kaleidorium_text_icons.html');
    process.exit(1);
}

const { createCanvas } = Canvas;

const iconSizes = [
    { size: 72, name: 'icon-72x72.png' },
    { size: 96, name: 'icon-96x96.png' },
    { size: 128, name: 'icon-128x128.png' },
    { size: 144, name: 'icon-144x144.png' },
    { size: 152, name: 'icon-152x152.png' },
    { size: 192, name: 'icon-192x192.png' },
    { size: 384, name: 'icon-384x384.png' },
    { size: 512, name: 'icon-512x512.png' }
];

// Also generate the main PWA icons
const mainIcons = [
    { size: 192, name: '../android-chrome-192x192.png' },
    { size: 512, name: '../android-chrome-512x512.png' },
    { size: 180, name: '../apple-touch-icon.png' },
    { size: 32, name: '../favicon-32x32.png' },
    { size: 16, name: '../favicon-16x16.png' }
];

const allIcons = [...iconSizes, ...mainIcons];

function generateIcon(size, fileName) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Settings
    const text = 'Kaleidorium';
    const backgroundColor = '#000000';
    const textColor = '#ffffff';
    const cornerRadius = 0.2; // 20%
    
    // Calculate font size based on icon size - optimized for Playfair Display
    // For "Kaleidorium" (11 characters), we want it to fit nicely with serif font
    const baseFontSize = size * 0.075; // Adjusted for serif font characteristics
    
    // Create rounded rectangle background
    ctx.fillStyle = backgroundColor;
    const radius = cornerRadius * (size / 2);
    
    // Draw rounded rectangle
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.fill();
    
    // Set text properties - using serif fonts to match logo design
    ctx.fillStyle = textColor;
    ctx.font = `bold ${baseFontSize}px 'Playfair Display', 'Times New Roman', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add subtle text shadow to match the animated loading style
    ctx.shadowColor = 'rgba(255, 255, 255, 0.1)';
    ctx.shadowBlur = size / 48;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = size / 128;
    
    // Draw text
    ctx.fillText(text, size / 2, size / 2);
    
    return canvas;
}

// Add roundRect polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}

function generateAllIcons() {
    console.log('🎨 Generating Kaleidorium text icons...\n');
    
    allIcons.forEach(iconInfo => {
        try {
            const canvas = generateIcon(iconInfo.size, iconInfo.name);
            const buffer = canvas.toBuffer('image/png');
            
            const filePath = path.join(__dirname, iconInfo.name);
            const dir = path.dirname(filePath);
            
            // Ensure directory exists
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, buffer);
            console.log(`✅ Generated: ${iconInfo.name} (${iconInfo.size}x${iconInfo.size})`);
        } catch (error) {
            console.error(`❌ Failed to generate ${iconInfo.name}:`, error.message);
        }
    });
    
    console.log('\n🎉 All icons generated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Check the generated icons in your file explorer');
    console.log('2. Test your PWA to see the new text-based icons');
    console.log('3. Clear browser cache and reinstall PWA if needed');
}

// Run the generator
generateAllIcons();
