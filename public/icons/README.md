# Kaleidorium PWA Icons

This directory contains the Progressive Web App icons for Kaleidorium.

## Icon Design
- **Background**: Black (#000000)
- **Letter**: White "K" in Playfair Display serif font
- **Style**: Elegant and minimalist

## Required Sizes
The following PNG files need to be generated from the base SVG:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png (Apple Touch Icon)
- icon-192x192.png (Android Chrome)
- icon-384x384.png
- icon-512x512.png (Splash screen)

## How to Generate Icons with Transparent Rounded Corners

### Method 1: Browser-Based Generator (Easiest)
1. Open `generate_icons.html` in any modern web browser
2. Click "Generate All Icons" to create all sizes
3. Click "Download All" to save all PNG files
4. Or click individual icons to download specific sizes

### Method 2: Python Script (Advanced)
1. Install required packages: `pip install Pillow cairosvg`
2. Run: `python3 generate_icons.py`
3. All PNG files will be generated in the current directory

### Method 3: Online Tools
- Upload the SVG to realfavicongenerator.net
- Use Figma, Sketch, or Adobe Illustrator to export PNG files

## Key Features
✅ **Transparent rounded corners** - Perfect for mobile home screens  
✅ **Clean white K letter** - Maintains crisp appearance at all sizes  
✅ **Black background** - Matches Kaleidorium branding  
✅ **All PWA sizes** - 72px to 512px covered  

The generated icons will have transparent corners that allow the mobile OS to apply its own rounded corner style, creating a perfect native app appearance. 