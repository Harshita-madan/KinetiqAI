# How to Use KinetiqAI - Complete Guide

## 🚀 Getting Started

### Step 1: Launch the App
The app is now running! You should see the Expo developer tools in your terminal.

### Step 2: Access the App
- **For Web**: Press `w` in the terminal to open in your browser
- **For Mobile**: Scan the QR code with Expo Go app

## 📱 Navigating the Features

### Home Screen
The Home Screen is your main dashboard with quick access to all features:

1. **Start Training Button** (Hero Card) → Takes you to Exercise Selection
2. **Quick Actions**:
   - Workout → Start a new workout session
   - AI Coach → Chat with the AI fitness coach
   - History → View past workout sessions
   - Stats → See your workout statistics

3. **Features Cards**:
   - Live Posture Check → Real-time pose detection
   - AI Coaching → Get personalized advice
   - Session History → Track your progress
   - Privacy First → Understand data privacy

### 🏋️ Starting a Workout

1. **From Home**: Tap "Start Training" or the Workout quick action
2. **Choose Exercise**: Select from 6 exercises:
   - Plank (Beginner - 30s)
   - Squat (Beginner - 60s)
   - Push-Up (Intermediate - 45s)
   - Lunge (Intermediate - 60s)
   - Forearm Plank (Intermediate - 45s)
   - Bodyweight Squat (Beginner - 60s)
   - Or try "Generic Posture Mode" for custom exercises

3. **Grant Camera Permission**: The app needs camera access for pose detection

4. **Start Workout**:
   - Position yourself so your full body is visible
   - Press the PLAY button to start
   - You'll see:
     - Real-time skeleton overlay (green/yellow/red based on form)
     - Live posture score (0-100)
     - Instant feedback on mistakes
     - Timer showing elapsed time

5. **During Workout**:
   - GREEN skeleton = Perfect form (score ≥ 80)
   - YELLOW skeleton = Needs improvement (score 60-79)
   - RED skeleton = Poor form (score < 60)
   - Read the feedback box for specific corrections

6. **Finish Workout**: Press the STOP button when done

### 📊 Session Summary

After completing a workout, you'll see:
- **Overall Score** with grade (Excellent/Great/Good/Fair/Needs Work)
- **AI Coach Insights** - Personalized feedback on your performance
- **Areas to Improve** - List of specific mistakes detected
- **What You Did Well** - Positive reinforcement
- **Quick Stats** - Score, Duration, Corrections count
- **Actions**:
  - "Try Again" → Return to exercise selection
  - "Ask AI Coach" → Get more detailed advice

### 📜 Viewing History

Access from Home or bottom navigation:
- **Stats Overview**: Total sessions, average score, best score, total time
- **Recent Sessions**: Scrollable list of all workouts
  - Each card shows: Exercise name, date, score, duration, corrections count
  - Tap a session to view its full summary
  - Swipe or tap trash icon to delete individual sessions
- **Clear All** button in header to delete all history

### 💬 AI Chatbot Coach

Access from Home, bottom tabs, or after a workout:
- **Automatic Context**: If coming from a workout, the AI knows your session details
- **Ask Questions**:
  - "How can I improve my plank form?"
  - "What exercises are good for beginners?"
  - "How often should I train?"
  - "Tips for better posture?"
- **Quick Prompts**: Tap suggested questions to get started
- **Real-time Responses**: AI responds with detailed, contextual advice
- Available 24/7 for any fitness questions

### 🧭 Bottom Navigation

- **Home**: Main dashboard
- **Explore**: Discover exercises and tips
- **Chat**: Quick access to AI coach
- **Profile**: User settings and preferences

## 🎯 Feature Details

### Real-Time Pose Detection (MoveNet)
- Uses TensorFlow.js and MoveNet model
- Detects 17 body keypoints
- Updates 5 times per second
- Works offline - no internet required

### Posture Analysis
The AI analyzes your form based on:

**Plank**:
- Body alignment (shoulder-hip-ankle)
- Hip position (not sagging or too high)
- Elbow placement (under shoulders)
- Neck/head position

**Squat**:
- Depth (hips below knees)
- Knee alignment (not past toes)
- Back angle (chest up)

**Push-Up**:
- Body line (straight from head to heels)
- Elbow angle (reaching 90 degrees)

**Lunge**:
- Front knee position (not past toes)
- Depth (90-degree angle)

### Privacy & Data
- ✅ **No video recording or storage**
- ✅ **All processing on-device**
- ✅ **Only scores and text feedback saved**
- ✅ **No cloud uploads**
- ✅ **Complete offline functionality**

## 🔧 Troubleshooting

### Camera Not Working
1. Make sure you granted camera permission
2. Refresh the page (for web)
3. Try a different browser (Chrome recommended)
4. For mobile: Check Expo Go has camera permissions

### Skeleton Not Showing
1. Ensure your full body is visible in the camera
2. Stand 3-6 feet from the camera
3. Make sure there's good lighting
4. Try repositioning so your body is clearly visible

### Low Scores
1. Follow the feedback messages carefully
2. Start with beginner exercises
3. Focus on one correction at a time
4. Ask the AI Coach for specific tips
5. Watch your skeleton overlay - aim for green

### Features Not Accessible
- Make sure you're on the **Home screen** (bottom nav)
- Not in a submenu or different tab
- Try tapping the Home icon in bottom navigation

## 💡 Tips for Best Results

1. **Setup**:
   - Use a device with a good camera
   - Ensure proper lighting
   - Clear space around you
   - Position camera at body level

2. **During Workout**:
   - Start slow - focus on form over speed
   - Watch the skeleton overlay for real-time feedback
   - Make corrections based on the feedback box
   - Breathe properly - don't hold your breath

3. **Progression**:
   - Start with beginner exercises
   - Aim for consistent green scores before advancing
   - Review session summaries to understand patterns
   - Ask the AI Coach for improvement tips
   - Track progress over time in History

## 🎨 Understanding Colors

- **Green (#56E8A0)**: Excellent form - keep it up!
- **Yellow (#E8C956)**: Needs improvement - check feedback
- **Red (#E8569D)**: Poor form - focus on corrections
- **Purple (#7556E8)**: Primary app color
- **Blue (#5694E8)**: Information and stats

## 📝 Next Steps

1. **Complete your first workout** to test all features
2. **Check Session Summary** to see AI insights
3. **View History** to see your data is being saved
4. **Chat with AI Coach** to get personalized tips
5. **Try different exercises** to explore all analysis types

---

**Need Help?** Ask the AI Coach any questions - it's trained to help with:
- Exercise form and technique
- Training schedules and frequency
- Injury prevention
- Motivation and progress tracking
- General fitness advice

Enjoy your journey to better posture and fitness! 💪✨
