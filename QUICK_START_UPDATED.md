# Quick Start Guide - Updated Features

## 🎥 Camera & Skeleton Improvements

### What Changed:
1. **Larger Camera Frame**: 75% of screen height (was 60%)
2. **Complete Skeleton**: All MediaPipe connections visible
3. **Better Colors**: Dynamic green/yellow/red based on form
4. **Angle Display**: Shows angles at elbows and knees

## 📊 New UI Elements

### Top-Left: Rep Counter Box
```
┌──────────────────────┐
│ REPS     │ STAGE     │
│  12      │  down     │
└──────────────────────┘
```
- Automatically counts reps for curls, squats, push-ups
- Shows current stage (up/down)

### Top-Right: Score Indicator
```
┌─────────┐
│   85    │
│  Score  │
└─────────┘
```
- Real-time form score (0-100)
- Color changes with performance

### Bottom: Feedback Box
```
┌──────────────────────────────────┐
│ ✓ Perfect form!                  │
│ 🟡 Slight hip sag - engage core  │
└──────────────────────────────────┘
```
- Specific feedback on form
- Up to 2 mistakes shown at once

## 🎯 Scoring System

### How It Works:
1. Start with 100 points
2. Lose points for form mistakes:
   - Major issues: -20 to -30 points
   - Moderate: -10 to -15 points
   - Minor: -5 to -8 points

### Color Indicators:
- **🟢 Green (80-100)**: Excellent form
- **🟡 Yellow (60-79)**: Good, minor adjustments
- **🔴 Red (0-59)**: Needs correction

## 🏋️ Exercise-Specific Scoring

### Squat
- ✓ Proper depth (hips below knees)
- ✓ Knees don't pass toes
- ✓ Chest stays upright
- ✓ Knees track over toes

### Plank
- ✓ Straight body line
- ✓ Hips not sagging
- ✓ Elbows under shoulders
- ✓ Neutral head position

### Push-up
- ✓ Straight body alignment
- ✓ Elbows bend to ~90°
- ✓ Core engaged
- ✓ Proper elbow width

### Bicep Curl
- ✓ Arm fully extends (>160°)
- ✓ Full contraction (<30°)
- ✓ Controlled movement
- Auto rep counting!

## 🔢 Rep Counting

### Supported Exercises:
1. **Bicep Curl**
   - Down: Arm angle >160°
   - Up: Arm angle <30°
   
2. **Squat**
   - Up: Knee angle >160°
   - Down: Knee angle <100°
   
3. **Push-up**
   - Up: Elbow angle >160°
   - Down: Elbow angle <90°

## 📐 Angle Display

### What You'll See:
- Numbers on elbows: e.g., "45°"
- Numbers on knees: e.g., "90°"
- Only shows for high-confidence keypoints
- Helps you understand proper form

### Example Angles:
- **Perfect Squat**: Knee ~90° at bottom
- **Push-up Down**: Elbow ~90°
- **Bicep Curl Peak**: Elbow ~30°
- **Extended Arm**: Elbow ~170-180°

## 🚀 Starting Your Workout

1. **Select Exercise** from home screen
2. **Grant Camera Permission** if prompted
3. **Position Yourself**:
   - Stand 6-8 feet from camera
   - Ensure full body visible
   - Good lighting helps!

4. **Press Play** ▶️ button
5. **Watch for**:
   - Skeleton appears (green = good!)
   - Score displays (aim for 80+)
   - Rep counter starts (if applicable)
   - Angle numbers appear

6. **During Exercise**:
   - Follow real-time feedback
   - Watch score changes
   - Check angle values
   - Count reps automatically

7. **Press Stop** ⏹️ when done
8. **View Summary** with stats

## 💡 Pro Tips

### For Best Results:
- ✅ Wear fitted clothes (better detection)
- ✅ Plain background preferred
- ✅ Good lighting (not backlit)
- ✅ Face camera directly or sideways depending on exercise
- ✅ Full body in frame

### Camera Angles:
- **Squats/Lunges**: Side view
- **Push-ups**: Side view
- **Bicep Curls**: Front view
- **Plank**: Side view

### Understanding Feedback:
- 🔴 Red symbols = fix immediately
- 🟡 Yellow = minor adjustment
- ✓ Green checkmark = perfect!
- 💪 = excellent performance

## 🎨 Visual Guide

### Skeleton Colors:
```
Perfect Form (80-100)
├── Green lines (#4ADE80)
└── Green dots (#22C55E)

Needs Adjustment (60-79)
├── Yellow lines (#FBBF24)
└── Yellow dots (#F59E0B)

Poor Form (0-59)
├── Red lines (#F87171)
└── Red dots (#EF4444)
```

### Rep Counter Colors:
- Background: Orange `#F57510`
- Text: White with bold font
- Labels: Dark semi-transparent

## 📱 Demo Mode

### If Backend Server Not Running:
- App uses simulation mode
- Skeleton still renders
- Scores are estimated
- Rep counting still works
- Perfect for demos!

### To Enable Real Detection:
```bash
cd backend
python pose_server.py
```

## 🎯 Hackathon Demo Points

### Show Judges:
1. **Larger Camera View** - More immersive
2. **Complete Skeleton** - All body connections
3. **Real-time Scoring** - 0-100 with colors
4. **Angle Display** - Educational feedback
5. **Rep Counter** - Automatic counting
6. **Specific Feedback** - Not generic messages
7. **Multiple Exercises** - Different analysis per type

### Key Messages:
- ✅ Accessible to beginners
- ✅ Visual-first feedback
- ✅ No medical advice (preventive only)
- ✅ Works offline (simulation mode)
- ✅ Privacy-first (no video storage)
- ✅ Low-resource friendly

## 🐛 Troubleshooting

### Skeleton Not Appearing?
1. Check camera permissions
2. Ensure good lighting
3. Step back for full body view
4. Try different angles

### Score Always Low?
1. Check exercise-specific requirements
2. Review angle feedback
3. Ensure proper form
4. Read mistake messages

### Rep Counter Not Working?
1. Only works for curl/squat/push-up
2. Full range of motion required
3. Check angle thresholds
4. Perform slowly for accuracy

---

**Ready to Demo! 🚀**

All features working and aligned with hackathon requirements.
