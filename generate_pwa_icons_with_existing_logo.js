/**
 * Generate PWA Icons Using Existing Kaleidorium Logo
 * 
 * Creates PWA icons by embedding the existing logo SVG
 * on a white background with proper padding
 */

const fs = require('fs');
const path = require('path');

// Read the existing logo file
function getLogoSVG() {
  try {
    // Use the desktop logo as the source
    const logoPath = path.join(__dirname, 'public', 'logos', 'logo-desktop-32x32.svg');
    return fs.readFileSync(logoPath, 'utf8');
  } catch (error) {
    console.error('Error reading logo file:', error);
    return null;
  }
}

function generatePWAIcon(size, filename, paddingPercent = 0.20) {
  const padding = size * paddingPercent;
  const logoSize = size - (padding * 2);
  
  // Read the existing logo
  const logoContent = getLogoSVG();
  
  if (!logoContent) {
    console.error('Could not read logo file.');
    return;
  }
  
  // Extract the logo's inner content (everything inside the SVG tags)
  // The logo might be a complex SVG with paths, or it might reference an image
  const svgMatch = logoContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  
  if (!svgMatch) {
    console.error('Could not parse logo SVG structure.');
    return;
  }
  
  const logoInnerContent = svgMatch[1];
  const viewBoxMatch = logoContent.match(/viewBox=["']([^"']+)["']/i);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 32 32';
  
  // Create the PWA icon with white background and embedded logo
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- White Background -->
  <rect width="${size}" height="${size}" fill="#FFFFFF" rx="${size * 0.2}"/>
  
  <!-- Logo centered with padding -->
  <g transform="translate(${padding}, ${padding}) scale(${logoSize / 32})">
    <svg viewBox="${viewBox}" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      ${logoInnerContent}
    </svg>
  </g>
</svg>`;

  const outputPath = path.join(__dirname, 'public', 'logos', `${filename}.svg`);
  fs.writeFileSync(outputPath, svg, 'utf8');
  console.log(`✓ Generated ${filename}.svg (${size}x${size}) with ${Math.round(paddingPercent * 100)}% padding`);
}

// Generate main PWA icons with balanced padding (20%)
console.log('\n🎨 Generating PWA Icons with Existing Kaleidorium Logo\n');
console.log('Using logo from: logo-desktop-32x32.svg');
console.log('Background: White (#FFFFFF)\n');

const sizes = [192, 512];

// Generate main icons
sizes.forEach(size => {
  generatePWAIcon(size, `pwa-icon-${size}x${size}`, 0.20);
});

// Generate variations for review
const variations = [
  { padding: 0.15, name: 'minimal' },
  { padding: 0.20, name: 'balanced' },
  { padding: 0.25, name: 'spacious' },
  { padding: 0.30, name: 'ultra-spacious' },
];

console.log('\n📐 Generating variations for review:\n');
variations.forEach(variation => {
  console.log(`  ${variation.name} (${Math.round(variation.padding * 100)}% padding)`);
  sizes.forEach(size => {
    generatePWAIcon(size, `pwa-icon-${size}x${size}-${variation.name}`, variation.padding);
  });
});

console.log('\n✨ Icon generation complete!');
console.log('\n📝 Next steps:');
console.log('  1. Review icons in public/logos/');
console.log('  2. Check icon-preview.html to see all variations');
console.log('  3. Test on mobile device');
console.log('  4. Update manifest.json version after finalizing\n');


