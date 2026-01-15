# PoseTracker WebView Integration Guide

## Overview

KinetiqAI has been successfully migrated from native skeleton/pose detection to **PoseTracker WebView integration**. This provides real-time pose detection, exercise tracking, and skeleton overlay entirely through PoseTracker's cloud-based API.

## What Changed

### Removed Components
- ❌ Native TensorFlow.js pose detection (`PoseDetectionService`)
- ❌ Backend pose server integration (`PoseAPIService`)
- ❌ Local skeleton SVG rendering
- ❌ Complex pose angle calculations
- ❌ Simulation mode fallback

### New Components
- ✅ **PoseTrackerWebView** component - Embeds PoseTracker's web interface
- ✅ **PoseTrackerService** - Manages API key, URL building, and message handling
- ✅ **Live WebView communication** - Real-time data exchange between WebView and React Native

## Architecture

```
LiveWorkoutScreen
├── Header (Exercise name, back button)
├── WebView Container
│   └── PoseTrackerWebView
│       ├── WebView (embedded PoseTracker iframe)
│       └── Status Overlay (reps counter, positioning status)
├── Controls (Timer, Play/Stop, Stats)
└── Session Management
```

## Key Features

### 1. **Real-Time Pose Detection**
- Cloud-based pose estimation via PoseTracker
- Skeleton overlay enabled by default
- No local processing required

### 2. **Exercise Tracking**
- Automatic rep counting
- Exercise-specific pose validation
- Real-time form feedback

### 3. **Mobile Optimization**
- Responsive design for phone screens
- Camera permission handling
- Touch-friendly controls

### 4. **Data Communication**
The WebView communicates with React Native using a JavaScript bridge:

```javascript
// PoseTracker sends data like:
{
  type: "counter",
  current_count: 5,
  ready: true,
  score: 87,
  confidence: 0.92
}
```

## Configuration

### API Key
The PoseTracker API key is configured in `LiveWorkoutScreen.tsx`:

```typescript
const POSETRACKER_API_KEY = '218b867b-ee16-42b7-ac31-4fe0cb5fde84';
```

### Difficulty Levels
Choose from three difficulty levels:
- `easy` - Relaxed form requirements
- `medium` - Standard form validation (default)
- `hard` - Strict form validation

### Enabled Features
- ✅ Skeleton overlay
- ✅ Real-time pose detection
- ✅ Rep counting
- ✅ Form scoring
- ✅ Mobile optimization

## Usage

### Starting a Workout

```typescript
// Navigate to LiveWorkoutScreen with exercise data
navigation.navigate('LiveWorkout', {
  exercise: 'squat',
  duration: 300 // seconds
});
```

### Monitoring Workout Progress

The component tracks:
- **Time Elapsed** - Displayed in HH:MM format
- **Rep Count** - Updated in real-time from PoseTracker
- **Detection Status** - Loading, positioning, ready, or error states

### Ending a Workout

Users can end the workout by pressing the Stop button. This:
1. Stops the timer
2. Collects session data (reps, duration, date)
3. Saves to local storage
4. Navigates to SessionSummary screen

## Component API

### PoseTrackerWebView Props

```typescript
interface PoseTrackerWebViewProps {
  exercise: string;                          // Exercise name (e.g., 'squat')
  apiKey: string;                            // PoseTracker API key
  onRepsChange?: (reps: number) => void;     // Callback when rep count changes
  onStatusChange?: (status: string) => void; // Callback for status updates
  onDataReceived?: (data: any) => void;      // Callback for all WebView messages
  difficulty?: 'easy' | 'medium' | 'hard';   // Exercise difficulty level
}
```

### PoseTrackerService Methods

