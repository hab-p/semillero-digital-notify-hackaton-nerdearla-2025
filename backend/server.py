from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Semillero Digital - Classroom Enhancer")

# Add session middleware
app.add_middleware(SessionMiddleware, secret_key=os.environ.get("SESSION_SECRET", "your-secret-key-here"))

# Create a router with the /api prefix  
api_router = APIRouter(prefix="/api")

# Security scheme
security = HTTPBearer(auto_error=False)

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    role: str = Field(default="student")  # student, teacher, coordinator
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Classroom(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    google_classroom_id: str
    name: str
    section: Optional[str] = None
    description: Optional[str] = None
    room: Optional[str] = None
    teacher_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Assignment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    google_assignment_id: str
    classroom_id: str
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    max_points: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudentEnrollment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    classroom_id: str
    enrolled_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Submission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    google_submission_id: str
    assignment_id: str
    student_id: str
    state: str  # CREATED, TURNED_IN, RETURNED, RECLAIMED_BY_STUDENT
    grade: Optional[float] = None
    submitted_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProgressSummary(BaseModel):
    student_id: str
    student_name: str
    student_email: str
    classroom_id: str
    classroom_name: str
    total_assignments: int
    submitted_assignments: int
    graded_assignments: int
    average_grade: Optional[float] = None
    pending_assignments: int
    submission_rate: float

# Helper functions
def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
            elif isinstance(value, dict):
                data[key] = prepare_for_mongo(value)
    return data

def parse_from_mongo(item):
    """Convert ISO strings back to datetime objects from MongoDB"""
    if isinstance(item, dict):
        for key, value in item.items():
            if isinstance(value, str) and key.endswith(('_at', '_date')):
                try:
                    item[key] = datetime.fromisoformat(value)
                except ValueError:
                    pass  # Not a valid ISO datetime
            elif isinstance(value, dict):
                item[key] = parse_from_mongo(value)
    return item

async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = None) -> Optional[User]:
    """Get current user from session token (cookie or header)"""
    session_token = None
    
    # Check cookie first
    if 'session_token' in request.cookies:
        session_token = request.cookies.get('session_token')
    
    # Fallback to Authorization header
    elif credentials:
        session_token = credentials.credentials
    
    if not session_token:
        return None
    
    # Find user session in database
    session = await db.user_sessions.find_one({'session_token': session_token})
    if not session or datetime.now(timezone.utc) > datetime.fromisoformat(session['expires_at']):
        return None
    
    # Get user
    user = await db.users.find_one({'id': session['user_id']})
    return User(**user) if user else None

