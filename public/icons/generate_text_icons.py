#!/usr/bin/env python3
"""
Kaleidorium Text Icon Generator
Generates PWA icons with "Kaleidorium" text instead of just "K"
"""

import os
from PIL import Image, ImageDraw, ImageFont
import sys

# Icon sizes to generate
ICON_SIZES = [
    (72, 'icon-72x72.png'),
    (96, 'icon-96x96.png'),
    (128, 'icon-128x128.png'),
    (144, 'icon-144x144.png'),
    (152, 'icon-152x152.png'),
    (192, 'icon-192x192.png'),
    (384, 'icon-384x384.png'),
    (512, 'icon-512x512.png'),
    (192, '../android-chrome-192x192.png'),
    (512, '../android-chrome-512x512.png'),
    (180, '../apple-touch-icon.png'),
    (32, '../favicon-32x32.png'),
    (16, '../favicon-16x16.png')
]

def create_rounded_rectangle_mask(size, radius):
    """Create a rounded rectangle mask."""
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
    return mask

def generate_icon(size, filename):
    """Generate a single icon with Kaleidorium text."""
    
    # Settings
    text = "Kaleidorium"
    bg_color = (0, 0, 0)  # Black
    text_color = (255, 255, 255)  # White
    corner_radius = int(size * 0.2)  # 20% of size
    
    # Create image
    img = Image.new('RGBA', (size, size), bg_color + (255,))
    draw = ImageDraw.Draw(img)
    
    # Calculate font size - adjust this multiplier as needed
    font_size = max(int(size * 0.08), 8)
    
    # Try to load a good font, fall back to default
    font = None
    font_paths = [
        '/System/Library/Fonts/Helvetica.ttc',  # macOS
        '/Windows/Fonts/arial.ttf',  # Windows
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',  # Linux
        '/System/Library/Fonts/Times.ttc',  # macOS fallback
    ]
    
    for font_path in font_paths:
        try:
            if os.path.exists(font_path):
                font = ImageFont.truetype(font_path, font_size)
                break
        except:
            continue
    
    if font is None:
        try:
            font = ImageFont.load_default()
        except:
            font = ImageFont.load_default()
    
    # Get text dimensions
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Calculate position to center text
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    # Draw text with subtle shadow for better readability
    if size > 32:  # Only add shadow for larger icons
        shadow_offset = max(1, size // 64)
        draw.text((x + shadow_offset, y + shadow_offset), text, 
                 font=font, fill=(0, 0, 0, 128))  # Semi-transparent shadow
    
    # Draw main text
    draw.text((x, y), text, font=font, fill=text_color)
    
    # Apply rounded corners if needed
    if corner_radius > 0:
        mask = create_rounded_rectangle_mask(size, corner_radius)
        img.putalpha(mask)
    
    return img

def main():
    """Generate all icons."""
    print("🎨 Generating Kaleidorium text icons...\n")
    
    # Check if PIL is available
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("❌ PIL (Pillow) is required. Install with: pip install Pillow")
        sys.exit(1)
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    for size, filename in ICON_SIZES:
        try:
            img = generate_icon(size, filename)
            
            # Determine full path
            filepath = os.path.join(script_dir, filename)
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            
            # Save the icon
            img.save(filepath, 'PNG', optimize=True)
            print(f"✅ Generated: {filename} ({size}x{size})")
            
        except Exception as e:
            print(f"❌ Failed to generate {filename}: {str(e)}")
    
    print("\n🎉 All icons generated successfully!")
    print("\n📝 Next steps:")
    print("1. Check the generated icons in your file explorer")
    print("2. Test your PWA to see the new text-based icons")
    print("3. Clear browser cache and reinstall PWA if needed")

if __name__ == "__main__":
    main()
