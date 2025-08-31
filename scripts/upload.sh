#!/bin/bash

echo "🎨 Kaleidorium Artwork Upload"
echo "============================"
echo ""

# Check if arguments are provided
if [ $# -ne 2 ]; then
    echo "❌ Please provide both CSV file and images folder"
    echo ""
    echo "Usage: ./upload.sh your-data.csv your-images-folder"
    echo ""
    echo "Example: ./upload.sh my-artwork.csv ./my-images/"
    echo ""
    exit 1
fi

CSV_FILE=$1
IMAGES_FOLDER=$2

# Check if CSV file exists
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ CSV file '$CSV_FILE' not found"
    echo "Make sure the file exists in the scripts folder"
    exit 1
fi

# Check if images folder exists
if [ ! -d "$IMAGES_FOLDER" ]; then
    echo "❌ Images folder '$IMAGES_FOLDER' not found"
    echo "Make sure the folder exists in the scripts folder"
    exit 1
fi

# Check if .env file exists and has content
if [ ! -f .env ]; then
    echo "❌ Environment file (.env) not found"
    echo "Please run ./setup.sh first"
    exit 1
fi

# Check if .env file has been configured
if grep -q "your_supabase_url_here" .env || grep -q "your_service_role_key_here" .env; then
    echo "❌ Environment file (.env) has not been configured"
    echo ""
    echo "Please edit the .env file and replace:"
    echo "- your_supabase_url_here with your actual Supabase URL"
    echo "- your_service_role_key_here with your actual Service Role Key"
    echo ""
    echo "You can find these in your Supabase project dashboard:"
    echo "- URL: Project Settings > API > Project URL"
    echo "- Service Role Key: Project Settings > API > service_role key"
    exit 1
fi

echo "✅ CSV file found: $CSV_FILE"
echo "✅ Images folder found: $IMAGES_FOLDER"
echo "✅ Environment configured"
echo ""

# Count files in images folder
IMAGE_COUNT=$(find "$IMAGES_FOLDER" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" -o -iname "*.webp" -o -iname "*.avif" \) | wc -l)
echo "📸 Found $IMAGE_COUNT image files in the folder"

# Count lines in CSV (excluding header)
CSV_COUNT=$(($(wc -l < "$CSV_FILE") - 1))
echo "📝 Found $CSV_COUNT entries in CSV file"
echo ""

# Confirm before proceeding
echo "🚀 Ready to upload $CSV_COUNT artworks"
echo ""
read -p "Do you want to continue? (y/N): " confirm

if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    echo "Upload cancelled"
    exit 0
fi

echo ""
echo "🎨 Starting upload process..."
echo "This may take a while for large collections..."
echo ""

# Load environment variables
export $(cat .env | xargs)

# Run the upload script
node bulk-upload-artwork.js "$CSV_FILE" "$IMAGES_FOLDER"

upload_exit_code=$?

echo ""
if [ $upload_exit_code -eq 0 ]; then
    echo "🎉 Upload completed successfully!"
else
    echo "⚠️  Upload completed with some errors"
    echo "Check the output above for details"
fi

echo ""
echo "You can now check your Kaleidorium app to see the uploaded artwork!" 