# Auth Routes
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Process session_id from Emergent Auth"""
    try:
        body = await request.json()
        session_id = body.get('session_id')
        
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id required")
        
        # Call Emergent Auth API
        async with httpx.AsyncClient() as client:
            headers = {'X-Session-ID': session_id}
            auth_response = await client.get(
                'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
                headers=headers
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid session_id")
            
            user_data = auth_response.json()
        
        # Check if user exists, if not create
        existing_user = await db.users.find_one({'email': user_data['email']})
        
        if not existing_user:
            # Create new user with default role
            new_user = User(
                email=user_data['email'],
                name=user_data['name'],
                picture=user_data.get('picture'),
                role="student"  # Default role, can be changed by coordinator
            )
            await db.users.insert_one(prepare_for_mongo(new_user.dict()))
            user = new_user
        else:
            user = User(**existing_user)
        
        # Create session
        session_token = user_data['session_token']
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        user_session = UserSession(
            user_id=user.id,
            session_token=session_token,
            expires_at=expires_at
        )
        
        await db.user_sessions.insert_one(prepare_for_mongo(user_session.dict()))
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            max_age=7 * 24 * 60 * 60,  # 7 days
            httponly=True,
            secure=True,
            samesite="none",
            path="/"
        )
        
        return {"user": user, "message": "Session created successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me", response_model=User)
async def get_me(request: Request, credentials: HTTPAuthorizationCredentials = None):
    """Get current user profile"""
    user = await get_current_user(request, credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, credentials: HTTPAuthorizationCredentials = None):
    """Logout user and clear session"""
    user = await get_current_user(request, credentials)
    if user:
        session_token = request.cookies.get('session_token') or (credentials.credentials if credentials else None)
        if session_token:
            await db.user_sessions.delete_one({'session_token': session_token})
    
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}

# User Management Routes
@api_router.get("/users", response_model=List[User])
async def get_users(request: Request, credentials: HTTPAuthorizationCredentials = None):
    """Get all users (coordinator only)"""
    current_user = await get_current_user(request, credentials)
    if not current_user or current_user.role != "coordinator":
        raise HTTPException(status_code=403, detail="Access denied")
    
    users = await db.users.find().to_list(length=None)
    return [User(**user) for user in users]

@api_router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, request: Request, credentials: HTTPAuthorizationCredentials = None):
    """Update user role (coordinator only)"""
    current_user = await get_current_user(request, credentials)
    if not current_user or current_user.role != "coordinator":
        raise HTTPException(status_code=403, detail="Access denied")
    
    if role not in ["student", "teacher", "coordinator"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one({'id': user_id}, {'$set': {'role': role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Role updated successfully"}

# Dashboard Routes
@api_router.get("/dashboard/progress", response_model=List[ProgressSummary])
async def get_progress_dashboard(request: Request, credentials: HTTPAuthorizationCredentials = None):
    """Get student progress dashboard"""
    current_user = await get_current_user(request, credentials)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Mock data for now - will be replaced with Google Classroom API integration
    mock_progress = [
        ProgressSummary(
            student_id="student1",
            student_name="Juan Pérez",
            student_email="juan.perez@email.com",
            classroom_id="class1",
            classroom_name="Desarrollo Web",
            total_assignments=10,
            submitted_assignments=8,
            graded_assignments=7,
            average_grade=85.5,
            pending_assignments=2,
            submission_rate=0.8
        ),
        ProgressSummary(
            student_id="student2",
            student_name="María García",
            student_email="maria.garcia@email.com",
            classroom_id="class1",
            classroom_name="Desarrollo Web",
            total_assignments=10,
            submitted_assignments=9,
            graded_assignments=8,
            average_grade=92.3,
            pending_assignments=1,
            submission_rate=0.9
        )
    ]
    
    return mock_progress

@api_router.get("/dashboard/metrics")
async def get_metrics_dashboard(request: Request, credentials: HTTPAuthorizationCredentials = None):
    """Get metrics dashboard for coordinators"""
    current_user = await get_current_user(request, credentials)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Mock metrics data
    metrics = {
        "total_students": 45,
        "total_teachers": 5,
        "total_classes": 8,
        "total_assignments": 120,
        "overall_submission_rate": 0.82,
        "average_grade": 87.4,
        "students_at_risk": 8,  # Low submission rate
        "recent_activity": [
            {"type": "assignment_submitted", "student": "Juan Pérez", "assignment": "HTML Básico", "timestamp": "2025-01-27T10:30:00Z"},
            {"type": "assignment_graded", "student": "María García", "assignment": "CSS Grid", "grade": 95, "timestamp": "2025-01-27T09:15:00Z"},
            {"type": "new_assignment", "class": "JavaScript Avanzado", "assignment": "API REST", "timestamp": "2025-01-27T08:00:00Z"}
        ]
    }
    
    return metrics

@api_router.get("/classrooms", response_model=List[Classroom])
async def get_classrooms(request: Request, credentials: HTTPAuthorizationCredentials = None):
    """Get user's classrooms"""
    current_user = await get_current_user(request, credentials)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Mock classroom data
    mock_classrooms = [
        Classroom(
            google_classroom_id="gc_001",
            name="Desarrollo Web Frontend",
            section="A",
            description="Curso de HTML, CSS y JavaScript",
            teacher_id="teacher1"
        ),
        Classroom(
            google_classroom_id="gc_002", 
            name="Backend con Node.js",
            section="B",
            description="APIs REST y bases de datos",
            teacher_id="teacher2"
        )
    ]
    
    return mock_classrooms

# Notification Routes  
@api_router.get("/notifications")
async def get_notifications(request: Request, credentials: HTTPAuthorizationCredentials = None):
    """Get user notifications"""
    current_user = await get_current_user(request, credentials)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Mock notifications
    notifications = [
        {
            "id": "notif1",
            "type": "assignment_due",
            "title": "Tarea pendiente: HTML Básico",
            "message": "La tarea vence mañana a las 23:59",
            "timestamp": "2025-01-27T10:00:00Z",
            "read": False
        },
        {
            "id": "notif2", 
            "type": "grade_published",
            "title": "Calificación publicada: CSS Grid",
            "message": "Has obtenido 95/100 puntos",
            "timestamp": "2025-01-27T09:30:00Z",
            "read": False
        }
    ]
    
    return notifications

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()