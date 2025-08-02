from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Optional, Dict, Any
import os
import logging
from datetime import datetime
from .models import WebsiteProject, WebsiteFile, GenerationMetadata

logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self):
        self.mongo_url = os.environ.get('MONGO_URL')
        self.db_name = os.environ.get('DB_NAME', 'website_generator')
        self.client: AsyncIOMotorClient = None
        self.db = None
        
    async def connect(self):
        """Initialize database connection"""
        try:
            self.client = AsyncIOMotorClient(self.mongo_url)
            self.db = self.client[self.db_name]
            logger.info(f"Connected to MongoDB: {self.db_name}")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise

    async def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")

    async def save_project(self, project_data: Dict[str, Any]) -> str:
        """Save a website project to database"""
        try:
            # Convert files dict to WebsiteFile objects
            files = []
            for filename, content in project_data.get("files", {}).items():
                file_type = filename.split('.')[-1] if '.' in filename else 'txt'
                files.append({
                    "filename": filename,
                    "content": content,
                    "file_type": file_type
                })
            
            # Create project document
            project = {
                "id": project_data.get("session_id", str(datetime.utcnow().timestamp())),
                "name": f"Generated Website - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
                "description": project_data.get("metadata", {}).get("prompt", "Generated website"),
                "files": files,
                "metadata": project_data.get("metadata", {}),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "user_id": None,
                "is_public": False,
                "tags": [project_data.get("website_type", "landing"), project_data.get("provider", "ai")]
            }
            
            result = await self.db.projects.insert_one(project)
            project_id = str(result.inserted_id)
            
            logger.info(f"Project saved with ID: {project_id}")
            return project_id
            
        except Exception as e:
            logger.error(f"Error saving project: {str(e)}")
            raise

    async def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get a project by ID"""
        try:
            project = await self.db.projects.find_one({"id": project_id})
            if project:
                # Convert ObjectId to string for JSON serialization
                project["_id"] = str(project["_id"])
                return project
            return None
        except Exception as e:
            logger.error(f"Error getting project {project_id}: {str(e)}")
            return None

    async def list_projects(self, page: int = 1, per_page: int = 20, user_id: Optional[str] = None) -> Dict[str, Any]:
        """List projects with pagination"""
        try:
            skip = (page - 1) * per_page
            
            # Build query
            query = {}
            if user_id:
                query["user_id"] = user_id
            
            # Get total count
            total = await self.db.projects.count_documents(query)
            
            # Get projects
            cursor = self.db.projects.find(query).sort("created_at", -1).skip(skip).limit(per_page)
            projects = await cursor.to_list(length=per_page)
            
            # Convert ObjectIds to strings
            for project in projects:
                project["_id"] = str(project["_id"])
            
            return {
                "projects": projects,
                "total": total,
                "page": page,
                "per_page": per_page,
                "pages": (total + per_page - 1) // per_page
            }
            
        except Exception as e:
            logger.error(f"Error listing projects: {str(e)}")
            return {"projects": [], "total": 0, "page": page, "per_page": per_page, "pages": 0}

    async def delete_project(self, project_id: str) -> bool:
        """Delete a project"""
        try:
            result = await self.db.projects.delete_one({"id": project_id})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting project {project_id}: {str(e)}")
            return False

    async def save_comparison(self, comparison_data: Dict[str, Any]) -> str:
        """Save a provider comparison result"""
        try:
            comparison = {
                **comparison_data,
                "created_at": datetime.utcnow(),
                "type": "comparison"
            }
            
            result = await self.db.comparisons.insert_one(comparison)
            comparison_id = str(result.inserted_id)
            
            logger.info(f"Comparison saved with ID: {comparison_id}")
            return comparison_id
            
        except Exception as e:
            logger.error(f"Error saving comparison: {str(e)}")
            raise

    async def get_comparison(self, comparison_id: str) -> Optional[Dict[str, Any]]:
        """Get a comparison by ID"""
        try:
            comparison = await self.db.comparisons.find_one({"comparison_id": comparison_id})
            if comparison:
                comparison["_id"] = str(comparison["_id"])
                return comparison
            return None
        except Exception as e:
            logger.error(f"Error getting comparison {comparison_id}: {str(e)}")
            return None