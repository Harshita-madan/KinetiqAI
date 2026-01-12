# KinetiqAI Setup Guide

## 📋 Prerequisites
- Node.js 16+ installed
- Expo CLI installed (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or physical device with Expo Go)

## 🚀 Installation Steps

### 1. Install Dependencies
```bash
cd "c:\DOCS\hackathon brainwave dtu\KinetiqAI"
npm install
```

### 2. Start the Development Server
```bash
npm start
```

### 3. Run on Device
- **iOS**: Press `i` in terminal or scan QR code with Camera app
- **Android**: Press `a` in terminal or scan QR code with Expo Go app
- **Web**: Press `w` (limited functionality - camera won't work properly)

## ⚠️ Important Notes

### Camera Permissions
The app will request camera permissions on first launch. You must grant permission to use the posture detection features.

### TensorFlow.js Setup
The pose detection model will download automatically on first run (~10MB). This may take a moment on slower connections.

### Platform-Specific Considerations

#### iOS
- Camera works out of the box
- May need to run `npx pod-install` if you encounter native module errors

#### Android
- Ensure camera permissions are granted in Settings if prompted
- Minimum Android version: 6.0 (API 23)

### Performance Tips
- Close background apps for better frame rate
- Ensure good lighting for optimal pose detection
- Position yourself 6-8 feet from camera
- Wear form-fitting clothes for better keypoint detection

## 🎯 First Time Usage

1. **Launch the app** - You'll see the home screen
2. **Tap "Start Training"** or "Workout" quick action
3. **Select an exercise** (try "Plank" for beginners)
4. **Grant camera permission** when prompted
5. **Position yourself** so your full body is visible
6. **Press the Play button** to start tracking
7. **Follow the real-time feedback** - aim for green!
8. **Press Stop** when done to see your session summary

## 🐛 Troubleshooting

### Camera Not Working
```bash
# Clear cache and restart
npm start -- --clear
```

### Pose Detection Not Initializing
- Check internet connection (needed for first-time model download)
- Restart the app
- Clear app data and try again

### Build Errors
```bash
# Clean install
rm -rf node_modules
rm package-lock.json
npm install
```

### TypeScript Errors
```bash
# Regenerate type definitions
npx expo install --fix
```

## 📱 Testing Features

### ✅ Live Camera Feed
1. Navigate to Exercise Selection
2. Choose any exercise
3. Camera should activate automatically

### ✅ Pose Detection
1. Start a workout
2. Position yourself in frame
3. Look for skeleton overlay on your body

### ✅ Real-Time Scoring
1. During workout, watch the score indicator (top right)
2. Should update every 200ms
3. Color changes: green (good), yellow (fair), red (needs work)

### ✅ Session History
1. Complete a workout session
2. Navigate to History from home screen
3. View past sessions and stats

### ✅ AI Coach
1. Tap "AI Coach" from home screen
2. Ask questions like "How can I improve my plank?"
3. Get instant coaching advice

## 🔧 Development Commands

```bash
# Start development server
npm start

# Start with cache clear
npm start -- --clear

# Run on iOS
npm run ios

# Run on Android
npm run android

# Type check
npx tsc --noEmit

# Build for production
eas build --platform ios
eas build --platform android
```

## 📦 New Files Added

### Services
- `src/services/PoseDetectionService.ts` - TensorFlow pose detection
- `src/services/StorageService.ts` - AsyncStorage persistence
- `src/services/index.ts` - Service exports

### Screens
- `src/screens/ExerciseSelectionScreen.tsx` - Exercise picker
- `src/screens/LiveWorkoutScreen.tsx` - Camera + pose tracking
- `src/screens/SessionSummaryScreen.tsx` - Post-workout analysis
- `src/screens/HistoryScreen.tsx` - Session history
- `src/screens/ChatbotCoachScreen.tsx` - AI coaching chat

### Navigation
- Updated `src/navigation/AppNavigator.tsx` - Added stack navigation

### Documentation
- `FEATURES.md` - Complete feature list and documentation

## 🎨 Customization

### Modify Exercise List
Edit [src/screens/ExerciseSelectionScreen.tsx](src/screens/ExerciseSelectionScreen.tsx#L18) to add/remove exercises

### Adjust Scoring Rules
Modify [src/services/PoseDetectionService.ts](src/services/PoseDetectionService.ts) - see `analyzePlank`, `analyzeSquat`, etc.

### Change Detection Frequency
In [src/screens/LiveWorkoutScreen.tsx](src/screens/LiveWorkoutScreen.tsx), modify the interval:
```typescript
poseIntervalRef.current = setInterval(async () => {
  await detectPose();
}, 200); // Change this value (milliseconds)
```

## 📖 Additional Resources

- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)
- [TensorFlow.js Pose Detection](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection)
- [React Navigation Docs](https://reactnavigation.org/)

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review error messages in the terminal
3. Check Expo Go console logs on device

---

**Happy Training! 💪**
