#!/bin/bash

# EAS Build Hook - Copy notification icon to iOS native project
echo "📱 Copying notification icon to iOS project..."

# Path to source notification icon
SOURCE_ICON="$EAS_BUILD_WORKINGDIR/assets/images/notification-icon.png"

# Path to iOS AppIcon.appiconset
IOS_ASSETS_DIR="$EAS_BUILD_WORKINGDIR/ios/AusflugFinder/Images.xcassets"
NOTIFICATION_ICONSET="$IOS_ASSETS_DIR/NotificationIcon.appiconset"

# Check if iOS directory exists (EAS managed workflow)
if [ ! -d "$EAS_BUILD_WORKINGDIR/ios" ]; then
  echo "⚠️  iOS directory not found - generating with expo prebuild..."
  cd "$EAS_BUILD_WORKINGDIR"
  npx expo prebuild --platform ios --clean
fi

# Create NotificationIcon.appiconset directory
mkdir -p "$NOTIFICATION_ICONSET"

# Generate different icon sizes for iOS
# iOS Notification Icon requires: 20x20@2x, 20x20@3x
echo "🖼️  Generating notification icon sizes..."

# Install ImageMagick if not available (EAS workers should have it)
if ! command -v convert &> /dev/null; then
    echo "Installing ImageMagick..."
    brew install imagemagick
fi

# Generate 40x40 (20@2x)
convert "$SOURCE_ICON" -resize 40x40 "$NOTIFICATION_ICONSET/icon-20@2x.png"

# Generate 60x60 (20@3x)
convert "$SOURCE_ICON" -resize 60x60 "$NOTIFICATION_ICONSET/icon-20@3x.png"

# Create Contents.json for the iconset
cat > "$NOTIFICATION_ICONSET/Contents.json" << 'EOF'
{
  "images": [
    {
      "size": "20x20",
      "idiom": "iphone",
      "filename": "icon-20@2x.png",
      "scale": "2x"
    },
    {
      "size": "20x20",
      "idiom": "iphone",
      "filename": "icon-20@3x.png",
      "scale": "3x"
    }
  ],
  "info": {
    "version": 1,
    "author": "xcode"
  }
}
EOF

echo "✅ Notification icon copied and configured!"
