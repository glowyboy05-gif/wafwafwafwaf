@echo off
setlocal enabledelayedexpansion

REM Q-Control Mobile - APK Build Script
REM No Android Studio required!

echo ================================================
echo   Q-Control Mobile - Building APK
echo ================================================
echo.

REM Check for Java
echo Checking for Java...
where java >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ================================================
    echo ERROR: Java JDK is not installed!
    echo ================================================
    echo.
    echo You need Java JDK to build Android APKs.
    echo.
    echo Please install Java JDK 17 from:
    echo https://adoptium.net/temurin/releases/
    echo.
    echo Instructions: See INSTALL_JAVA.md
    echo.
    echo After installing Java:
    echo   1. Restart your computer
    echo   2. Run this script again
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

REM Actually test Java works
java -version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ================================================
    echo ERROR: Java is not configured correctly!
    echo ================================================
    echo.
    echo Java seems to be installed but not working.
    echo.
    echo Please:
    echo   1. Make sure JAVA_HOME is set
    echo   2. Restart your computer
    echo   3. Try again
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo Java is installed: OK
echo.

REM Step 1: Build Next.js
echo [1/4] Building Next.js app...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ================================================
    echo ERROR: Build failed!
    echo ================================================
    echo.
    echo Please check the error messages above.
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo SUCCESS: Next.js build complete
echo.

REM Step 2: Sync Capacitor
echo [2/4] Syncing Capacitor...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ================================================
    echo ERROR: Capacitor sync failed!
    echo ================================================
    echo.
    echo Please check the error messages above.
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo SUCCESS: Capacitor sync complete
echo.

REM Step 3: Build APK
echo [3/4] Building Android APK...
echo This may take 5-10 minutes on first build...
echo.
cd android
call gradlew.bat assembleDebug --no-daemon
set BUILD_RESULT=%ERRORLEVEL%
cd ..

if %BUILD_RESULT% NEQ 0 (
    echo.
    echo ================================================
    echo ERROR: APK build failed!
    echo ================================================
    echo.
    echo Please check the error messages above.
    echo.
    echo Common fixes:
    echo   1. Make sure Java is installed
    echo   2. Try: cd android then gradlew.bat clean
    echo   3. Run this script again
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo SUCCESS: APK build complete
echo.

REM Step 4: Show result
echo ================================================
echo [4/4] BUILD COMPLETED SUCCESSFULLY!
echo ================================================
echo.
echo Your APK is ready at:
echo android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Next steps:
echo   1. Copy app-debug.apk to your Android device
echo   2. Open the file on your device
echo   3. Tap Install
echo   4. Grant Camera and Location permissions
echo.
echo ================================================
echo.
echo Press any key to exit...
pause >nul
exit /b 0
