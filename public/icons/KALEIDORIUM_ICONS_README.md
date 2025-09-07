# Kaleidorium Text Icons

## 🎯 Overview
This folder contains tools to generate PWA icons with the full "Kaleidorium" text instead of just the "K" logo.

## 🛠️ How to Generate New Icons

### Method 1: HTML Generator (Recommended)
1. Open `generate_kaleidorium_text_icons.html` in your browser
2. Adjust settings if needed:
   - Text: "Kaleidorium" (default)
   - Font Size: 18px (default, scales automatically)
   - Font Weight: Bold (default)
   - Text Color: White (#ffffff)
   - Background: Black (#000000)
   - Corner Radius: 20% (default)
3. Click "Generate All Icons"
4. Click "Download All" to download all required sizes
5. Replace the existing icon files in the `/public/` directory

### Method 2: Python Script
```bash
# Install dependencies first
pip3 install Pillow

# Generate icons
python3 generate_text_icons.py
```

### Method 3: Node.js Script
```bash
# Install dependencies first
npm install canvas

# Generate icons
node generate_text_icons.js
```

## 📱 Icon Sizes Generated

### PWA Icons (in `/public/icons/`)
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### Main App Icons (in `/public/`)
- android-chrome-192x192.png
- android-chrome-512x512.png
- apple-touch-icon.png
- favicon-32x32.png
- favicon-16x16.png

## 🔄 After Generating Icons

1. **Replace the old icons** with the new text-based ones
2. **Clear browser cache** to see the changes
3. **Reinstall the PWA** if you have it installed:
   - Remove from home screen
   - Visit the site and reinstall
4. **Test on different devices** to ensure the text is readable

## 🎨 Design Notes

- **Black background** matches your app's dark theme
- **White text** provides maximum contrast
- **Bold font weight** ensures readability at small sizes
- **Rounded corners** (20%) give a modern PWA appearance
- **Scalable text size** adjusts automatically for each icon size

## 🚀 Next Steps

After generating and installing the new icons:
1. Test your PWA installation process
2. Check how the icons look on different devices
3. Verify the icons appear correctly in:
   - Browser tabs (favicon)
   - Home screen (when installed as PWA)
   - App switcher
   - Splash screen

The animated "Kaleidorium" loading screen will still work as before - these icons are just for the PWA installation and system integration.
