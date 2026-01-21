# PWA Icons Guide

This document describes the icons required for the ProDirectory PWA.

## Required Icons

### Standard Icons (already exist)
These icons should already be in `public/icons/`:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

### Maskable Icons (NEW - need to create)
Maskable icons have a "safe zone" in the center (80% of the icon) with important content.
The outer 10% on each side may be cropped on some devices.

Create these maskable icons with extra padding:
- `icon-maskable-192x192.png` (192x192, safe zone: 154x154 centered)
- `icon-maskable-512x512.png` (512x512, safe zone: 410x410 centered)

**Tool:** Use https://maskable.app/editor to create maskable versions.

### Screenshots (NEW - need to create)
Screenshots improve the install experience on Android (Chrome 90+).

- `screenshot-narrow.png` (540x720 - mobile portrait)
  - Shows the app's home screen on mobile
  
- `screenshot-wide.png` (1280x720 - desktop landscape)
  - Shows the app's home screen on desktop

**Tips:**
1. Capture actual screenshots of the running app
2. Use a clean state (no debug tools visible)
3. Ensure good contrast and readable text

## Icon Specifications

### Theme Color
- Primary: `#667eea` (purple-blue gradient start)
- Secondary: `#764ba2` (purple gradient end)

### Design Guidelines
1. Use a simple, recognizable symbol
2. White/light icon on gradient or solid purple background
3. Avoid text in icons (except short app name if needed)
4. Ensure visibility at small sizes (72x72)

## Validation

After adding icons, validate your manifest:
- Chrome DevTools > Application > Manifest
- https://web.dev/add-manifest/
- Lighthouse PWA audit

## Quick Placeholder Generation

If you need placeholders quickly, use these tools:
1. https://realfavicongenerator.net/ - Generates all sizes from one image
2. https://app-manifest.firebaseapp.com/ - Manifest + icons generator
3. https://maskable.app/ - Maskable icon editor
