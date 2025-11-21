/**
 * Generate Elegant PWA Icons for Kaleidorium
 * 
 * This script creates PWA icons with:
 * - Better padding (icon doesn't fill entire space)
 * - Elegant proportions suitable for an artistic website
 * - Clean, minimalist design
 * - Proper safe zone for mobile home screens
 */

const fs = require('fs');
const path = require('path');

// Icon configuration
const config = {
  // Safe zone: percentage of icon size to leave as padding
  // For artistic/elegant look, use 20-25% padding
  safeZonePercent: 0.22, // 22% padding on all sides
  
  // Background color
  backgroundColor: '#000000',
  
  // Icon color (the K letter)
  iconColor: '#FFFFFF',
  
  // Font family for the K
  fontFamily: 'Playfair Display, serif',
  
  // Font weight
  fontWeight: 'bold',
};

function generateElegantIcon(size, filename) {
  const safeZone = size * config.safeZonePercent;
  const iconSize = size - (safeZone * 2);
  const fontSize = iconSize * 0.65; // K letter takes 65% of available icon space
  const x = size / 2;
  const y = size / 2 + (fontSize * 0.35); // Vertically centered
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${config.backgroundColor}" rx="${size * 0.2}"/>
  
  <!-- K Letter - Elegant and centered -->
  <text 
    x="${x}" 
    y="${y}" 
    font-family="${config.fontFamily}" 
    font-size="${fontSize}" 
    font-weight="${config.fontWeight}" 
    fill="${config.iconColor}" 
    text-anchor="middle" 
    dominant-baseline="middle"
    style="letter-spacing: -0.02em;">
    K
  </text>
</svg>`;

  const outputPath = path.join(__dirname, 'public', 'logos', `${filename}.svg`);
  fs.writeFileSync(outputPath, svg, 'utf8');
  console.log(`✓ Generated ${filename}.svg (${size}x${size}) with ${Math.round(config.safeZonePercent * 100)}% padding`);
}

// Generate all required PWA icon sizes
const iconSizes = [
  { size: 192, name: 'pwa-icon-192x192' },
  { size: 512, name: 'pwa-icon-512x512' },
];

console.log('\n🎨 Generating Elegant PWA Icons for Kaleidorium\n');
console.log('Configuration:');
console.log(`  - Safe Zone: ${Math.round(config.safeZonePercent * 100)}% padding`);
console.log(`  - Background: ${config.backgroundColor}`);
console.log(`  - Icon Color: ${config.iconColor}`);
console.log(`  - Font: ${config.fontFamily}\n`);

iconSizes.forEach(({ size, name }) => {
  generateElegantIcon(size, name);
});

console.log('\n✨ Icon generation complete!');
console.log('\n📝 Next steps:');
console.log('  1. Review the generated icons in public/logos/');
console.log('  2. Test them on mobile devices');
console.log('  3. Adjust safeZonePercent if needed (currently 22%)');
console.log('  4. Update manifest.json version number after approval\n');

