#!/bin/bash
# Generate app icons from SVG source

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ICONS_DIR="$SCRIPT_DIR/../src-tauri/icons"
SVG_SOURCE="$ICONS_DIR/icon.svg"

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
    echo "Using ImageMagick to generate icons..."

    # PNG icons
    convert -background none "$SVG_SOURCE" -resize 32x32 "$ICONS_DIR/32x32.png"
    convert -background none "$SVG_SOURCE" -resize 128x128 "$ICONS_DIR/128x128.png"
    convert -background none "$SVG_SOURCE" -resize 256x256 "$ICONS_DIR/128x128@2x.png"

    # macOS icns (requires iconutil on macOS)
    if command -v iconutil &> /dev/null; then
        ICONSET="$ICONS_DIR/AppIcon.iconset"
        mkdir -p "$ICONSET"
        convert -background none "$SVG_SOURCE" -resize 16x16 "$ICONSET/icon_16x16.png"
        convert -background none "$SVG_SOURCE" -resize 32x32 "$ICONSET/icon_16x16@2x.png"
        convert -background none "$SVG_SOURCE" -resize 32x32 "$ICONSET/icon_32x32.png"
        convert -background none "$SVG_SOURCE" -resize 64x64 "$ICONSET/icon_32x32@2x.png"
        convert -background none "$SVG_SOURCE" -resize 128x128 "$ICONSET/icon_128x128.png"
        convert -background none "$SVG_SOURCE" -resize 256x256 "$ICONSET/icon_128x128@2x.png"
        convert -background none "$SVG_SOURCE" -resize 256x256 "$ICONSET/icon_256x256.png"
        convert -background none "$SVG_SOURCE" -resize 512x512 "$ICONSET/icon_256x256@2x.png"
        convert -background none "$SVG_SOURCE" -resize 512x512 "$ICONSET/icon_512x512.png"
        convert -background none "$SVG_SOURCE" -resize 1024x1024 "$ICONSET/icon_512x512@2x.png"
        iconutil -c icns "$ICONSET" -o "$ICONS_DIR/icon.icns"
        rm -rf "$ICONSET"
        echo "Generated icon.icns"
    fi

    # Windows ICO
    convert -background none "$SVG_SOURCE" -define icon:auto-resize=256,128,96,64,48,32,16 "$ICONS_DIR/icon.ico"

    echo "Icons generated successfully!"

elif command -v rsvg-convert &> /dev/null; then
    echo "Using rsvg-convert to generate icons..."

    rsvg-convert -w 32 -h 32 "$SVG_SOURCE" -o "$ICONS_DIR/32x32.png"
    rsvg-convert -w 128 -h 128 "$SVG_SOURCE" -o "$ICONS_DIR/128x128.png"
    rsvg-convert -w 256 -h 256 "$SVG_SOURCE" -o "$ICONS_DIR/128x128@2x.png"

    echo "PNG icons generated. ICO and ICNS require additional tools."

else
    echo "No suitable image conversion tool found."
    echo "Please install ImageMagick (convert) or librsvg (rsvg-convert)"
    echo "On Ubuntu/Debian: sudo apt install imagemagick librsvg2-bin"
    echo "On macOS: brew install imagemagick librsvg"
    exit 1
fi
