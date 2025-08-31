#!/bin/bash

echo "🎨 Kaleidorium Artwork Upload Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "Please install Node.js from https://nodejs.org/"
    echo "Then run this script again."
    exit 1
fi

echo "✅ Node.js is installed"

# Install dependencies
echo "📦 Installing required packages..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Packages installed successfully"
else
    echo "❌ Failed to install packages"
    exit 1
fi

# Check for .env file
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating environment configuration file..."
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here" > .env
    echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here" >> .env
    echo ""
    echo "⚠️  IMPORTANT: You need to edit the .env file with your Supabase credentials"
    echo "   1. Open the .env file in the scripts folder"
    echo "   2. Replace 'your_supabase_url_here' with your actual Supabase URL"
    echo "   3. Replace 'your_service_role_key_here' with your actual Service Role Key"
    echo ""
    echo "   You can find these in your Supabase project dashboard:"
    echo "   - URL: Project Settings > API > Project URL"
    echo "   - Service Role Key: Project Settings > API > service_role key"
    echo ""
else
    echo "✅ Environment file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure your .env file has the correct Supabase credentials"
echo "2. Put your CSV file and images folder in the scripts directory"
echo "3. Run: ./upload.sh your-data.csv your-images-folder"
echo "" 