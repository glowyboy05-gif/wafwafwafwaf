@echo off
REM Q-Control Mobile - Simple APK Build Script (No Pauses)

echo ================================================
echo   Q-Control Mobile - Building APK
echo ================================================
echo.

REM Check for Java
where java >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Java not found! Install from: https://adoptium.net/temurin/releases/
    exit /b 1
)

echo [1/4] Building Next.js...
call npm run build || exit /b 1

echo.
echo [2/4] Syncing Capacitor...
call npx cap sync android || exit /b 1

echo.
echo [3/4] Building APK (this takes 5-10 minutes)...
cd android
call gradlew.bat assembleDebug --no-daemon
set BUILD_RESULT=%ERRORLEVEL%
cd ..

if %BUILD_RESULT% NEQ 0 (
    echo.
    echo BUILD FAILED - Check errors above
    exit /b 1
)

echo.
echo ================================================
echo SUCCESS! APK ready at:
echo android\app\build\outputs\apk\debug\app-debug.apk
echo ================================================
