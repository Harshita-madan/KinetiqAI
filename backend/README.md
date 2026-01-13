# KinetiqAI Pose Detection Server

Real-time pose detection backend using MediaPipe for the KinetiqAI fitness app.

## Architecture

```
┌──────────────┐    Frame (base64)    ┌──────────────┐
│   Mobile/Web │ ──────────────────→  │   Backend    │
│   App        │                      │  (Python)    │
│              │ ←──────────────────  │  MediaPipe   │
└──────────────┘    Keypoints +       └──────────────┘
                    Analysis
```

## Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the Server

```bash
python pose_server.py
```

The server will start at `http://localhost:8000`

### 3. Configure the App

Update the IP address in `src/services/PoseAPIService.ts` to match your computer's local IP:

```typescript
// For mobile testing, use your computer's IP
return 'http://YOUR_IP_ADDRESS:8000';
```

Find your IP:
- **Windows**: `ipconfig` → look for IPv4 Address
- **Mac/Linux**: `ifconfig` or `ip addr`

## API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### Pose Detection
```
POST /detect
Content-Type: application/json

{
  "image": "<base64_encoded_image>",
  "exercise": "squat"  // squat, plank, lunge, pushup, general
}
```

Returns:
```json
{
  "success": true,
  "poses": [{
    "keypoints": [
      {"x": 0.5, "y": 0.3, "score": 0.95, "name": "nose"},
      ...
    ],
    "score": 0.87
  }],
  "analysis": {
    "score": 85,
    "isCorrect": true,
    "feedback": ["Good squat depth!"],
    "mistakes": [],
    "color": "green",
    "poseClassification": "squat"
  },
  "processingTime": 0.045
}
```

## Supported Exercises

| Exercise | Analysis Checks |
|----------|----------------|
| **Squat** | Knee angle, depth, knee alignment, back position |
| **Plank** | Body alignment, hip position, arm placement |
| **Lunge** | Front knee angle, knee over ankle, torso position |
| **Push-up** | Elbow angle, body alignment, hip position |
| **General** | Basic posture, shoulder alignment |

## Performance

- **Processing time**: ~30-50ms per frame
- **Model**: MediaPipe Pose (Lite) - optimized for speed
- **Supported formats**: JPEG, PNG (base64 encoded)

## API Documentation

Interactive API docs available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Deployment

For production, consider:
1. Use HTTPS
2. Restrict CORS origins
3. Add authentication
4. Deploy on a cloud service (AWS, GCP, Azure)

```bash
# Production start with uvicorn
uvicorn pose_server:app --host 0.0.0.0 --port 8000 --workers 4
```
