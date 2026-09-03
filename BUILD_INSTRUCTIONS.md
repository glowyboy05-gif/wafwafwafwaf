# Q-Control Mobile APK Build Instructions

## Fixed Issues ✅

1. **Camera Permission** - Added CAMERA permission to AndroidManifest.xml
2. **Geolocation Permission** - Added ACCESS_FINE_LOCATION and ACCESS_COARSE_LOCATION permissions
3. **QR Code Scanner** - Implemented real camera-based QR scanner using html5-qrcode library
4. **Native APIs** - Using Capacitor's native Geolocation API instead of web APIs
5. **Navigation** - Fixed tab navigation to work properly in APK builds

## Changes Made

### 1. Android Permissions (AndroidManifest.xml)
Added the following permissions:
- `CAMERA` - For QR code scanning
- `ACCESS_FINE_LOCATION` - For accurate geolocation
- `ACCESS_COARSE_LOCATION` - For approximate geolocation
- `ACCESS_NETWORK_STATE` - For network connectivity
- `READ_EXTERNAL_STORAGE` & `WRITE_EXTERNAL_STORAGE` - For file access

### 2. Capacitor Plugins Installed
```bash
npm install @capacitor/camera @capacitor/geolocation @capacitor/app html5-qrcode
```

### 3. Updated Files
- `app/page.tsx` - Using Capacitor Geolocation API
- `app/scan/page.tsx` - Implemented real QR scanner with camera
- `capacitor.config.ts` - Added plugin configurations
- `android/app/src/main/AndroidManifest.xml` - Added all required permissions

## Building the APK (No Android Studio Required!)

### Option 1: GitHub Actions (Easiest - Recommended) ⭐
1. Push your changes to GitHub
2. Go to **Actions** tab
3. Select **Build Android APK** workflow
4. Click **Run workflow** button
5. Wait 5-10 minutes for build to complete
6. Download the APK from **Artifacts** section

**Advantages:**
- No local setup needed
- Builds in the cloud
- Works on any computer (Windows, Mac, Linux)
- Automatic dependency management

### Option 2: Command Line Build (No Android Studio)
```bash
# 1. Build Next.js app
npm run build

# 2. Sync with Capacitor
npx cap sync android

# 3. Build APK using Gradle
cd android
./gradlew assembleDebug

# 4. Find your APK at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

**On Windows, use:**
```powershell
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

**Advantages:**
- Fast builds after first time
- No IDE required
- Full control over build process

### One-Line Build Script
Create a file called `build-apk.ps1` (PowerShell):
```powershell
npm run build; npx cap sync android; cd android; .\gradlew.bat assembleDebug; cd ..; Write-Host "APK built at: android/app/build/outputs/apk/debug/app-debug.apk" -ForegroundColor Green
```

Then just run: `.\build-apk.ps1`

## Testing on Device

1. Install the APK on your Android device
2. **First Launch**: You'll be prompted for Camera and Location permissions
3. **Grant Permissions**:
   - Camera: Required for QR code scanning
   - Location: Required for SOS alerts and checkpoints

### If Permissions Are Denied
Go to: Settings > Apps > Q-Control > Permissions
- Enable Camera
- Enable Location

## Features Working in APK

✅ **Login System** - Employee ID and PIN authentication
✅ **QR Code Scanner** - Real camera-based scanning
✅ **Geolocation** - Native GPS tracking for SOS and checkpoints
✅ **SOS Alerts** - Emergency alerts with current location
✅ **Checkpoints** - Location tracking and recording
✅ **Navigation Tabs** - Bottom navigation works properly
✅ **All Buttons** - Scan, Checkpoint, SOS, Menu buttons functional

## Common Issues & Solutions

### Issue: "Camera permission denied"
**Solution**: Go to app settings and manually enable Camera permission

### Issue: "Geolocation permission denied"
**Solution**: Go to app settings and manually enable Location permission

### Issue: Scanner not opening
**Solution**: 
1. Check if camera permission is granted
2. Restart the app
3. Try clicking "Démarrer le Scan" button again

### Issue: Tabs not working
**Solution**: This is now fixed - tabs use proper state management and onClick handlers

### Issue: Build fails
**Solution**: 
```bash
# Clean and rebuild (no Android Studio needed)
npm run build
npx cap sync android
cd android
.\gradlew.bat clean
.\gradlew.bat assembleDebug
```

**If Gradle daemon issues:**
```bash
cd android
.\gradlew.bat --stop
.\gradlew.bat assembleDebug
```

## Development Workflow (No Android Studio)

1. Make changes to code
2. Test in browser: `npm run dev`
3. Build for production: `npm run build`
4. Sync with Android: `npx cap sync android`
5. Build APK: `cd android; .\gradlew.bat assembleDebug`
6. Test APK on device

## Environment Variables

Make sure you have:
- `.env` - For development
- `.env.production` - For production builds

Both should contain your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

## Support

If you encounter issues:
1. Check the Android logcat in Android Studio
2. Look for console errors in Chrome DevTools (for web testing)
3. Verify all permissions are granted in app settings
4. Try a clean build

## Version Info

- Next.js: 16.3.3
- React: 19
- Capacitor: 8.5.1
- Capacitor Camera: 8.2.4
- Capacitor Geolocation: 8.2.2
- html5-qrcode: Latest
