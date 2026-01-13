"""
KinetiqAI Pose Detection Server
Real-time pose detection using MediaPipe for both web and mobile clients.
"""

import base64
import io
import time
import os
import urllib.request
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from PIL import Image
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

app = FastAPI(title="KinetiqAI Pose Server", version="1.0.0")

# Enable CORS for web and mobile access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Download pose landmarker model if not present
MODEL_PATH = "pose_landmarker_lite.task"
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"

if not os.path.exists(MODEL_PATH):
    print("Downloading pose landmarker model...")
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    print("Model downloaded!")

# Initialize MediaPipe Pose Landmarker (new Tasks API)
base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.PoseLandmarkerOptions(
    base_options=base_options,
    output_segmentation_masks=False,
    min_pose_detection_confidence=0.5,
    min_pose_presence_confidence=0.5,
    min_tracking_confidence=0.5,
    num_poses=1
)
pose_detector = vision.PoseLandmarker.create_from_options(options)

# Keypoint names matching the app's expected format
KEYPOINT_NAMES = [
    'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer',
    'right_eye_inner', 'right_eye', 'right_eye_outer',
    'left_ear', 'right_ear', 'mouth_left', 'mouth_right',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky',
    'left_index', 'right_index', 'left_thumb', 'right_thumb',
    'left_hip', 'right_hip', 'left_knee', 'right_knee',
    'left_ankle', 'right_ankle', 'left_heel', 'right_heel',
    'left_foot_index', 'right_foot_index'
]

# Map MediaPipe landmarks to simplified keypoint names
SIMPLIFIED_KEYPOINTS = {
    0: 'nose',
    2: 'left_eye',
    5: 'right_eye', 
    7: 'left_ear',
    8: 'right_ear',
    11: 'left_shoulder',
    12: 'right_shoulder',
    13: 'left_elbow',
    14: 'right_elbow',
    15: 'left_wrist',
    16: 'right_wrist',
    23: 'left_hip',
    24: 'right_hip',
    25: 'left_knee',
    26: 'right_knee',
    27: 'left_ankle',
    28: 'right_ankle'
}


class Keypoint(BaseModel):
    x: float
    y: float
    score: float
    name: str


class Pose(BaseModel):
    keypoints: List[Keypoint]
    score: float


class PostureAnalysis(BaseModel):
    score: int
    isCorrect: bool
    feedback: List[str]
    mistakes: List[str]
    color: str
    poseClassification: Optional[str] = None


class DetectionRequest(BaseModel):
    image: str  # Base64 encoded image
    exercise: str = "general"


class DetectionResponse(BaseModel):
    success: bool
    poses: List[Pose]
    analysis: PostureAnalysis
    processingTime: float


def decode_base64_image(base64_string: str) -> np.ndarray:
    """Decode base64 image to numpy array."""
    # Remove data URL prefix if present
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    # Decode base64
    image_bytes = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_bytes))
    
    # Convert to RGB if necessary
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Convert to numpy array
    return np.array(image)


def detect_pose(image: np.ndarray) -> Optional[Pose]:
    """Detect pose using MediaPipe Tasks API."""
    # Ensure image is RGB
    if len(image.shape) == 3 and image.shape[2] == 3:
        # Check if BGR (from OpenCV) or RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    else:
        image_rgb = image
    
    # Create MediaPipe Image
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
    
    # Process the image
    results = pose_detector.detect(mp_image)
    
    if not results.pose_landmarks or len(results.pose_landmarks) == 0:
        return None
    
    # Get first pose
    landmarks = results.pose_landmarks[0]
    
    # Extract keypoints
    keypoints = []
    
    for idx, name in SIMPLIFIED_KEYPOINTS.items():
        if idx < len(landmarks):
            landmark = landmarks[idx]
            keypoints.append(Keypoint(
                x=landmark.x,  # Normalized 0-1
                y=landmark.y,  # Normalized 0-1
                score=landmark.visibility if hasattr(landmark, 'visibility') else 0.9,
                name=name
            ))
    
    # Calculate overall pose score
    avg_score = sum(kp.score for kp in keypoints) / len(keypoints) if keypoints else 0
    
    return Pose(keypoints=keypoints, score=avg_score)


