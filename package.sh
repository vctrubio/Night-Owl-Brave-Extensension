#!/bin/bash

# Package Night Owl Extension for Chrome Web Store

echo "🦉 Packaging Night Owl Tab Manager for Chrome Web Store..."

# Create a clean package directory
rm -rf package/
mkdir package/

# Copy essential files only
cp -r src/ package/
cp -r assets/ package/
cp manifest.json package/
cp README.md package/

# Remove development files from package
rm -f package/STORE_LISTING.md
rm -f package/SUBMISSION_CHECKLIST.md
rm -f package/package.sh

# Create the zip file
cd package/
zip -r ../night-owl-extension-v1.1.0.zip . -x "*.DS_Store*"
cd ..

# Clean up
rm -rf package/

echo "✅ Extension packaged successfully!"
echo "📦 File: night-owl-extension-v1.1.0.zip"
echo "📊 Package contents:"
unzip -l night-owl-extension-v1.1.0.zip

echo ""
echo "🚀 Ready for Chrome Web Store submission!"
echo "📋 Next steps:"
echo "1. Go to https://chrome.google.com/webstore/devconsole"
echo "2. Pay $5 developer registration fee (one-time)"
echo "3. Upload night-owl-extension-v1.1.0.zip"
echo "4. Use content from STORE_LISTING.md for description"
echo "5. Take screenshots of the extension in action"