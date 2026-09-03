# Q-Control Mobile - Testing Checklist

## Pre-Installation Tests

### Web Testing (Browser)
Run `npm run dev` and test:
- [ ] Login page loads
- [ ] Login form accepts input
- [ ] Dashboard displays after login
- [ ] Bottom navigation tabs highlight correctly
- [ ] Menu drawer opens and closes
- [ ] All buttons are clickable

## Post-Installation Tests (APK on Device)

### 1. Initial Launch
- [ ] App installs successfully
- [ ] App opens without crashing
- [ ] Splash screen displays
- [ ] Login screen appears

### 2. Permission Requests
On first use, you should see permission dialogs:
- [ ] Camera permission requested (when clicking Scan or on first use)
- [ ] Location permission requested (when clicking Checkpoint/SOS or on first use)

✅ **GRANT BOTH PERMISSIONS** for full functionality

### 3. Login Functionality
- [ ] Can type Employee ID
- [ ] Can type PIN (displays as hidden characters)
- [ ] Login button works
- [ ] Successful login shows dashboard
- [ ] User profile displays correctly

### 4. Navigation Tests
Test bottom navigation tabs:
- [ ] **Q-Control tab** - Shows main dashboard (default)
- [ ] **Q-Patrol tab** - Shows toast notification
- [ ] **Instructions tab** - Navigates to instructions page

### 5. Main Action Buttons

#### SCAN Button
- [ ] Click "SCAN" button
- [ ] Navigate to scan page
- [ ] Camera preview appears when clicking "Démarrer le Scan"
- [ ] QR scanner interface is visible
- [ ] Can scan QR codes
- [ ] Scanner stops when clicking "Arrêter le Scan"
- [ ] Back button returns to dashboard

**If scanner doesn't work:**
- Check Settings > Apps > Q-Control > Permissions > Camera is enabled
- Restart the app

#### CHECKPOINT Button
- [ ] Click "CHECKPOINT" button
- [ ] See success toast "✅ Checkpoint enregistré"
- [ ] No errors in console
- [ ] Location is recorded in database

**If checkpoint fails:**
- Check Settings > Apps > Q-Control > Permissions > Location is enabled
- Make sure GPS is enabled on device

### 6. SOS Alert
- [ ] Click red "SOS" button in top bar
- [ ] See toast "🚨 Alerte SOS envoyée!"
- [ ] Alert includes current GPS coordinates
- [ ] Record appears in database

**If SOS fails:**
- Check location permission is granted
- Try moving to an area with better GPS signal

### 7. Menu Drawer
- [ ] Click menu icon (three lines) in top bar
- [ ] Drawer slides in from right
- [ ] Profile info displays correctly
- [ ] Can click "Rapport" - navigates to rapport page
- [ ] Can click "Historique" - shows toast
- [ ] Can click "Checkpoint" - shows toast
- [ ] Night mode toggle works
- [ ] Language selector shows "Français"
- [ ] Close button (X) works
- [ ] Click outside drawer to close

### 8. Dark Mode
- [ ] Toggle Night Mode in menu
- [ ] Interface switches to dark theme
- [ ] Toggle again to return to light theme

### 9. Logout
- [ ] Click "Déconnexion" in menu
- [ ] Returns to login screen
- [ ] Previous session data cleared
- [ ] Need to login again to access dashboard

### 10. Camera Permission Flow
If camera permission is denied:
1. Click SCAN button
2. Click "Démarrer le Scan"
3. Should see warning: "⚠️ Permission caméra refusée"
4. Go to Settings > Apps > Q-Control > Permissions
5. Enable Camera
6. Return to app
7. Try scanning again - should work now

### 11. Location Permission Flow
If location permission is denied:
1. Click CHECKPOINT or SOS
2. Should see error toast about location
3. Go to Settings > Apps > Q-Control > Permissions
4. Enable Location
5. Return to app
6. Try again - should work now

## Database Integration Tests

### Login Test
- [ ] Employee credentials are validated against Supabase
- [ ] Employee presence status updates to "online"
- [ ] User data is stored in localStorage

### Scan Test (with valid patrol point)
- [ ] Scanned patrol point is recorded in `patrol_scans` table
- [ ] Record includes employee_id, patrol_point_id, timestamp
- [ ] Status is set to "completed"

### Checkpoint Test
- [ ] Location is recorded in `employee_location_tracking` table
- [ ] Record includes latitude, longitude, timestamp
- [ ] is_active flag is set to true

### SOS Test
- [ ] Alert is recorded in `sos_alerts` table
- [ ] Includes latitude, longitude, timestamp
- [ ] Status is "Active"
- [ ] Guard name and phone are included

### Logout Test
- [ ] Employee presence status updates to "offline"
- [ ] last_seen timestamp is updated

## Performance Tests

- [ ] App launches in under 3 seconds
- [ ] Navigation is smooth and responsive
- [ ] No lag when switching tabs
- [ ] Camera opens quickly (within 2 seconds)
- [ ] Geolocation captures within 5 seconds
- [ ] UI doesn't freeze during operations

## Error Handling Tests

### Network Errors
- [ ] Disable WiFi/data and try to login - shows error
- [ ] Disable network and try SOS - shows error
- [ ] Re-enable network - app recovers

### Invalid Input
- [ ] Login with wrong credentials - shows error message
- [ ] Leave login fields empty - shows validation error

### Permission Denied
- [ ] Deny camera permission - shows helpful message
- [ ] Deny location permission - shows helpful message

## Platform-Specific Tests

### Android-Specific
- [ ] Back button works properly (closes drawer, goes back)
- [ ] App doesn't crash when rotating device
- [ ] App handles incoming calls gracefully
- [ ] App works on Android 8+ devices

## Common Issues & Quick Fixes

| Issue | Solution |
|-------|----------|
| Scanner shows "Permission denied" | Go to Settings > Apps > Q-Control > Permissions > Enable Camera |
| Checkpoint/SOS fails | Go to Settings > Apps > Q-Control > Permissions > Enable Location |
| Tabs don't respond | Force close and reopen app |
| Login fails | Check internet connection and Supabase credentials |
| App crashes on open | Uninstall and reinstall APK |

## Test Results Summary

**Date Tested:** _______________
**Device:** _______________
**Android Version:** _______________
**APK Version:** _______________

**Overall Result:** ⭐⭐⭐⭐⭐

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________
