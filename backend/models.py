from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid

class WebsiteGenerationRequest(BaseModel):
    prompt: str = Field(..., description="User prompt for website generation")
    website_type: str = Field(default="landing", description="Type of website (landing, business, portfolio, ecommerce, blog)")
    provider: Optional[str] = Field(default=None, description="AI provider (openai, gemini, or null for comparison)")
    
class WebsiteFile(BaseModel):
    filename: str
    content: str
    file_type: str  # html, css, js, etc.

class GenerationMetadata(BaseModel):
    generated_at: datetime
    prompt: str
    enhanced_prompt: str
    provider: str
    model: str
    website_type: str

class WebsiteProject(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    files: List[WebsiteFile]
    metadata: GenerationMetadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None
    is_public: bool = False
    tags: List[str] = []

class WebsiteResponse(BaseModel):
    success: bool
    project_id: Optional[str] = None
    files: Optional[Dict[str, str]] = None
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    provider: Optional[str] = None

class ComparisonResponse(BaseModel):
    success: bool
    comparison_id: str
    original_prompt: str
    website_type: str
    results: Dict[str, WebsiteResponse]
    generated_at: datetime

class ProjectListResponse(BaseModel):
    projects: List[WebsiteProject]
    total: int
    page: int
    per_page: int

class TemplateCategory(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    templates: List[str]

class WebsiteTemplate(BaseModel):
    id: str
    name: str
    description: str
    category: str
    preview_image: str
    prompt_template: str
    website_type: str
    tags: List[str]
    is_premium: bool = False