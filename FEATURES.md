# KinetiqAI - AI-Powered Posture Correction App

## 🎯 Features

### ✅ Live Camera Feed with Real-Time Pose Detection
- Front-facing camera integration using Expo Camera
- Continuous pose detection at 5 FPS for smooth tracking
- Optimized for mobile performance

### ✅ Real-Time Skeleton Overlay
- Visual skeleton overlay using TensorFlow.js Pose Detection
- 13 key body points tracked (nose, shoulders, elbows, wrists, hips, knees, ankles)
- Color-coded feedback (green/yellow/red) based on form quality

### ✅ Posture Correctness Detection
- AI-powered analysis for multiple exercises:
  - **Plank**: Body alignment, hip position, elbow placement, neck position
  - **Squat**: Depth, knee alignment, back angle
  - **Push-Up**: Body line, elbow angle
  - **Lunge**: Knee position, depth
- Exercise-specific form rules and thresholds

### ✅ Movement/Posture Score
- Real-time scoring from 0-100
- Average score calculation across session
- Instant feedback on form quality

### ✅ Visual Feedback (Green/Red Cues)
- **Green**: Perfect form (score ≥ 80)
- **Yellow**: Needs improvement (score 60-79)
- **Red**: Poor form (score < 60)
- Live feedback overlays on camera view

### ✅ AI Explanation of Mistakes
- Detailed mistake identification
- Specific correction instructions
- Context-aware coaching tips
- Example: "Hips are sagging - engage your core"

### ✅ Session Summary
- Comprehensive post-workout summary
- Final score with grade (Excellent/Great/Good/Fair/Needs Work)
- AI-generated performance analysis
- Detailed mistake breakdown
- Duration and exercise type tracking

### ✅ History of Past Sessions
- Persistent storage using AsyncStorage (offline-first)
- Session list with scores and dates
- Statistics dashboard:
  - Total sessions
  - Average score
  - Best score
  - Total training time
- Delete individual sessions or clear all history

### ✅ Offline-First Core Functionality
- All pose detection runs locally on device
- Session history stored in AsyncStorage
- No internet required for core workout features
- TensorFlow.js models loaded once at app start

### ✅ Privacy-by-Default (No Video Storage)
- **Zero video recording or storage**
- Camera frames processed in real-time and discarded
- Only scores and textual feedback saved
- All data stays on device
- No cloud uploads or external data transmission

### ✅ Chatbot Coach (On-Demand Track)
- AI fitness coach available 24/7
- Contextual help based on recent sessions
- Exercise-specific guidance (planks, squats, push-ups, etc.)
- Training schedule recommendations
- Motivation and progress tracking tips
- Quick prompt suggestions

### ✅ Exercise Selection
- 6 pre-configured exercises:
  - Plank (Beginner)
  - Squat (Beginner)
  - Push-Up (Intermediate)
  - Lunge (Intermediate)
  - Forearm Plank (Intermediate)
  - Bodyweight Squat (Beginner)
- Difficulty indicators
- Suggested durations
- Generic posture mode for custom exercises

## 🏗️ Architecture

### Screens
- **HomeScreen**: Main dashboard with quick actions
- **ExerciseSelectionScreen**: Choose workout type
- **LiveWorkoutScreen**: Camera feed + real-time pose detection
- **SessionSummaryScreen**: Post-workout analysis
- **HistoryScreen**: Past session tracking
- **ChatbotCoachScreen**: AI coaching chat

### Services
- **PoseDetectionService**: TensorFlow.js pose detection and analysis
- **StorageService**: AsyncStorage for session persistence

### Navigation
- Stack Navigator for main app flow
- Tab Navigator for bottom navigation
- Deep linking support for session sharing

## 📦 Dependencies

```json
{
  "@tensorflow/tfjs": "^4.22.0",
  "@tensorflow/tfjs-react-native": "^1.0.0",
  "@tensorflow-models/pose-detection": "^2.1.3",
  "expo-camera": "~16.0.10",
  "@react-native-async-storage/async-storage": "^2.1.0",
  "react-native-svg": "^15.8.0",
  "expo-gl": "~15.0.6"
}
```

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Grant camera permissions** when prompted

4. **Select an exercise** from the home screen

5. **Position yourself** so your full body is visible

6. **Press Play** to start real-time pose tracking!

## 💡 Usage Tips

### For Best Results:
- Ensure good lighting
- Position camera to see your full body
- Wear form-fitting clothes for better keypoint detection
- Start with beginner exercises
- Focus on one correction at a time

### Exercise-Specific Tips:
- **Plank**: Side view works best
- **Squat**: Side view required
- **Push-Up**: Side or diagonal angle
- **Lunge**: Side view recommended

## 🔒 Privacy & Security

- ✅ No video recording
- ✅ No cloud storage
- ✅ No account required
- ✅ All processing on-device
- ✅ Session data stored locally only

## 📊 Data Stored Locally

Only the following data is saved to your device:
- Exercise name
- Date and duration
- Average score
- Textual feedback/mistakes
- Session timestamp

**No images, videos, or camera frames are ever saved.**

## 🛠️ Technical Details

### Pose Detection
- **Model**: MoveNet Single Pose Lightning
- **Detection Rate**: 5 FPS (200ms intervals)
- **Keypoints**: 13 body landmarks
- **Confidence Threshold**: 0.3

### Scoring Algorithm
- Starts at 100 points
- Deductions based on form errors:
  - Major alignment issues: -30 points
  - Moderate problems: -20-25 points
  - Minor adjustments: -15 points

## 📱 Platform Support

- ✅ iOS
- ✅ Android
- ⚠️ Web (limited - camera may not work)

## 🤝 Contributing

This is a hackathon project built for Brainwave DTU. Feel free to extend and improve!

## 📄 License

MIT License - Built with ❤️ for Brainwave DTU Hackathon

---

**Built with**: React Native, Expo, TensorFlow.js, TypeScript