def calculate_angle(p1: Keypoint, p2: Keypoint, p3: Keypoint) -> float:
    """Calculate angle between three points."""
    v1 = np.array([p1.x - p2.x, p1.y - p2.y])
    v2 = np.array([p3.x - p2.x, p3.y - p2.y])
    
    cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
    angle = np.arccos(np.clip(cos_angle, -1, 1))
    return np.degrees(angle)


def get_keypoint(keypoints: List[Keypoint], name: str) -> Optional[Keypoint]:
    """Get keypoint by name."""
    for kp in keypoints:
        if kp.name == name:
            return kp
    return None


def analyze_squat(keypoints: List[Keypoint]) -> PostureAnalysis:
    """Analyze squat form."""
    score = 100
    mistakes = []
    feedback = []
    
    left_hip = get_keypoint(keypoints, 'left_hip')
    left_knee = get_keypoint(keypoints, 'left_knee')
    left_ankle = get_keypoint(keypoints, 'left_ankle')
    left_shoulder = get_keypoint(keypoints, 'left_shoulder')
    right_hip = get_keypoint(keypoints, 'right_hip')
    right_knee = get_keypoint(keypoints, 'right_knee')
    
    if left_hip and left_knee and left_ankle:
        # Check knee angle (should be ~90 degrees at bottom of squat)
        knee_angle = calculate_angle(left_hip, left_knee, left_ankle)
        
        if knee_angle > 160:
            feedback.append("Start lowering into the squat")
        elif knee_angle > 120:
            mistakes.append("🟡 Go deeper - aim for thighs parallel to ground")
            score -= 15
        elif knee_angle < 70:
            mistakes.append("🟡 Don't go too deep - maintain control")
            score -= 10
        else:
            feedback.append("✅ Good squat depth!")
        
        # Check if knees go past toes
        if left_knee.x < left_ankle.x - 0.05:
            mistakes.append("🔴 Knees going too far forward - sit back more")
            score -= 20
    
    if left_shoulder and left_hip:
        # Check back angle (should stay relatively upright)
        back_lean = abs(left_shoulder.x - left_hip.x)
        if back_lean > 0.15:
            mistakes.append("🔴 Keep chest up - avoid leaning forward")
            score -= 20
        elif back_lean > 0.08:
            mistakes.append("🟡 Try to maintain more upright torso")
            score -= 10
        else:
            feedback.append("✅ Good chest position!")
    
    if left_knee and right_knee and left_hip and right_hip:
        # Check knee alignment
        knee_width = abs(left_knee.x - right_knee.x)
        hip_width = abs(left_hip.x - right_hip.x)
        if knee_width < hip_width * 0.7:
            mistakes.append("🔴 Knees caving in - push knees out")
            score -= 20
    
    if not mistakes:
        feedback.append("🎯 Perfect squat form!")
    
    color = 'green' if score >= 80 else 'yellow' if score >= 60 else 'red'
    
    return PostureAnalysis(
        score=max(0, score),
        isCorrect=score >= 80,
        feedback=feedback,
        mistakes=mistakes,
        color=color,
        poseClassification="squat"
    )


