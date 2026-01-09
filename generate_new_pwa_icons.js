const fs = require('fs');
const path = require('path');

// Create a simple script to generate the new PWA icons
// This will create icons with white background, black border, and centered K

function generateIcon(size, filename) {
  // Create SVG content for the icon
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="white" stroke="black" stroke-width="${Math.max(2, size/64)}" rx="${size/8}"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" 
        font-family="serif" font-size="${size * 0.6}" font-weight="600" fill="black">K</text>
</svg>`;

  // Write SVG to file
  const svgPath = path.join(__dirname, 'public', 'icons', `${filename}.svg`);
  fs.writeFileSync(svgPath, svg);
  
  console.log(`Generated ${filename}.svg (${size}x${size})`);
}

// Generate all required PWA icon sizes
const iconSizes = [
  { size: 16, name: 'favicon-16x16' },
  { size: 32, name: 'favicon-32x32' },
  { size: 180, name: 'apple-touch-icon' },
  { size: 192, name: 'android-chrome-192x192' },
  { size: 512, name: 'android-chrome-512x512' }
];

console.log('Generating new PWA icons with K design...');

iconSizes.forEach(({ size, name }) => {
  generateIcon(size, name);
});

console.log('✅ All PWA icons generated successfully!');
console.log('Note: These are SVG files. For production, convert them to PNG using the HTML generator.');