```typescript
// Initialize the service
poseTrackerService.initialize({
  apiKey: '218b867b-ee16-42b7-ac31-4fe0cb5fde84',
  difficulty: 'medium',
  enableSkeleton: true,
});

// Get tracking URL
const url = poseTrackerService.getTrackingUrl(
  'squat',
  screenWidth,
  screenHeight,
  isMobile
);

// Get JavaScript bridge
const bridge = poseTrackerService.getJavaScriptBridge();

// Handle messages
poseTrackerService.onMessage((message) => {
  console.log('Received:', message);
});

// Check if ready
if (poseTrackerService.isReady()) {
  // Ready to use
}

// Reset
poseTrackerService.reset();
```

## URL Structure

The PoseTracker WebView is loaded with the following URL:

```
https://app.posetracker.com/pose_tracker/tracking?
  token=218b867b-ee16-42b7-ac31-4fe0cb5fde84&
  exercise=squat&
  difficulty=medium&
  width=1080&
  height=1920&
  isMobile=true&
  skeleton=true
```

**Query Parameters:**
- `token` - API key for authentication
- `exercise` - Exercise type (e.g., squat, push-up, lunge)
- `difficulty` - Difficulty level (easy, medium, hard)
- `width` - Screen width in pixels
- `height` - Screen height in pixels
- `isMobile` - Boolean indicating if running on mobile
- `skeleton` - Boolean to enable skeleton overlay

## Data Flow

```
User taps Play
    ↓
PoseTrackerWebView initializes
    ↓
WebView loads PoseTracker iframe
    ↓
User positions themselves
    ↓
PoseTracker sends "ready: true" message
    ↓
User performs exercise
    ↓
PoseTracker detects reps, sends "counter" messages
    ↓
React Native updates rep count UI
    ↓
User taps Stop
    ↓
Session data saved
    ↓
Navigate to SessionSummary
```

## Supported Exercises

The following exercises are officially supported by PoseTracker:
- Squat
- Push-up
- Lunge
- Bicep Curl
- Shoulder Press
- Deadlift
- Plank
- Burpee
- Jumping Jack
- Mountain Climber

*Note: Exercise names should match PoseTracker's exercise database.*

## Error Handling

The PoseTrackerWebView component includes comprehensive error handling:

1. **Loading Errors** - Displays retry button
2. **Network Errors** - Shows error message with URL for debugging
3. **Permission Errors** - Requests camera access
4. **Timeout Errors** - Auto-retry with exponential backoff

```typescript
// Error states
if (error) {
  return (
    <View style={styles.errorContainer}>
      <Text>{error}</Text>
      <TouchableOpacity onPress={handleRetry}>
        <Text>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Performance Optimization

### Message Throttling
The WebView sends messages at regular intervals. React Native processes them efficiently using callbacks.

### Lazy Loading
The PoseTrackerWebView only initializes when the workout starts (when user taps Play).

### Memory Management
- WebView is destroyed on screen unmount
- Service is reset on cleanup
- No persistent references to WebView

## Security

### API Key Management
The API key is hardcoded in the source. For production:

```typescript
// Recommended: Use environment variables
const POSETRACKER_API_KEY = process.env.POSETRACKER_API_KEY!;

// Or use secure storage
const apiKey = await SecureStore.getItemAsync('POSETRACKER_API_KEY');
```

### HTTPS Enforcement
All PoseTracker communications use HTTPS exclusively.

## Troubleshooting

### "Cannot find module 'react-native-webview'"
**Solution:** Install the package
```bash
npx expo install react-native-webview
npm install
```

### WebView shows blank screen
**Possible causes:**
- Invalid API key - Verify `POSETRACKER_API_KEY`
- Network issue - Check internet connection
- Exercise name typo - Verify exercise name matches PoseTracker database
- **Solution:** Check browser console logs (enable WebView debugging)

### Rep counter not updating
**Possible causes:**
- Camera not initialized - Grant camera permission
- Poor lighting - Improve lighting conditions
- Incorrect posture - User not in proper starting position
- **Solution:** Position user closer to camera, improve lighting

### "PoseTracker service not initialized"
**Solution:** Ensure `poseTrackerService.initialize()` is called in `useEffect`:
```typescript
useEffect(() => {
  poseTrackerService.initialize({
    apiKey: POSETRACKER_API_KEY,
    difficulty: 'medium',
    enableSkeleton: true,
  });
}, []);
```

## Testing

### Manual Testing Checklist
- [ ] App starts without errors
- [ ] Camera permission prompt appears on first run
- [ ] Pressing Play loads PoseTracker WebView
- [ ] User can position themselves (skeleton visible)
- [ ] Rep counter increments correctly
- [ ] Timer counts up
- [ ] Pressing Stop saves session and navigates to summary
- [ ] Different exercises work correctly
- [ ] Works on both iOS and Android simulators
- [ ] Works on physical devices

### Unit Testing
Services can be tested independently:

```typescript
// Test PoseTrackerService
import { poseTrackerService } from '../services/PoseTrackerService';

