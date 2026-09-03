# Install Java JDK for APK Building

## You Need Java to Build Android APKs

The error `JAVA_HOME is not set` means Java JDK is not installed or not configured.

---

## ✅ Quick Fix - Install Java JDK

### Step 1: Download Java JDK 17

**Download from:** https://adoptium.net/temurin/releases/

**Direct link for Windows:**
https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.9%2B9/OpenJDK17U-jdk_x64_windows_hotspot_17.0.9_9.msi

1. Click the link above
2. Download the `.msi` installer
3. Run the installer

### Step 2: Important During Installation

**✅ CHECK THIS BOX:**
- ☑️ **"Set JAVA_HOME variable"**
- ☑️ **"Add to PATH"**

These options will automatically configure Java for you!

### Step 3: Restart Your Computer

After installation, **restart your computer** so the environment variables take effect.

---

## 🔍 Verify Installation

After restarting, open PowerShell and run:

```powershell
java -version
```

You should see something like:
```
openjdk version "17.0.9" 2023-10-17
```

Also check:
```powershell
echo $env:JAVA_HOME
```

Should show the Java installation path, like:
```
C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot
```

---

## 🚀 Then Build Your APK

Once Java is installed and you've restarted:

```powershell
# Try building again
.\build-apk.bat
```

---

## 🛠️ Manual Configuration (If Auto-Setup Didn't Work)

If the installer didn't set JAVA_HOME automatically:

### Option 1: Set via PowerShell (Temporary)
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```

Then try building again.

### Option 2: Set Permanently via System Settings

1. Press `Windows + R`
2. Type: `sysdm.cpl` and press Enter
3. Click **"Advanced"** tab
4. Click **"Environment Variables"** button
5. Under **"System Variables"**, click **"New"**
6. Add:
   - **Variable name:** `JAVA_HOME`
   - **Variable value:** `C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot`
   (or wherever Java is installed)
7. Find **"Path"** in System Variables, click **"Edit"**
8. Click **"New"** and add: `%JAVA_HOME%\bin`
9. Click **OK** on all dialogs
10. **Restart your computer**

---

## 📦 Alternative: Chocolatey (Package Manager)

If you have Chocolatey installed:

```powershell
choco install openjdk17 -y
```

Then restart your computer.

---

## ❓ Troubleshooting

### Issue: "java -version" still doesn't work after install

**Solution:** 
1. Make sure you **restarted your computer**
2. Open a **new** PowerShell window (close old ones)
3. Try `java -version` again

### Issue: JAVA_HOME shows wrong path

**Solution:**
1. Find where Java is actually installed
2. Common locations:
   - `C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot`
   - `C:\Program Files\Java\jdk-17`
   - `C:\Program Files\OpenJDK\jdk-17`
3. Set JAVA_HOME to that path

### Issue: Multiple Java versions installed

**Solution:**
Point JAVA_HOME to JDK 17 (recommended) or JDK 11.

---

## ✅ Quick Summary

1. **Download:** https://adoptium.net/temurin/releases/
2. **Install** with "Set JAVA_HOME" and "Add to PATH" checked
3. **Restart** your computer
4. **Verify:** `java -version`
5. **Build:** `.\build-apk.bat`

---

## 🎯 After Java is Installed

You'll be able to build APKs with:
- `build-apk.bat` (double-click)
- `build-apk.ps1` (PowerShell)
- Manual commands

**Java is required for Android development** - it's a one-time setup!