def analyze_plank(keypoints: List[Keypoint]) -> PostureAnalysis:
    """Analyze plank form."""
    score = 100
    mistakes = []
    feedback = []
    
    left_shoulder = get_keypoint(keypoints, 'left_shoulder')
    left_hip = get_keypoint(keypoints, 'left_hip')
    left_ankle = get_keypoint(keypoints, 'left_ankle')
    left_elbow = get_keypoint(keypoints, 'left_elbow')
    
    if left_shoulder and left_hip and left_ankle:
        # Check body alignment (should be straight line)
        # Calculate deviation from straight line
        expected_hip_y = (left_shoulder.y + left_ankle.y) / 2
        hip_deviation = abs(left_hip.y - expected_hip_y)
        
        if left_hip.y < expected_hip_y - 0.05:
            mistakes.append("🔴 Hips too high - lower them for straight line")
            score -= 25
        elif left_hip.y > expected_hip_y + 0.05:
            mistakes.append("🔴 Hips sagging - engage core and lift hips")
            score -= 25
        else:
            feedback.append("✅ Great body alignment!")
    
    if left_shoulder and left_elbow:
        # Check arm position
        shoulder_elbow_diff = abs(left_shoulder.x - left_elbow.x)
        if shoulder_elbow_diff > 0.1:
            mistakes.append("🟡 Keep elbows directly under shoulders")
            score -= 15
    
    if not mistakes:
        feedback.append("🎯 Perfect plank form!")
    
    color = 'green' if score >= 80 else 'yellow' if score >= 60 else 'red'
    
    return PostureAnalysis(
        score=max(0, score),
        isCorrect=score >= 80,
        feedback=feedback,
        mistakes=mistakes,
        color=color,
        poseClassification="plank"
    )


def analyze_lunge(keypoints: List[Keypoint]) -> PostureAnalysis:
    """Analyze lunge form."""
    score = 100
    mistakes = []
    feedback = []
    
    left_hip = get_keypoint(keypoints, 'left_hip')
    left_knee = get_keypoint(keypoints, 'left_knee')
    left_ankle = get_keypoint(keypoints, 'left_ankle')
    right_knee = get_keypoint(keypoints, 'right_knee')
    left_shoulder = get_keypoint(keypoints, 'left_shoulder')
    
    if left_hip and left_knee and left_ankle:
        # Front knee angle
        knee_angle = calculate_angle(left_hip, left_knee, left_ankle)
        
        if knee_angle < 80:
            mistakes.append("🔴 Front knee too bent - don't let it go past 90°")
            score -= 20
        elif knee_angle > 110:
            mistakes.append("🟡 Go deeper into the lunge")
            score -= 10
        else:
            feedback.append("✅ Good front knee angle!")
    
    if left_knee and left_ankle:
        # Check knee over ankle
        if left_knee.x < left_ankle.x - 0.08:
            mistakes.append("🔴 Front knee going past toes - keep it over ankle")
            score -= 20
    
    if left_shoulder and left_hip:
        # Check torso upright
        torso_lean = abs(left_shoulder.x - left_hip.x)
        if torso_lean > 0.1:
            mistakes.append("🟡 Keep torso upright")
            score -= 15
    
    if not mistakes:
        feedback.append("🎯 Perfect lunge form!")
    
    color = 'green' if score >= 80 else 'yellow' if score >= 60 else 'red'
    
    return PostureAnalysis(
        score=max(0, score),
        isCorrect=score >= 80,
        feedback=feedback,
        mistakes=mistakes,
        color=color,
        poseClassification="lunge"
    )


def analyze_pushup(keypoints: List[Keypoint]) -> PostureAnalysis:
    """Analyze push-up form."""
    score = 100
    mistakes = []
    feedback = []
    
    left_shoulder = get_keypoint(keypoints, 'left_shoulder')
    left_elbow = get_keypoint(keypoints, 'left_elbow')
    left_wrist = get_keypoint(keypoints, 'left_wrist')
    left_hip = get_keypoint(keypoints, 'left_hip')
    left_ankle = get_keypoint(keypoints, 'left_ankle')
    
    if left_shoulder and left_elbow and left_wrist:
        # Check elbow angle
        elbow_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
        
        if elbow_angle > 170:
            feedback.append("Arms extended - ready position")
        elif elbow_angle < 70:
            feedback.append("✅ Good depth on push-up!")
        elif elbow_angle > 120:
            mistakes.append("🟡 Go lower - aim for 90° elbow angle")
            score -= 15
    
    if left_shoulder and left_hip and left_ankle:
        # Check body alignment
        expected_hip_y = (left_shoulder.y + left_ankle.y) / 2
        
        if left_hip.y < expected_hip_y - 0.05:
            mistakes.append("🔴 Hips too high - maintain straight body line")
            score -= 20
        elif left_hip.y > expected_hip_y + 0.05:
            mistakes.append("🔴 Hips sagging - engage core!")
            score -= 25
        else:
            feedback.append("✅ Good body alignment!")
    
    if not mistakes:
        feedback.append("🎯 Perfect push-up form!")
    
    color = 'green' if score >= 80 else 'yellow' if score >= 60 else 'red'
    
    return PostureAnalysis(
        score=max(0, score),
        isCorrect=score >= 80,
        feedback=feedback,
        mistakes=mistakes,
        color=color,
        poseClassification="pushup"
    )


