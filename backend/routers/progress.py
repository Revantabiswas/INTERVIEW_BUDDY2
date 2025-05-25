from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, List, Any, Optional
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
import logging

from models.schemas import (
    ProgressData, ProgressUpdateRequest, ProgressResponse, 
    ProgressMetrics, StudySession, QuestionProgress, ProgressAnalytics
)
from utils import calculate_dsa_progress_metrics
from agents import create_progress_tracking_agent, create_progress_analysis_task, run_agent_task

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory storage for demo purposes - in production, use a proper database
PROGRESS_DATA_FILE = Path("data/progress_data.json")
PROGRESS_DATA_FILE.parent.mkdir(exist_ok=True)

def load_progress_data(user_id: str = "default") -> ProgressData:
    """Load progress data from file or create default data"""
    try:
        if PROGRESS_DATA_FILE.exists():
            with open(PROGRESS_DATA_FILE, 'r') as f:
                data = json.load(f)
                if user_id in data:
                    return ProgressData(**data[user_id])
        
        # Return default progress data
        return ProgressData(
            user_id=user_id,
            questions=[],
            study_sessions=[],
            goals={
                "target_company": "Google",
                "target_role": "Software Engineer",
                "interview_timeline": "3 months",
                "daily_practice_goal": 2,
                "weekly_goal": 10
            },
            preferences={
                "difficulty_focus": ["Medium", "Hard"],
                "topic_preferences": ["Arrays", "Dynamic Programming", "Trees"],
                "study_reminders": True,
                "progress_sharing": False
            },
            last_updated=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Error loading progress data: {e}")
        return ProgressData(
            user_id=user_id,
            questions=[],
            study_sessions=[],
            goals={},
            preferences={},
            last_updated=datetime.now().isoformat()
        )

def save_progress_data(progress_data: ProgressData) -> bool:
    """Save progress data to file"""
    try:
        # Load existing data
        all_data = {}
        if PROGRESS_DATA_FILE.exists():
            with open(PROGRESS_DATA_FILE, 'r') as f:
                all_data = json.load(f)
        
        # Update data for this user
        progress_data.last_updated = datetime.now().isoformat()
        all_data[progress_data.user_id] = progress_data.dict()
        
        # Save back to file
        with open(PROGRESS_DATA_FILE, 'w') as f:
            json.dump(all_data, f, indent=2)
        
        return True
    except Exception as e:
        logger.error(f"Error saving progress data: {e}")
        return False

def generate_recommendations(progress_data: ProgressData, metrics: ProgressMetrics) -> List[str]:
    """Generate AI-powered study recommendations based on progress"""
    recommendations = []
    
    try:
        # Basic rule-based recommendations
        if metrics.success_rate < 50:
            recommendations.append("Focus on easier problems to build confidence before tackling harder ones")
        
        if metrics.total_attempted < 10:
            recommendations.append("Try to solve at least 2-3 problems daily to maintain consistency")
        
        # Topic-based recommendations
        weak_topics = []
        for topic, stats in metrics.by_topic.items():
            if stats["total"] > 0 and (stats["completed"] / stats["total"]) < 0.6:
                weak_topics.append(topic)
        
        if weak_topics:
            recommendations.append(f"Consider reviewing fundamentals in: {', '.join(weak_topics[:3])}")
        
        # Difficulty progression
        easy_ratio = metrics.by_difficulty.get("Easy", 0) / max(metrics.total_completed, 1)
        if easy_ratio > 0.7:
            recommendations.append("Start incorporating more Medium difficulty problems")
        
        # Use AI agent for advanced recommendations
        if metrics.total_attempted > 5:
            try:
                agent = create_progress_tracking_agent()
                task = create_progress_analysis_task(agent, json.dumps(progress_data.dict()))
                ai_recommendations = run_agent_task(agent, task)
                if ai_recommendations and isinstance(ai_recommendations, str):
                    # Parse AI recommendations (basic extraction)
                    ai_lines = [line.strip() for line in ai_recommendations.split('\n') if line.strip()]
                    recommendations.extend(ai_lines[:3])  # Take top 3 AI recommendations
            except Exception as e:
                logger.warning(f"AI recommendation generation failed: {e}")
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        recommendations.append("Keep practicing consistently to improve your problem-solving skills")
    
    return recommendations[:5]  # Return top 5 recommendations

def generate_achievements(metrics: ProgressMetrics) -> List[str]:
    """Generate achievement badges based on progress metrics"""
    achievements = []
    
    if metrics.total_completed >= 1:
        achievements.append("🎯 First Problem Solved!")
    if metrics.total_completed >= 10:
        achievements.append("💪 Problem Solver - 10 problems completed")
    if metrics.total_completed >= 50:
        achievements.append("🔥 Coding Warrior - 50 problems completed")
    if metrics.total_completed >= 100:
        achievements.append("🏆 Algorithm Master - 100 problems completed")
    
    if metrics.success_rate >= 80:
        achievements.append("🎯 High Achiever - 80%+ success rate")
    if metrics.success_rate >= 95:
        achievements.append("👑 Perfectionist - 95%+ success rate")
    
    # Topic mastery
    for topic, stats in metrics.by_topic.items():
        if stats["total"] >= 5 and (stats["completed"] / stats["total"]) >= 0.9:
            achievements.append(f"🧠 {topic} Expert")
    
    return achievements

@router.get("/")
async def get_progress_data(user_id: str = "default") -> ProgressResponse:
    """Get comprehensive progress data and analytics"""
    try:
        # Load progress data
        progress_data = load_progress_data(user_id)
        
        # Calculate metrics using the utility function
        metrics_raw = calculate_dsa_progress_metrics({
            "questions": [q.dict() for q in progress_data.questions]
        })
        
        # Convert to proper metrics model
        metrics = ProgressMetrics(**metrics_raw)
        
        # Get recent study sessions (last 7 sessions)
        recent_sessions = sorted(
            progress_data.study_sessions, 
            key=lambda x: x.date, 
            reverse=True
        )[:7]
        
        # Generate recommendations and achievements
        recommendations = generate_recommendations(progress_data, metrics)
        achievements = generate_achievements(metrics)
        
        return ProgressResponse(
            metrics=metrics,
            recent_activity=recent_sessions,
            recommendations=recommendations,
            achievements=achievements
        )
        
    except Exception as e:
        logger.error(f"Error getting progress data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch progress data: {str(e)}")

@router.post("/update")
async def update_progress_data(
    update_request: ProgressUpdateRequest,
    background_tasks: BackgroundTasks,
    user_id: str = "default"
) -> Dict[str, Any]:
    """Update progress data with new information"""
    try:
        # Load current progress data
        progress_data = load_progress_data(user_id)
        
        # Update question progress
        if update_request.question_progress:
            question_update = update_request.question_progress
            # Find existing question or add new one
            existing_question = None
            for i, q in enumerate(progress_data.questions):
                if q.id == question_update.id:
                    existing_question = i
                    break
            
            if existing_question is not None:
                # Update existing question
                progress_data.questions[existing_question] = question_update
            else:
                # Add new question progress
                progress_data.questions.append(question_update)
        
        # Add study session
        if update_request.study_session:
            progress_data.study_sessions.append(update_request.study_session)
            # Keep only last 30 sessions to prevent data bloat
            if len(progress_data.study_sessions) > 30:
                progress_data.study_sessions = progress_data.study_sessions[-30:]
        
        # Update goals
        if update_request.goals_update:
            progress_data.goals.update(update_request.goals_update)
        
        # Update preferences
        if update_request.preferences_update:
            progress_data.preferences.update(update_request.preferences_update)
        
        # Save data in background
        background_tasks.add_task(save_progress_data, progress_data)
        
        return {
            "status": "success",
            "message": "Progress data updated successfully",
            "updated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error updating progress data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update progress data: {str(e)}")

@router.get("/analytics")
async def get_progress_analytics(user_id: str = "default") -> ProgressAnalytics:
    """Get detailed analytics for progress visualization"""
    try:
        progress_data = load_progress_data(user_id)
        
        # Calculate weekly progress
        weekly_progress = {}
        for session in progress_data.study_sessions:
            try:
                week_key = datetime.fromisoformat(session.date).strftime("%Y-W%U")
                weekly_progress[week_key] = weekly_progress.get(week_key, 0) + session.questions_completed
            except:
                continue
        
        # Calculate difficulty breakdown
        difficulty_breakdown = {
            "Easy": {"attempted": 0, "completed": 0},
            "Medium": {"attempted": 0, "completed": 0},
            "Hard": {"attempted": 0, "completed": 0}
        }
        
        for q in progress_data.questions:
            if q.difficulty in difficulty_breakdown:
                if q.attempts > 0:
                    difficulty_breakdown[q.difficulty]["attempted"] += 1
                if q.status == "completed":
                    difficulty_breakdown[q.difficulty]["completed"] += 1
        
        # Calculate topic performance
        topic_performance = {}
        for q in progress_data.questions:
            for topic in q.topics:
                if topic not in topic_performance:
                    topic_performance[topic] = {"total": 0, "completed": 0}
                topic_performance[topic]["total"] += 1
                if q.status == "completed":
                    topic_performance[topic]["completed"] += 1
        
        # Convert to success rate
        for topic in topic_performance:
            total = topic_performance[topic]["total"]
            completed = topic_performance[topic]["completed"]
            topic_performance[topic] = (completed / total * 100) if total > 0 else 0
        
        # Calculate company focus
        company_focus = {}
        for q in progress_data.questions:
            for company in q.companies:
                company_focus[company] = company_focus.get(company, 0) + 1
        
        # Calculate study streaks (simplified)
        current_streak = 0
        max_streak = 0
        study_dates = set()
        for session in progress_data.study_sessions:
            try:
                date = datetime.fromisoformat(session.date).date()
                study_dates.add(date)
            except:
                continue
        
        if study_dates:
            sorted_dates = sorted(study_dates, reverse=True)
            current_date = datetime.now().date()
            
            # Calculate current streak
            for date in sorted_dates:
                if (current_date - date).days <= 1:
                    current_streak += 1
                    current_date = date - timedelta(days=1)
                else:
                    break
        
        study_streaks = {
            "current": current_streak,
            "longest": max_streak,
            "total_days": len(study_dates)
        }
        
        # Time analytics
        total_time = sum(session.duration_minutes for session in progress_data.study_sessions)
        avg_session_time = total_time / len(progress_data.study_sessions) if progress_data.study_sessions else 0
        
        time_analytics = {
            "total_minutes": total_time,
            "average_session_minutes": round(avg_session_time, 1),
            "total_sessions": len(progress_data.study_sessions),
            "average_problems_per_session": round(
                sum(session.questions_attempted for session in progress_data.study_sessions) / 
                len(progress_data.study_sessions), 1
            ) if progress_data.study_sessions else 0
        }
        
        return ProgressAnalytics(
            weekly_progress=weekly_progress,
            difficulty_breakdown=difficulty_breakdown,
            topic_performance=topic_performance,
            company_focus=company_focus,
            study_streaks=study_streaks,
            time_analytics=time_analytics
        )
        
    except Exception as e:
        logger.error(f"Error getting analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")

@router.post("/session")
async def record_study_session(
    session: StudySession,
    background_tasks: BackgroundTasks,
    user_id: str = "default"
) -> Dict[str, Any]:
    """Record a new study session"""
    try:
        progress_data = load_progress_data(user_id)
        
        # Add the study session
        progress_data.study_sessions.append(session)
        
        # Keep only last 50 sessions
        if len(progress_data.study_sessions) > 50:
            progress_data.study_sessions = progress_data.study_sessions[-50:]
        
        # Save in background
        background_tasks.add_task(save_progress_data, progress_data)
        
        return {
            "status": "success",
            "message": "Study session recorded successfully",
            "session_id": len(progress_data.study_sessions)
        }
        
    except Exception as e:
        logger.error(f"Error recording study session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to record study session: {str(e)}")

@router.delete("/reset")
async def reset_progress_data(user_id: str = "default") -> Dict[str, Any]:
    """Reset all progress data for a user"""
    try:
        # Create fresh progress data
        fresh_data = ProgressData(
            user_id=user_id,
            questions=[],
            study_sessions=[],
            goals={},
            preferences={},
            last_updated=datetime.now().isoformat()
        )
        
        # Save the fresh data
        success = save_progress_data(fresh_data)
        
        if success:
            return {
                "status": "success",
                "message": "Progress data reset successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to reset progress data")
            
    except Exception as e:
        logger.error(f"Error resetting progress data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reset progress data: {str(e)}")

@router.get("/summary")
async def get_progress_summary(user_id: str = "default") -> Dict[str, Any]:
    """Get a quick summary of progress metrics"""
    try:
        progress_data = load_progress_data(user_id)
        
        total_questions = len(progress_data.questions)
        completed_questions = len([q for q in progress_data.questions if q.status == "completed"])
        completion_rate = (completed_questions / total_questions * 100) if total_questions > 0 else 0
        
        recent_session = progress_data.study_sessions[-1] if progress_data.study_sessions else None
        
        return {
            "total_questions": total_questions,
            "completed_questions": completed_questions,
            "completion_rate": round(completion_rate, 1),
            "total_study_time": sum(session.duration_minutes for session in progress_data.study_sessions),
            "last_session_date": recent_session.date if recent_session else None,
            "current_goals": progress_data.goals,
            "last_updated": progress_data.last_updated
        }
        
    except Exception as e:
        logger.error(f"Error getting progress summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch progress summary: {str(e)}")
