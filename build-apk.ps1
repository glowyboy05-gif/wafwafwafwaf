#!/usr/bin/env pwsh
# Q-Control Mobile - APK Build Script
# No Android Studio required!

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Q-Control Mobile - Building APK" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check for Java
Write-Host "Checking for Java..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1
    Write-Host "✅ Java is installed" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "  ERROR: Java JDK is not installed!" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "You need Java JDK to build Android APKs." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please install Java JDK 17 from:" -ForegroundColor White
    Write-Host "https://adoptium.net/temurin/releases/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Instructions: See INSTALL_JAVA.md" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installing Java:" -ForegroundColor White
    Write-Host "  1. Restart your computer" -ForegroundColor White
    Write-Host "  2. Run this script again" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Step 1: Build Next.js
Write-Host "[1/4] Building Next.js app..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Next.js build complete" -ForegroundColor Green
Write-Host ""

# Step 2: Sync Capacitor
Write-Host "[2/4] Syncing Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Capacitor sync complete" -ForegroundColor Green
Write-Host ""

# Step 3: Build APK
Write-Host "[3/4] Building Android APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat assembleDebug --no-daemon
$buildResult = $LASTEXITCODE
Set-Location ..

if ($buildResult -ne 0) {
    Write-Host "❌ APK build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ APK build complete" -ForegroundColor Green
Write-Host ""

# Step 4: Show result
Write-Host "[4/4] Build completed successfully! 🎉" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Your APK is ready at:" -ForegroundColor Cyan
Write-Host "   android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor White
Write-Host ""
Write-Host "📱 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Copy app-debug.apk to your Android device" -ForegroundColor White
Write-Host "   2. Open the file on your device" -ForegroundColor White
Write-Host "   3. Tap Install" -ForegroundColor White
Write-Host "   4. Grant Camera and Location permissions" -ForegroundColor White
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan

# Check if APK exists
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Host "APK Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  APK file not found at expected location" -ForegroundColor Yellow
}
