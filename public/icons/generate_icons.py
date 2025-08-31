#!/usr/bin/env python3
"""
Generate Kaleidorium PWA icons with transparent rounded corners
Requires: pip install Pillow cairosvg
"""

import os
from PIL import Image, ImageDraw
import cairosvg
import io

def create_rounded_icon(size):
    """Create a rounded icon at the specified size"""
    
    # Convert SVG to PNG at the desired size
    try:
        png_data = cairosvg.svg2png(
            url="kaleidorium-icon.svg",
            output_width=size,
            output_height=size
        )
    except:
        print(f"Error: Could not convert SVG. Please install cairosvg: pip install cairosvg")
        return None
    
    # Open the PNG data as a PIL image
    img = Image.open(io.BytesIO(png_data)).convert("RGBA")
    
    # Create a mask for rounded corners
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    
    # Calculate radius (20% of size for nice rounded corners)
    radius = size // 5
    
    # Draw rounded rectangle mask
    mask_draw.rounded_rectangle(
        [(0, 0), (size, size)], 
        radius=radius, 
        fill=255
    )
    
    # Apply the mask to make corners transparent
    img.putalpha(mask)
    
    return img

def generate_all_sizes():
    """Generate all required PWA icon sizes"""
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    print("Generating Kaleidorium PWA icons with transparent rounded corners...")
    
    for size in sizes:
        print(f"Generating {size}x{size}...")
        icon = create_rounded_icon(size)
        
        if icon:
            filename = f"icon-{size}x{size}.png"
            icon.save(filename, "PNG")
            print(f"✅ Created {filename}")
        else:
            print(f"❌ Failed to create {size}x{size} icon")
    
    print("\n🎉 Icon generation complete!")
    print("Icons now have transparent rounded corners perfect for mobile home screens.")

if __name__ == "__main__":
    # Check if required modules are available
    try:
        import cairosvg
        from PIL import Image, ImageDraw
        generate_all_sizes()
    except ImportError as e:
        print(f"Missing required module: {e}")
        print("Please install required packages:")
        print("pip install Pillow cairosvg") 