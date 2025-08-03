from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import uuid
from datetime import datetime
from typing import List, Optional

from ai_service import AIService
from database import DatabaseService
from models import (
    WebsiteGenerationRequest, 
    WebsiteResponse, 
    ComparisonResponse, 
    ProjectListResponse,
    StatusCheck,
    StatusCheckCreate
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize services
ai_service = AIService()
db_service = DatabaseService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db_service.connect()
    yield
    # Shutdown
    await db_service.close()

# Create the main app
app = FastAPI(
    title="Professional Website Generator API",
    description="Ultra-professional AI-powered website generator with multi-provider support",
    version="2.0.0",
    lifespan=lifespan
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ================================
# WEBSITE GENERATION ENDPOINTS
# ================================

@api_router.post("/generate-website", response_model=WebsiteResponse)
async def generate_website(request: WebsiteGenerationRequest):
    """Generate a professional website using AI"""
    try:
        logger.info(f"Generating website with {request.provider or 'comparison'} for: {request.prompt}")
        
        if request.provider:
            # Single provider generation
            result = await ai_service.generate_website(
                request.prompt, 
                request.provider, 
                request.website_type
            )
            
            if result["success"]:
                # Save to database
                project_id = await db_service.save_project(result)
                result["project_id"] = project_id
                
            return WebsiteResponse(**result)
            
        else:
            # Comparison mode - generate with both providers
            comparison_result = await ai_service.compare_providers(
                request.prompt,
                request.website_type
            )
            
            if comparison_result["success"]:
                # Save comparison to database
                comparison_id = await db_service.save_comparison(comparison_result)
                comparison_result["comparison_id"] = comparison_id
                
                # Save individual projects
                for provider, result in comparison_result["results"].items():
                    if result["success"]:
                        project_id = await db_service.save_project(result)
                        result["project_id"] = project_id
            
            return ComparisonResponse(**comparison_result)
            
    except Exception as e:
        logger.error(f"Error in generate_website: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/website-types")
async def get_website_types():
    """Get available website types and their descriptions"""
    return {
        "types": [
            {
                "id": "landing",
                "name": "Landing Page",
                "description": "Professional landing page with hero, features, testimonials, and CTA",
                "icon": "🚀",
                "features": ["Hero Section", "Features Grid", "Testimonials", "Contact Form"]
            },
            {
                "id": "business", 
                "name": "Business Website",
                "description": "Corporate website with services, team, and company information",
                "icon": "🏢",
                "features": ["Corporate Header", "Services", "Team Section", "About Us"]
            },
            {
                "id": "portfolio",
                "name": "Portfolio",
                "description": "Personal or professional portfolio showcase",
                "icon": "🎨",
                "features": ["Work Gallery", "Skills", "Bio", "Contact"]
            },
            {
                "id": "ecommerce",
                "name": "E-Commerce",
                "description": "Online store with products, categories, and shopping features",
                "icon": "🛒",
                "features": ["Product Grid", "Categories", "Cart", "Checkout"]
            },
            {
                "id": "blog",
                "name": "Blog",
                "description": "Professional blog with posts, categories, and subscription",
                "icon": "📝",
                "features": ["Post List", "Categories", "Author Bio", "Newsletter"]
            }
        ]
    }

@api_router.get("/ai-providers")
async def get_ai_providers():
    """Get available AI providers and their capabilities"""
    return {
        "providers": [
            {
                "id": "openai",
                "name": "OpenAI GPT-4.1",
                "description": "Latest and most advanced model for creative web design",
                "icon": "🤖",
                "model": "gpt-4.1",
                "strengths": ["Creative Design", "Modern Layouts", "Interactive Elements"],
                "speed": "fast",
                "quality": "excellent"
            },
            {
                "id": "gemini",
                "name": "Google Gemini 2.5 Pro",
                "description": "Powerful multimodal AI for sophisticated web development",
                "icon": "💎",
                "model": "gemini-2.5-pro-preview-05-06",
                "strengths": ["Technical Excellence", "Responsive Design", "Performance"],
                "speed": "very-fast",
                "quality": "excellent"
            }
        ],
        "comparison_mode": {
            "enabled": True,
            "description": "Generate with both providers and compare results",
            "benefits": ["See different approaches", "Choose best design", "Higher success rate"]
        }
    }

# ================================
# PROJECT MANAGEMENT ENDPOINTS
# ================================

@api_router.get("/projects", response_model=ProjectListResponse)
async def list_projects(page: int = 1, per_page: int = 20, user_id: Optional[str] = None):
    """List all generated website projects"""
    try:
        result = await db_service.list_projects(page, per_page, user_id)
        return ProjectListResponse(**result)
    except Exception as e:
        logger.error(f"Error listing projects: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    """Get a specific project by ID"""
    try:
        project = await db_service.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, update_data: dict):
    """Update a project"""
    try:
        success = await db_service.update_project(project_id, update_data)
        if not success:
            raise HTTPException(status_code=404, detail="Project not found")
        return {"success": True, "message": "Project updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    try:
        deleted = await db_service.delete_project(project_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Project not found")
        return {"success": True, "message": "Project deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/enhance-project")
async def enhance_project(request: dict):
    """Enhance a project using AI suggestions"""
    try:
        project_id = request.get("project_id")
        current_content = request.get("current_content")
        enhancement_type = request.get("enhancement_type", "suggestions")
        enhancement = request.get("enhancement")
        apply_enhancement = request.get("apply", False)

        logger.info(f"Enhancing project {project_id} with type: {enhancement_type}")

        if enhancement_type == "suggestions":
            # Generate enhancement suggestions
            suggestions = [
                {
                    "type": "visual",
                    "title": "Mejorar Paleta de Colores",
                    "description": "Actualizar esquema de colores para mayor impacto visual y mejor contraste",
                    "impact": "high",
                    "icon": "🎨"
                },
                {
                    "type": "functionality",
                    "title": "Agregar Animaciones CSS",
                    "description": "Incluir micro-interacciones y transiciones suaves para mejor UX",
                    "impact": "medium",
                    "icon": "✨"
                },
                {
                    "type": "content",
                    "title": "Optimizar Contenido",
                    "description": "Mejorar textos, llamadas a la acción y estructura del contenido",
                    "impact": "high", 
                    "icon": "📝"
                },
                {
                    "type": "performance",
                    "title": "Optimización SEO",
                    "description": "Mejorar meta tags, estructura semántica y rendimiento",
                    "impact": "medium",
                    "icon": "🚀"
                },
                {
                    "type": "responsive",
                    "title": "Mejorar Responsividad",
                    "description": "Optimizar diseño para dispositivos móviles y tablets",
                    "impact": "high",
                    "icon": "📱"
                }
            ]
            
            return {"success": True, "suggestions": suggestions}

        elif apply_enhancement and enhancement:
            # Apply the enhancement using AI
            enhanced_prompt = f"""
            Mejora este sitio web HTML aplicando la siguiente mejora: {enhancement['title']}
            
            Descripción de la mejora: {enhancement['description']}
            
            Contenido actual:
            {current_content[:2000]}...
            
            Por favor:
            1. Mantén la estructura general del sitio
            2. Aplica específicamente la mejora solicitada
            3. Asegúrate de que el código sea válido y funcional
            4. Mantén el estilo profesional y moderno
            5. Optimiza para rendimiento y accesibilidad
            
            Devuelve el HTML, CSS y JS mejorados.
            """

            # Use AI service to enhance the project
            result = await ai_service.generate_website(
                enhanced_prompt,
                "openai",  # Default to OpenAI for enhancements
                "enhancement"
            )

            if result["success"]:
                # Update the project in database
                await db_service.update_project(project_id, {
                    "files": result["files"],
                    "metadata": {
                        **result.get("metadata", {}),
                        "enhanced": True,
                        "enhancement_applied": enhancement['title'],
                        "enhanced_at": datetime.utcnow().isoformat()
                    }
                })

                return {
                    "success": True,
                    "enhanced_project": {
                        "id": project_id,
                        "files": result["files"],
                        "metadata": result.get("metadata", {})
                    }
                }

        return {"success": False, "error": "Invalid enhancement request"}

    except Exception as e:
        logger.error(f"Error enhancing project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# TEMPLATE SYSTEM ENDPOINTS
# ================================

@api_router.get("/templates")
async def get_templates():
    """Get available website templates"""
    return {
        "categories": [
            {
                "id": "business",
                "name": "Business & Corporate",
                "description": "Professional business websites",
                "icon": "🏢",
                "templates": [
                    "Corporate Landing", "Consulting Firm", "Agency Portfolio",
                    "SaaS Product", "Financial Services", "Law Firm"
                ]
            },
            {
                "id": "creative",
                "name": "Creative & Portfolio", 
                "description": "Showcase your creative work",
                "icon": "🎨",
                "templates": [
                    "Designer Portfolio", "Photography", "Artist Gallery",
                    "Creative Agency", "Freelancer", "Architecture"
                ]
            },
            {
                "id": "ecommerce",
                "name": "E-Commerce & Retail",
                "description": "Online stores and shops",
                "icon": "🛒",
                "templates": [
                    "Fashion Store", "Electronics", "Handmade Crafts",
                    "Digital Products", "Subscription Box", "Marketplace"
                ]
            },
            {
                "id": "personal",
                "name": "Personal & Blog",
                "description": "Personal websites and blogs",
                "icon": "👤",
                "templates": [
                    "Personal Blog", "Travel Blog", "Food Blog", 
                    "Tech Blog", "Lifestyle", "Resume Site"
                ]
            },
            {
                "id": "specialized",
                "name": "Specialized Industries",
                "description": "Industry-specific websites",
                "icon": "🏥",
                "templates": [
                    "Restaurant", "Medical Practice", "Real Estate",
                    "Fitness Studio", "Education", "Non-Profit"
                ]
            }
        ]
    }

@api_router.post("/generate-from-template")
async def generate_from_template(template_id: str, customization: dict):
    """Generate a website from a template with customizations"""
    # This would be implemented to use templates
    return {"message": "Template generation coming soon"}

# ================================
# LEGACY ENDPOINTS (for compatibility)
# ================================

@api_router.get("/")
async def root():
    return {
        "message": "Professional Website Generator API",
        "version": "2.0.0",
        "features": [
            "Multi-AI Provider Support", 
            "Professional Templates",
            "One-Click Generation",
            "Provider Comparison",
            "Project Management"
        ]
    }

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    """Legacy endpoint for status checks"""
    mongo_url = os.environ['MONGO_URL']
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    
    client.close()
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    """Legacy endpoint for getting status checks"""
    mongo_url = os.environ['MONGO_URL']
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    status_checks = await db.status_checks.find().to_list(1000)
    result = [StatusCheck(**status_check) for status_check in status_checks]
    
    client.close()
    return result

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)