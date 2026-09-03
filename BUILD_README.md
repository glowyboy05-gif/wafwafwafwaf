# Building Q-Control Mobile APK

## 🎯 No Android Studio Required!

You have **4 easy ways** to build your APK without installing Android Studio:

---

## ✨ Method 1: Double-Click (Easiest)

**For Windows users:**

1. Find `build-apk.bat` in your project folder
2. Double-click it
3. Wait for the build to complete
4. Find your APK at: `android\app\build\outputs\apk\debug\app-debug.apk`

That's it! 🎉

---

## 🔥 Method 2: PowerShell Script

**Open PowerShell in your project folder and run:**

```powershell
.\build-apk.ps1
```

The script will:
- ✅ Build Next.js app
- ✅ Sync Capacitor
- ✅ Build Android APK
- ✅ Show you where the APK is

---

## ☁️ Method 3: GitHub Actions (Cloud Build)

**No local build needed at all!**

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Ready to build APK"
   git push
   ```

2. Go to your GitHub repository
3. Click **Actions** tab
4. Click **Build Android APK** workflow
5. Click **Run workflow** button
6. Wait 5-10 minutes
7. Download APK from **Artifacts** section

**Advantages:**
- Works on any computer (Windows, Mac, Linux)
- No setup required
- Builds in the cloud
- Free on GitHub

---

## 💻 Method 4: Manual Commands

**If you prefer to run commands yourself:**

```powershell
# Step 1: Build Next.js
npm run build

# Step 2: Sync Capacitor
npx cap sync android

# Step 3: Build APK
cd android
.\gradlew.bat assembleDebug

# Done! APK is at:
# android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 📦 After Building

Your APK will be at:
```
android\app\build\outputs\apk\debug\app-debug.apk
```

**File size:** Usually 15-30 MB

---

## 📱 Installing on Device

### Option A: USB Cable
1. Connect your Android device to computer
2. Enable **USB Debugging** on device
3. Copy APK to device
4. Open APK file on device
5. Tap **Install**

### Option B: File Transfer
1. Copy `app-debug.apk` to your device (via email, cloud storage, etc.)
2. Open the file on your device
3. Tap **Install**
4. If blocked, enable **Install from Unknown Sources**

### Option C: Direct Upload
1. Upload APK to cloud storage (Google Drive, Dropbox, etc.)
2. Download on your Android device
3. Open and install

---

## 🔧 First-Time Setup (One-Time Only)

If this is your first build, make sure you have:

### 1. Node.js
```powershell
node --version
# Should show v18 or higher
```

If not installed: Download from [nodejs.org](https://nodejs.org)

### 2. Java JDK
```powershell
java -version
# Should show version 11 or 17
```

If not installed: Download from [Adoptium](https://adoptium.net/)

### 3. Project Dependencies
```powershell
npm install
```

That's all you need! **No Android Studio required.**

---

## ❓ Troubleshooting

### Problem: "npm: command not found"
**Solution:** Install Node.js from [nodejs.org](https://nodejs.org)

### Problem: "java: command not found"
**Solution:** Install Java JDK from [Adoptium](https://adoptium.net/)

### Problem: "gradlew.bat: command not found"
**Solution:** Make sure you're in the project root folder

### Problem: Build takes too long
**Solution:** First build takes 5-10 minutes. Subsequent builds are faster (2-3 minutes)

### Problem: "Out of memory"
**Solution:** Close other programs and try again

### Problem: Build fails with error
**Solution:** 
```powershell
# Clean and rebuild
cd android
.\gradlew.bat clean
.\gradlew.bat assembleDebug
```

---

## 🚀 Quick Reference

| What | Command |
|------|---------|
| **Build everything** | `.\build-apk.bat` or `.\build-apk.ps1` |
| **Just build Next.js** | `npm run build` |
| **Just build APK** | `cd android; .\gradlew.bat assembleDebug` |
| **Clean build** | `cd android; .\gradlew.bat clean` |
| **Stop Gradle daemon** | `cd android; .\gradlew.bat --stop` |

---

## 📚 More Help

- **Quick Start:** See `QUICK_START.md`
- **Full Build Guide:** See `BUILD_INSTRUCTIONS.md`
- **Testing Guide:** See `TESTING_CHECKLIST.md`
- **What Was Fixed:** See `FIXES_SUMMARY.md`

---

## ✅ Summary

**You don't need Android Studio!** Just:

1. Run `build-apk.bat` (double-click it)
2. Wait for build to complete
3. Get APK from `android\app\build\outputs\apk\debug\app-debug.apk`
4. Install on your device

**Easy!** 🎉
