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
            # Generate smart enhancement suggestions based on content analysis
            suggestions = await generate_smart_suggestions(current_content)
            return {"success": True, "suggestions": suggestions}

        elif apply_enhancement and enhancement:
            # Apply the enhancement using AI
            enhanced_prompt = create_enhancement_prompt(enhancement, current_content)

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

async def generate_smart_suggestions(content: str):
    """Generate intelligent enhancement suggestions based on content analysis"""
    suggestions = []
    
    # Analyze the content to provide contextual suggestions
    has_forms = 'form' in content.lower() or 'input' in content.lower()
    has_images = 'img' in content.lower() or 'image' in content.lower()
    has_navigation = 'nav' in content.lower() or 'menu' in content.lower()
    has_footer = 'footer' in content.lower()
    has_animations = 'animation' in content.lower() or 'transition' in content.lower()
    
    # Color enhancement
    suggestions.append({
        "type": "visual",
        "title": "Mejorar Paleta de Colores",
        "description": "Aplicar una paleta de colores moderna y profesional que mejore la legibilidad y el impacto visual",
        "impact": "high",
        "icon": "🎨"
    })
    
    # Animation enhancement
    if not has_animations:
        suggestions.append({
            "type": "functionality",
            "title": "Agregar Animaciones CSS",
            "description": "Incluir micro-interacciones y transiciones suaves para mejorar la experiencia de usuario",
            "impact": "medium",
            "icon": "✨"
        })
    
    # Content optimization
    suggestions.append({
        "type": "content",
        "title": "Optimizar Contenido",
        "description": "Mejorar textos, llamadas a la acción y estructura del contenido para mayor conversión",
        "impact": "high",
        "icon": "📝"
    })
    
    # SEO optimization
    suggestions.append({
        "type": "performance",
        "title": "Optimización SEO",
        "description": "Mejorar meta tags, estructura semántica y rendimiento para mejor posicionamiento",
        "impact": "medium",
        "icon": "🚀"
    })
    
    # Responsive improvements
    suggestions.append({
        "type": "responsive",
        "title": "Mejorar Responsividad",
        "description": "Optimizar el diseño para dispositivos móviles y tablets con mejores breakpoints",
        "impact": "high",
        "icon": "📱"
    })
    
    # Interactive elements
    if not has_forms:
        suggestions.append({
            "type": "functionality",
            "title": "Agregar Elementos Interactivos",
            "description": "Incluir formularios de contacto, botones de acción y elementos interactivos",
            "impact": "medium",
            "icon": "🔘"
        })
    
    return suggestions

def create_enhancement_prompt(enhancement: dict, current_content: str):
    """Create a detailed prompt for AI enhancement"""
    
    base_prompt = f"""
MEJORA ESPECÍFICA: {enhancement['title']}
DESCRIPCIÓN: {enhancement['description']}

CONTENIDO ACTUAL A MEJORAR:
{current_content[:3000]}

INSTRUCCIONES DETALLADAS:
"""
    
    enhancement_type = enhancement.get('type', 'general')
    
    if enhancement_type == 'visual' or 'color' in enhancement.get('title', '').lower():
        base_prompt += """
1. PALETA DE COLORES:
   - Utiliza una paleta moderna y profesional
   - Aplica principios de teoría del color
   - Asegura contraste adecuado para accesibilidad (WCAG 2.1)
   - Usa colores que transmitan confianza y profesionalismo
   - Implementa gradientes sutiles donde sea apropiado

2. ELEMENTOS VISUALES:
   - Actualiza todos los colores de fondo, texto y botones
   - Mejora los colores de hover y estados activos
   - Utiliza colores semánticos para elementos importantes
   - Mantén consistencia en toda la página
"""
    
    elif 'text' in enhancement.get('title', '').lower() or enhancement_type == 'content':
        base_prompt += """
1. OPTIMIZACIÓN DE CONTENIDO:
   - Mejora títulos para mayor impacto y SEO
   - Optimiza descripciones para ser más persuasivas
   - Crea llamadas a la acción más efectivas
   - Mejora la jerarquía de información
   - Usa lenguaje claro y orientado a conversión

2. ESTRUCTURA TEXTUAL:
   - Mejora la legibilidad con espaciado adecuado
   - Utiliza bullet points donde sea apropiado
   - Optimiza la longitud de párrafos
   - Agrega elementos de confianza y credibilidad
"""
    
    elif 'animation' in enhancement.get('title', '').lower() or enhancement_type == 'functionality':
        base_prompt += """
1. ANIMACIONES Y TRANSICIONES:
   - Agrega transiciones suaves en hover states
   - Implementa animaciones de entrada para elementos
   - Usa transform y opacity para mejor performance
   - Incluye micro-interacciones en botones
   - Implementa loading states y feedback visual

2. INTERACTIVIDAD:
   - Mejora la respuesta visual de elementos clickeables
   - Agrega efectos de focus para accesibilidad
   - Implementa estados de carga y éxito
   - Usa animaciones CSS3 modernas
"""
    
    elif enhancement_type == 'performance' or 'seo' in enhancement.get('title', '').lower():
        base_prompt += """
1. OPTIMIZACIÓN SEO:
   - Mejora meta tags (title, description, keywords)
   - Implementa estructura semántica correcta (h1, h2, etc.)
   - Agrega alt tags para imágenes
   - Incluye Open Graph y Twitter Card meta tags
   - Optimiza la velocidad de carga

2. PERFORMANCE:
   - Minifica CSS y optimiza código
   - Implementa lazy loading donde sea apropiado
   - Optimiza imágenes y recursos
   - Mejora la estructura del código
"""
    
    elif enhancement_type == 'responsive' or 'mobile' in enhancement.get('title', '').lower():
        base_prompt += """
1. DISEÑO RESPONSIVO:
   - Implementa breakpoints modernos y efectivos
   - Optimiza para móviles first
   - Mejora la navegación táctil
   - Ajusta tipografía para diferentes pantallas
   - Optimiza imágenes para retina displays

2. EXPERIENCIA MÓVIL:
   - Mejora el espaciado para touch targets
   - Optimiza formularios para móviles
   - Implementa navegación mobile-friendly
   - Ajusta el layout para pantallas pequeñas
"""
    
    base_prompt += """

REQUISITOS TÉCNICOS:
- Mantén la estructura general del HTML
- Conserva la funcionalidad existente
- Asegura compatibilidad cross-browser
- Usa CSS moderno pero compatible
- Optimiza para performance y accesibilidad
- Genera código limpio y bien comentado

FORMATO DE RESPUESTA:
=== FILE: index.html ===
[HTML completo mejorado]

=== FILE: styles.css ===
[CSS completo con mejoras aplicadas]

=== FILE: script.js ===
[JavaScript con funcionalidades mejoradas]

=== END FILES ===

Importante: La mejora debe ser sustancial y claramente visible, manteniendo la calidad profesional del sitio.
"""
    
    return base_prompt

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