describe('PoseTrackerService', () => {
  it('should initialize with correct config', () => {
    poseTrackerService.initialize({
      apiKey: 'test-key',
      difficulty: 'medium',
    });
    expect(poseTrackerService.isReady()).toBe(true);
  });

  it('should generate correct URL', () => {
    const url = poseTrackerService.getTrackingUrl('squat', 1080, 1920, true);
    expect(url).toContain('token=test-key');
    expect(url).toContain('exercise=squat');
  });
});
```

## Migration Notes

### From Old Implementation
The old implementation used:
- TensorFlow.js with MediaPipe for local pose detection
- Backend Python server for advanced analysis
- SVG rendering for skeleton overlay

### New Implementation
- PoseTracker cloud API for all pose detection
- WebView iframe for UI and rendering
- JavaScript bridge for real-time communication

### Benefits
✅ No local processing overhead
✅ Better accuracy from cloud model
✅ Faster deployment and updates
✅ Automatic skeleton rendering
✅ Simplified codebase

### Limitations
- Requires internet connection
- Depends on PoseTracker API availability
- Limited to supported exercises
- No offline mode

## Future Enhancements

1. **Multiple Difficulty Modes** - UI selector for difficulty level
2. **Custom Exercise Creation** - Allow users to create custom exercises
3. **Session Recording** - Video playback of workouts
4. **Advanced Analytics** - Detailed form analysis and trends
5. **Social Features** - Share workouts and compare with friends
6. **Offline Cache** - Cache recent sessions for offline viewing

## Support & Resources

- **PoseTracker Documentation:** https://posetracker.gitbook.io/posetracker-api/
- **React Native WebView:** https://github.com/react-native-webview/react-native-webview
- **Expo Documentation:** https://docs.expo.dev/
- **GitHub Repository:** [KinetiqAI]

## Files Modified/Created

### New Files
- `src/components/PoseTrackerWebView.tsx` - WebView component
- `src/services/PoseTrackerService.ts` - Service for PoseTracker integration
- `docs/POSETRACKER_INTEGRATION.md` - This file

### Modified Files
- `src/screens/LiveWorkoutScreen.tsx` - Replaced with WebView-based implementation
- `src/components/index.ts` - Added PoseTrackerWebView export
- `src/services/index.ts` - Added PoseTrackerService export
- `package.json` - Added react-native-webview dependency

### Backup Files
- `src/screens/LiveWorkoutScreen.tsx.old` - Original implementation backup

## Changelog

### Version 2.0.0 (PoseTracker Integration)
- ✅ Replaced native skeleton rendering with PoseTracker WebView
- ✅ Added real-time rep counting from PoseTracker
- ✅ Integrated exercise tracking and form scoring
- ✅ Simplified codebase by removing pose detection logic
- ✅ Added comprehensive error handling
- ✅ Mobile-optimized UI and controls

## Version History

- **v1.0.0** - Original implementation with TensorFlow.js
- **v2.0.0** - PoseTracker WebView integration (current)

---

**Last Updated:** January 15, 2026
**Maintained By:** KinetiqAI Development Team
