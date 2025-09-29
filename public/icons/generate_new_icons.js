// Generate new outlined K icons for Kaleidorium
// Run this with: node generate_new_icons.js

const fs = require('fs');
const { createCanvas } = require('canvas');

// Install canvas if not available: npm install canvas

function generateIcon(size, outputPath) {
    // Create canvas
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Settings for outlined K icon
    const text = 'K';
    const fontSize = Math.floor(size * 0.65); // 65% of size - smaller and centered
    const fontWeight = '600'; // Semi-bold
    const textColor = '#000000';
    const backgroundColor = '#ffffff';
    const borderWidth = Math.max(2, Math.floor(size / 64)); // Thin border, scales with size
    const borderColor = '#000000';
    const cornerRadius = Math.floor(size * 0.2); // 20% radius
    
    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, cornerRadius);
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.beginPath();
    ctx.roundRect(borderWidth/2, borderWidth/2, size - borderWidth, size - borderWidth, cornerRadius - borderWidth/2);
    ctx.stroke();
    
    // Set text properties
    ctx.fillStyle = textColor;
    ctx.font = `${fontWeight} ${fontSize}px 'Times New Roman', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text
    ctx.fillText(text, size / 2, size / 2);
    
    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`Generated ${outputPath} (${size}x${size})`);
}

// Generate the required icons
const icons = [
    { size: 192, name: '../android-chrome-192x192.png' },
    { size: 512, name: '../android-chrome-512x512.png' },
    { size: 180, name: '../apple-touch-icon.png' },
    { size: 32, name: '../favicon-32x32.png' },
    { size: 16, name: '../favicon-16x16.png' }
];

console.log('Generating new outlined K icons...');

icons.forEach(icon => {
    generateIcon(icon.size, icon.name);
});

console.log('All icons generated successfully!');
console.log('New icons have white background, thin black outline, and smaller centered K.');
