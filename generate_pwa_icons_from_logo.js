/**
 * Generate PWA Icons Using Existing Kaleidorium Logo
 * 
 * Creates PWA icons by embedding the existing logo design
 * on a white background with proper padding
 */

const fs = require('fs');
const path = require('path');

// Read the existing logo file to get its content
function getLogoContent() {
  try {
    // Try to read the desktop logo as a reference
    const logoPath = path.join(__dirname, 'public', 'logos', 'logo-desktop-32x32.svg');
    const logoContent = fs.readFileSync(logoPath, 'utf8');
    
    // Extract the logo content (everything inside the SVG)
    // The logo is likely a base64 image or SVG paths
    return logoContent;
  } catch (error) {
    console.error('Error reading logo file:', error);
    return null;
  }
}

function generatePWAIconFromLogo(size, filename, paddingPercent = 0.20) {
  const padding = size * paddingPercent;
  const logoSize = size - (padding * 2);
  
  // Read the existing logo
  const logoContent = getLogoContent();
  
  if (!logoContent) {
    console.error('Could not read logo file. Creating fallback icon.');
    // Fallback: create a simple icon with the logo path reference
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <!-- White Background -->
  <rect width="${size}" height="${size}" fill="#FFFFFF" rx="${size * 0.2}"/>
  
  <!-- Logo centered with padding -->
  <g transform="translate(${padding}, ${padding}) scale(${logoSize / 32})">
    <image 
      href="/logos/logo-desktop-32x32.svg" 
      width="32" 
      height="32" 
      preserveAspectRatio="xMidYMid meet"
    />
  </g>
</svg>`;
    
    const outputPath = path.join(__dirname, 'public', 'logos', `${filename}.svg`);
    fs.writeFileSync(outputPath, svg, 'utf8');
    return;
  }
  
  // Check if logo is base64 encoded image
  if (logoContent.includes('data:image') || logoContent.includes('base64')) {
    // Extract the base64 data
    const base64Match = logoContent.match(/data:image[^;]+;base64,([^"']+)/);
    if (base64Match) {
      const base64Data = base64Match[1];
      const imageType = logoContent.match(/data:image\/([^;]+)/)?.[1] || 'svg+xml';
      
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <!-- White Background -->
  <rect width="${size}" height="${size}" fill="#FFFFFF" rx="${size * 0.2}"/>
  
  <!-- Logo centered with padding -->
  <image 
    x="${padding}" 
    y="${padding}" 
    width="${logoSize}" 
    height="${logoSize}" 
    href="data:image/${imageType};base64,${base64Data}"
    preserveAspectRatio="xMidYMid meet"
  />
</svg>`;
      
      const outputPath = path.join(__dirname, 'public', 'logos', `${filename}.svg`);
      fs.writeFileSync(outputPath, svg, 'utf8');
      console.log(`✓ Generated ${filename}.svg (${size}x${size}) with logo on white background`);
      return;
    }
  }
  
  // If logo is SVG paths, embed it directly
  // Extract viewBox and content from original logo
  const viewBoxMatch = logoContent.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : `0 0 32 32`;
  
  // Extract the inner content (everything between <svg> tags)
  const innerContentMatch = logoContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  const innerContent = innerContentMatch ? innerContentMatch[1] : logoContent;
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- White Background -->
  <rect width="${size}" height="${size}" fill="#FFFFFF" rx="${size * 0.2}"/>
  
  <!-- Logo centered with padding -->
  <g transform="translate(${padding}, ${padding}) scale(${logoSize / 32})">
    <svg viewBox="${viewBox}" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      ${innerContent}
    </svg>
  </g>
</svg>`;
  
  const outputPath = path.join(__dirname, 'public', 'logos', `${filename}.svg`);
  fs.writeFileSync(outputPath, svg, 'utf8');
  console.log(`✓ Generated ${filename}.svg (${size}x${size}) with logo on white background`);
}

// Generate PWA icons with different padding options
const variations = [
  { padding: 0.15, name: 'minimal' },
  { padding: 0.20, name: 'balanced' },
  { padding: 0.25, name: 'spacious' },
  { padding: 0.30, name: 'ultra-spacious' },
];

console.log('\n🎨 Generating PWA Icons from Existing Kaleidorium Logo\n');
console.log('Using logo from: logo-desktop-32x32.svg');
console.log('Background: White (#FFFFFF)\n');

const sizes = [192, 512];

// Generate main icons with balanced padding (20%)
sizes.forEach(size => {
  generatePWAIconFromLogo(size, `pwa-icon-${size}x${size}`, 0.20);
});

// Generate variations for review
console.log('\n📐 Generating variations for review:\n');
variations.forEach(variation => {
  console.log(`  ${variation.name} (${Math.round(variation.padding * 100)}% padding)`);
  sizes.forEach(size => {
    generatePWAIconFromLogo(size, `pwa-icon-${size}x${size}-${variation.name}`, variation.padding);
  });
});

console.log('\n✨ Icon generation complete!');
console.log('\n📝 Next steps:');
console.log('  1. Review icons in public/logos/');
console.log('  2. Check icon-preview.html to see all variations');
console.log('  3. Test on mobile device');
console.log('  4. Update manifest.json version after finalizing\n');

