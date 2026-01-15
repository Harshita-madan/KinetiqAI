# PoseTracker Quick Setup Guide

## Installation

### 1. Install Dependencies
```bash
cd c:\Users\91783\Desktop\hackathon\KinetiqAI
npm install
npx expo install react-native-webview
```

### 2. API Key Configuration
The PoseTracker API key is already configured in `src/screens/LiveWorkoutScreen.tsx`:

```typescript
const POSETRACKER_API_KEY = '218b867b-ee16-42b7-ac31-4fe0cb5fde84';
```

## Running the App

### Mobile (Expo Go)
```bash
npm start
# Then open Expo Go app and scan QR code
# Select iOS or Android simulator
```

### Web
```bash
npm run web
```

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

## Testing the Integration

### Step 1: Start Workout
1. Launch the app
2. Select an exercise (e.g., "Squat")
3. Press the Play button

### Step 2: Position Yourself
1. The PoseTracker WebView will load
2. You'll see the skeleton overlay
3. Follow the positioning instructions on screen

### Step 3: Perform Exercise
1. Once the skeleton turns green, you're ready
2. Perform the exercise
3. Watch the rep counter increment

### Step 4: End Workout
1. Press the Stop button
2. Review your session summary

## Troubleshooting

### WebView shows blank screen
- Check internet connection
- Verify API key is correct
- Check browser console (enable WebView debugging)

### Rep counter not updating
- Ensure camera permission is granted
- Improve lighting conditions
- Position closer to camera
- Check exercise name matches PoseTracker database

### App crashes on startup
- Verify all dependencies are installed: `npm install`
- Clear cache: `npm cache clean --force`
- Reinstall: `rm -rf node_modules && npm install`

## Key Components

### PoseTrackerWebView
Located at: `src/components/PoseTrackerWebView.tsx`

Handles:
- WebView initialization and loading
- Message communication with PoseTracker
- Error handling and retry logic
- Status display (reps, positioning, readiness)

### PoseTrackerService
Located at: `src/services/PoseTrackerService.ts`

Handles:
- API configuration management
- URL construction with query parameters
- JavaScript bridge generation
- Message parsing and processing

### LiveWorkoutScreen
Located at: `src/screens/LiveWorkoutScreen.tsx`

Handles:
- Workout session management
- Timer and rep tracking
- Navigation and screen lifecycle
- Session data persistence

## Architecture Overview

```
┌─────────────────────────────────────┐
│      LiveWorkoutScreen (Wrapper)    │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │  PoseTrackerWebView Component │  │
│  ├───────────────────────────────┤  │
│  │ ┌─────────────────────────┐   │  │
│  │ │  react-native-webview   │   │  │
│  │ │  ↓                      │   │  │
│  │ │  PoseTracker iframe     │   │  │
│  │ │  (Cloud-based)          │   │  │
│  │ └─────────────────────────┘   │  │
│  │                               │  │
│  │  JavaScript Bridge:           │  │
│  │  ─────────────────────        │  │
│  │  WebView ↔ React Native       │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

## API Reference

### PoseTracker Message Types

```typescript
// Rep counter update
{
  type: "counter",
  current_count: 5
}

// Positioning status
{
  ready: false,
  postureDirection: "left"  // Move left to position properly
}

// Form scoring
{
  score: 87,
  confidence: 0.92
}

// Readiness confirmation
{
  ready: true
}
```

## Performance Tips

1. **Optimize Screen Size**
   - Larger screen = faster pose detection
   - Ensure adequate lighting
   - Position camera at optimal distance

2. **Network Optimization**
   - Use 5G or WiFi for better connection
   - Lower latency improves real-time detection
   - Avoid network congestion

3. **Device Performance**
   - Close background apps
   - Ensure sufficient RAM available
   - Use recent device (recommend: 2+ years old)

## Security Considerations

### API Key Protection
Current implementation: Hardcoded in source code

**For Production:**
```typescript
// Option 1: Environment Variables
const POSETRACKER_API_KEY = process.env.POSETRACKER_API_KEY!;

// Option 2: Secure Storage
import * as SecureStore from 'expo-secure-store';
const apiKey = await SecureStore.getItemAsync('POSETRACKER_API_KEY');

// Option 3: Backend Proxy
// Make requests to your backend instead of directly to PoseTracker
```

### Data Privacy
- WebView loads from HTTPS only
- No sensitive user data in WebView
- Session data stored locally only
- No data transmitted to third parties

## Next Steps

1. **Test on Different Exercises**
   - Try different exercise types
   - Test with different difficulty levels
   - Verify accuracy and responsiveness

2. **Customize UI**
   - Adjust colors and styling in theme/colors.ts
   - Modify component layouts in styles
   - Add custom feedback messages

3. **Extend Features**
   - Add multi-session tracking
   - Implement progress analytics
   - Create social sharing features
   - Add custom exercise support

4. **Deploy to Production**
   - Move API key to secure storage
   - Set up error tracking/monitoring
   - Implement analytics
   - Create app store listings

## Resources

- **PoseTracker API Docs:** https://posetracker.gitbook.io/posetracker-api/
- **React Native WebView:** https://github.com/react-native-webview/react-native-webview
- **Expo Documentation:** https://docs.expo.dev/
- **React Native Docs:** https://reactnative.dev/

## Support

For issues or questions:
1. Check the POSETRACKER_INTEGRATION.md file
2. Review the inline code comments
3. Check PoseTracker documentation
4. Test with the official PoseTracker demo

---

**Last Updated:** January 15, 2026
