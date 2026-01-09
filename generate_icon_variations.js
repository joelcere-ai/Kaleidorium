/**
 * Generate Multiple PWA Icon Variations for Review
 * 
 * Creates different icon designs with varying padding and styles
 * so you can review and choose the best one for Kaleidorium
 */

const fs = require('fs');
const path = require('path');

const variations = [
  {
    name: 'elegant-minimal',
    description: 'Minimal padding (15%) - K fills more space',
    safeZonePercent: 0.15,
    fontSizePercent: 0.70,
  },
  {
    name: 'elegant-balanced',
    description: 'Balanced padding (22%) - Recommended',
    safeZonePercent: 0.22,
    fontSizePercent: 0.65,
  },
  {
    name: 'elegant-spacious',
    description: 'Spacious padding (28%) - Very elegant',
    safeZonePercent: 0.28,
    fontSizePercent: 0.60,
  },
  {
    name: 'elegant-ultra-spacious',
    description: 'Ultra spacious padding (35%) - Maximum elegance',
    safeZonePercent: 0.35,
    fontSizePercent: 0.55,
  },
];

function generateIconVariation(size, variation, filename) {
  const safeZone = size * variation.safeZonePercent;
  const iconSize = size - (safeZone * 2);
  const fontSize = iconSize * variation.fontSizePercent;
  const x = size / 2;
  const y = size / 2 + (fontSize * 0.35);
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#000000" rx="${size * 0.2}"/>
  
  <!-- K Letter -->
  <text 
    x="${x}" 
    y="${y}" 
    font-family="Playfair Display, serif" 
    font-size="${fontSize}" 
    font-weight="bold" 
    fill="#FFFFFF" 
    text-anchor="middle" 
    dominant-baseline="middle"
    style="letter-spacing: -0.02em;">
    K
  </text>
</svg>`;

  const outputPath = path.join(__dirname, 'public', 'logos', `${filename}.svg`);
  fs.writeFileSync(outputPath, svg, 'utf8');
}

// Generate variations for both sizes
const sizes = [192, 512];

console.log('\n🎨 Generating PWA Icon Variations for Review\n');

variations.forEach(variation => {
  console.log(`\n📐 ${variation.name}`);
  console.log(`   ${variation.description}`);
  console.log(`   Padding: ${Math.round(variation.safeZonePercent * 100)}%`);
  
  sizes.forEach(size => {
    const filename = `pwa-icon-${size}x${size}-${variation.name}`;
    generateIconVariation(size, variation, filename);
    console.log(`   ✓ Generated ${filename}.svg`);
  });
});

console.log('\n✨ All variations generated!\n');
console.log('📋 Review Process:');
console.log('  1. Check the generated icons in public/logos/');
console.log('  2. Test them on mobile devices (install as PWA)');
console.log('  3. Choose your preferred variation');
console.log('  4. Rename chosen files to pwa-icon-192x192.svg and pwa-icon-512x512.svg');
console.log('  5. Update manifest.json version number\n');


