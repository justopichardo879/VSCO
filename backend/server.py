from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import uuid
import asyncio
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
        logger.info(f"Generating website with {request.model or request.provider or 'comparison'} for: {request.prompt}")
        
        if request.provider:
            # Single provider generation with timeout
            try:
                result = await asyncio.wait_for(
                    ai_service.generate_website(
                        request.prompt, 
                        request.provider, 
                        request.website_type,
                        request.model
                    ),
                    timeout=150  # 2.5 minutes total timeout
                )
            except asyncio.TimeoutError:
                logger.error(f"Server timeout for {request.model or request.provider} generation after 150 seconds")
                return WebsiteResponse(
                    success=False,
                    error="Generation timeout: Please try again with a simpler request.",
                    provider=request.provider
                )
            
            if result["success"]:
                # Save to database
                project_id = await db_service.save_project(result)
                result["project_id"] = project_id
                
            return WebsiteResponse(**result)
            
        else:
            # Comparison mode - generate with both providers with timeout
            try:
                comparison_result = await asyncio.wait_for(
                    ai_service.compare_providers(
                        request.prompt,
                        request.website_type
                    ),
                    timeout=180  # 3 minutes for comparison mode (longer because it's two providers)
                )
            except asyncio.TimeoutError:
                logger.error("Server timeout for comparison generation after 180 seconds")
                return WebsiteResponse(
                    success=False,
                    error="Comparison generation timeout: Please try again with a simpler request.",
                    provider="comparison"
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
                "name": "🤖 OpenAI GPT-3.5/4",
                "description": "Latest GPT models via API - Creative web design",
                "icon": "🤖",
                "model": "gpt-3.5-turbo",
                "strengths": ["Creative Design", "Modern Layouts", "Interactive Elements"],
                "speed": "fast",
                "quality": "excellent"
            },
            {
                "id": "gemini",
                "name": "💎 Google Gemini 1.5",
                "description": "Powerful multimodal AI via API - Technical excellence",
                "icon": "💎",
                "model": "gemini-1.5-pro",
                "strengths": ["Technical Excellence", "Responsive Design", "Performance"],
                "speed": "very-fast",
                "quality": "excellent"
            },
            {
                "id": "local",
                "name": "🔥 Local Open Source",
                "description": "100% offline models - Llama, Mistral, Qwen y más",
                "icon": "🏠",
                "model": "llama-3-8b",
                "strengths": ["100% Offline", "Sin API Keys", "Privacidad Total", "Sin Límites"],
                "speed": "variable",
                "quality": "excellent",
                "special_features": ["Ollama", "LM Studio", "Private", "Unlimited"]
            }
        ],
        "comparison_mode": {
            "enabled": True,
            "description": "Generate with both providers and compare results",
            "benefits": ["See different approaches", "Choose best design", "Higher success rate"]
        },
        "local_info": {
            "supported_platforms": ["Ollama", "LM Studio", "text-generation-webui", "vLLM"],
            "auto_fallback": True,
            "models_count": 20,
            "installation_help": "https://ollama.ai"
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
        current_content = request.get("current_content", "")
        enhancement_type = request.get("enhancement_type", "suggestions")
        modification_type = request.get("modification_type")
        enhancement = request.get("enhancement")
        apply_enhancement = request.get("apply", False)

        # Validation
        if not project_id:
            return {"success": False, "error": "project_id is required"}
        
        # Ensure current_content is a string
        if current_content is None:
            current_content = ""
        elif not isinstance(current_content, str):
            current_content = str(current_content)

        logger.info(f"Enhancing project {project_id} with type: {enhancement_type}, modification: {modification_type}, apply: {apply_enhancement}")
        logger.info(f"Content length: {len(current_content)}")

        # Priority: If apply_enhancement is True, apply the enhancement regardless of enhancement_type
        if apply_enhancement and enhancement:
            # Handle different modification types
            if modification_type == "custom_prompt":
                enhanced_prompt = create_custom_modification_prompt(enhancement, current_content)
            elif modification_type == "chat_interactive":
                enhanced_prompt = create_chat_modification_prompt(enhancement, current_content)
            else:
                enhanced_prompt = create_enhancement_prompt(enhancement, current_content)

            logger.info(f"Enhanced prompt created: {enhanced_prompt[:100]}...")

            # Use AI service to enhance the project with model selection
            # Try to use the best available model for enhancements
            provider = "openai"  # Default to OpenAI
            model = "gpt-3.5-turbo"  # Default model
            
            # If OpenAI is not available, try local models
            try:
                result = await ai_service.generate_website(
                    enhanced_prompt,
                    provider,
                    "enhancement", 
                    model
                )
            except Exception as openai_error:
                logger.warning(f"OpenAI failed, trying local model: {str(openai_error)}")
                try:
                    # Fallback to local models
                    result = await ai_service.generate_website(
                        enhanced_prompt,
                        "local",
                        "enhancement",
                        "llama-3-8b"
                    )
                    provider = "local"
                    model = "llama-3-8b"
                except Exception as local_error:
                    logger.warning(f"Local model failed, trying Gemini: {str(local_error)}")
                    # Final fallback to Gemini
                    result = await ai_service.generate_website(
                        enhanced_prompt,
                        "gemini",
                        "enhancement",
                        "gemini-1.5-flash"
                    )
                    provider = "gemini"
                    model = "gemini-1.5-flash"

            logger.info(f"AI service result: {result.get('success', False)} using {provider}:{model}")

            if result["success"]:
                # Update the project in database
                update_data = {
                    "files": result["files"],
                    "metadata": {
                        **result.get("metadata", {}),
                        "enhanced": True,
                        "enhancement_applied": enhancement.get('title', 'Unknown'),
                        "enhancement_provider": provider,
                        "enhancement_model": model,
                        "enhanced_at": datetime.utcnow().isoformat()
                    }
                }
                
                await db_service.update_project(project_id, update_data)

                logger.info(f"Project {project_id} updated successfully with {provider}:{model}")

                return {
                    "success": True,
                    "enhanced_project": {
                        "id": project_id,
                        "files": result["files"],
                        "metadata": result.get("metadata", {}),
                        "provider_used": provider,
                        "model_used": model
                    },
                    "provider_used": provider,
                    "model_used": model,
                    "changes": [
                        f"✅ Mejora aplicada usando {provider.upper()} {model}",
                        f"🎯 Tipo: {enhancement.get('title', 'Mejora personalizada')}",
                        f"⚡ Impacto: {enhancement.get('impact', 'Alto')}"
                    ]
                }
            else:
                error_msg = result.get("error", "AI service failed to enhance the project")
                logger.error(f"AI enhancement failed: {error_msg}")
                return {"success": False, "error": error_msg}

        elif enhancement_type == "suggestions":
            # Generate smart enhancement suggestions based on content analysis
            suggestions = await generate_smart_suggestions(current_content)
            return {"success": True, "suggestions": suggestions}

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

def create_custom_modification_prompt(enhancement: dict, current_content: str):
    """Create a custom modification prompt for user-defined changes"""
    
    user_prompt = enhancement.get('prompt') or enhancement.get('description', '')
    
    custom_prompt = f"""
MODIFICACIÓN PERSONALIZADA SOLICITADA POR EL USUARIO:
"{user_prompt}"

CONTENIDO ACTUAL DEL SITIO WEB:
{current_content[:4000]}

INSTRUCCIONES DETALLADAS:
1. ANÁLISIS: Analiza cuidadosamente lo que el usuario quiere modificar o agregar
2. IMPLEMENTACIÓN: Aplica exactamente lo solicitado manteniendo la calidad profesional
3. INTEGRACIÓN: Asegúrate de que la modificación se integre perfectamente con el diseño existente
4. CONSISTENCIA: Mantén el estilo visual y la estructura general del sitio

TIPOS DE MODIFICACIONES COMUNES:
- Agregar nuevas secciones (testimonios, precios, contacto, características, etc.)
- Modificar contenido existente (textos, colores, imágenes, etc.)
- Mejorar elementos específicos (botones, formularios, navegación, etc.)
- Cambiar el diseño o layout de secciones particulares

REQUISITOS TÉCNICOS OBLIGATORIOS:
✓ Mantén la estructura HTML semántica y válida
✓ Conserva toda la funcionalidad existente que no se modifique
✓ Usa CSS moderno con flexbox/grid para nuevos elementos
✓ Asegura responsividad móvil para cualquier adición
✓ Aplica la paleta de colores existente o mejórala si es necesario
✓ Optimiza para performance (CSS eficiente, imágenes optimizadas)
✓ Incluye transiciones y animaciones suaves donde sea apropiado
✓ Mantén accesibilidad (contraste, alt texts, ARIA labels)

PAUTAS DE CALIDAD:
- Si agregas secciones, hazlas visualment atractivas y profesionales
- Si modificas contenido, mejóralo sin perder el mensaje original
- Si cambias diseño, asegúrate de que sea una mejora real
- Usa tipografía consistente con el resto del sitio
- Aplica espaciado y márgenes coherentes
- Incluye elementos interactivos apropiados (hover effects, etc.)

FORMATO DE RESPUESTA OBLIGATORIO:
=== FILE: index.html ===
[HTML completo con las modificaciones aplicadas]

=== FILE: styles.css ===
[CSS completo incluyendo nuevos estilos para las modificaciones]

=== FILE: script.js ===
[JavaScript con funcionalidades nuevas o modificadas si es necesario]

=== END FILES ===

IMPORTANTE: La modificación debe ser sustancial, visible y profesional. Si el usuario pide algo específico, inclúyelo exactamente como se solicita pero con la mejor calidad posible.
"""
    
    return custom_prompt

def create_chat_modification_prompt(enhancement: dict, current_content: str):
    """Create a chat-style interactive modification prompt"""
    
    user_message = enhancement.get('prompt') or enhancement.get('message') or enhancement.get('description', '')
    
    chat_prompt = f"""
CHAT INTERACTIVO - MODIFICACIÓN DE SITIO WEB
Usuario dice: "{user_message}"

CONTENIDO ACTUAL DEL SITIO WEB:
{current_content[:4000]}

INSTRUCCIONES PARA IA CONVERSACIONAL:
1. INTERPRETACIÓN NATURAL: Comprende la solicitud como una conversación casual pero profesional
2. IMPLEMENTACIÓN INTELIGENTE: Aplica los cambios solicitados con criterio profesional
3. MEJORAS CONTEXTUALES: Agrega mejoras relacionadas que complementen la solicitud
4. RESPUESTA DETALLADA: Será claro qué cambios se aplicaron

EJEMPLOS DE INTERPRETACIÓN:
- "Agrega testimonios" → Crear sección de testimonios con 3-4 reseñas realistas
- "Hazlo más moderno" → Aplicar diseño contemporáneo, colores actuales, tipografía moderna
- "Mejora los colores" → Actualizar paleta completa con colores más atractivos
- "Agrega contacto" → Incluir formulario de contacto funcional y información
- "Más profesional" → Refinar diseño, mejorar tipografía, optimizar espacios
- "Agrega animaciones" → Incluir transiciones CSS suaves y micro-interacciones

DIRECTRICES DE IMPLEMENTACIÓN:
✅ VISUAL: Colores modernos, tipografía legible, espaciado apropiado
✅ CONTENIDO: Textos persuasivos, llamadas a la acción claras
✅ ESTRUCTURA: HTML semántico, CSS organizado, JavaScript funcional
✅ EXPERIENCIA: Responsive, accesible, rápido de cargar
✅ PROFESIONAL: Diseño cohesivo, elementos bien alineados

REGLAS ESPECÍFICAS:
- Si pide "testimonios": Crear 3-4 testimonios con nombres, fotos placeholder y reseñas convincentes
- Si pide "contacto": Incluir formulario con nombre, email, mensaje y validación básica
- Si pide "colores": Aplicar paleta moderna con al menos 3-4 colores coordinados
- Si pide "moderno": Usar tendencias actuales (gradientes sutiles, sombras, rounded corners)
- Si pide "responsive": Optimizar para mobile con breakpoints apropiados

CALIDAD MÍNIMA REQUERIDA:
- Código limpio y bien estructurado
- Diseño visualmente atractivo
- Funcionalidad real (no placeholder)
- Integración perfecta con contenido existente
- Mejoras sustanciales y visibles

FORMATO DE RESPUESTA OBLIGATORIO:
=== FILE: index.html ===
[HTML completo mejorado con los cambios solicitados aplicados]

=== FILE: styles.css ===
[CSS completo con nuevos estilos y mejoras visuales]

=== FILE: script.js ===
[JavaScript con funcionalidades nuevas o mejoradas si es necesario]

=== END FILES ===

IMPORTANTE: Los cambios deben ser significativos, visibles y profesionales. Interpreta la intención del usuario y superla con una implementación de alta calidad.
"""
    
    return chat_prompt

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