def analyze_general(keypoints: List[Keypoint]) -> PostureAnalysis:
    """General posture analysis."""
    score = 85
    feedback = ["Pose detected successfully"]
    mistakes = []
    
    left_shoulder = get_keypoint(keypoints, 'left_shoulder')
    right_shoulder = get_keypoint(keypoints, 'right_shoulder')
    
    if left_shoulder and right_shoulder:
        shoulder_diff = abs(left_shoulder.y - right_shoulder.y)
        if shoulder_diff > 0.05:
            mistakes.append("🟡 Keep shoulders level")
            score -= 10
    
    color = 'green' if score >= 80 else 'yellow' if score >= 60 else 'red'
    
    return PostureAnalysis(
        score=score,
        isCorrect=score >= 80,
        feedback=feedback,
        mistakes=mistakes,
        color=color,
        poseClassification="general"
    )


def analyze_pose(keypoints: List[Keypoint], exercise: str) -> PostureAnalysis:
    """Analyze pose based on exercise type."""
    exercise_lower = exercise.lower()
    
    if 'squat' in exercise_lower:
        return analyze_squat(keypoints)
    elif 'plank' in exercise_lower:
        return analyze_plank(keypoints)
    elif 'lunge' in exercise_lower:
        return analyze_lunge(keypoints)
    elif 'push' in exercise_lower or 'pushup' in exercise_lower:
        return analyze_pushup(keypoints)
    else:
        return analyze_general(keypoints)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "KinetiqAI Pose Server is running"}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "model": "mediapipe"}


@app.post("/detect", response_model=DetectionResponse)
async def detect_pose_endpoint(request: DetectionRequest):
    """
    Detect pose from base64 encoded image.
    
    - **image**: Base64 encoded image (JPEG or PNG)
    - **exercise**: Exercise type for specific analysis (squat, plank, lunge, pushup, general)
    """
    start_time = time.time()
    
    try:
        # Decode image
        image = decode_base64_image(request.image)
        
        # Detect pose
        pose = detect_pose(image)
        
        if pose is None:
            # No pose detected
            return DetectionResponse(
                success=False,
                poses=[],
                analysis=PostureAnalysis(
                    score=0,
                    isCorrect=False,
                    feedback=["No pose detected - make sure your full body is visible"],
                    mistakes=["Position yourself so camera can see your body"],
                    color="red",
                    poseClassification=None
                ),
                processingTime=time.time() - start_time
            )
        
        # Analyze pose
        analysis = analyze_pose(pose.keypoints, request.exercise)
        
        return DetectionResponse(
            success=True,
            poses=[pose],
            analysis=analysis,
            processingTime=time.time() - start_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.post("/batch-detect")
async def batch_detect(images: List[str], exercise: str = "general"):
    """Detect poses in multiple images (for batch processing)."""
    results = []
    for img in images:
        try:
            request = DetectionRequest(image=img, exercise=exercise)
            result = await detect_pose_endpoint(request)
            results.append(result)
        except Exception as e:
            results.append({"error": str(e)})
    return results


if __name__ == "__main__":
    import uvicorn
    print("Starting KinetiqAI Pose Server...")
    print("Server will be available at http://localhost:8000")
    print("API docs at http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
