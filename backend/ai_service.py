from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
import asyncio
import json
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.openai_key = os.environ.get('OPENAI_API_KEY')
        self.gemini_key = os.environ.get('GEMINI_API_KEY')
        self.system_prompt = """You are a world-class web developer and designer with expertise in creating professional, modern websites. 

Your specialties include:
- Modern responsive web design
- Professional UI/UX principles
- Clean, semantic HTML5
- Advanced CSS3 with modern layouts (Grid, Flexbox)
- Professional color schemes and typography
- Business-ready components and sections
- Performance optimization
- Accessibility best practices

When generating websites, create:
- Professional, business-grade designs
- Mobile-first responsive layouts
- Modern color palettes with proper contrast
- Clean typography with proper hierarchy
- Interactive elements and smooth animations
- Semantic HTML structure
- Optimized CSS with modern techniques
- Complete, ready-to-use websites

Always generate complete, production-ready code that looks professional and modern."""
        
    async def create_chat_instance(self, provider: str, session_id: str, model: str = None):
        """Create a chat instance based on the provider and specific model"""

        # Model configurations with their token limits and local endpoints
        model_configs = {
            # OpenAI models (API-based)
            "gpt-3.5-turbo": {"provider": "openai", "max_tokens": 4096, "type": "api"},
            "gpt-4.1": {"provider": "openai", "max_tokens": 8192, "type": "api"},
            "gpt-4o": {"provider": "openai", "max_tokens": 8192, "type": "api"},
            
            # Gemini models (API-based)
            "gemini-1.5-flash": {"provider": "gemini", "max_tokens": 8192, "type": "api"},
            "gemini-1.5-pro": {"provider": "gemini", "max_tokens": 8192, "type": "api"},
            "gemini-2.5-pro-preview": {"provider": "gemini", "max_tokens": 8192, "type": "api"},
            
            # 🔥 LOCAL OPEN SOURCE MODELS
            # Meta Llama 3 family
            "llama-3-8b": {"provider": "local", "max_tokens": 8192, "type": "local", "category": "llama", "size": "8B"},
            "llama-3-70b": {"provider": "local", "max_tokens": 8192, "type": "local", "category": "llama", "size": "70B"},
            
            # Mistral AI family
            "mixtral-8x22b": {"provider": "local", "max_tokens": 32768, "type": "local", "category": "mistral", "size": "MoE"},
            "mistral-7b": {"provider": "local", "max_tokens": 8192, "type": "local", "category": "mistral", "size": "7B"},
            "mistral-medium": {"provider": "local", "max_tokens": 8192, "type": "local", "category": "mistral", "size": "Medium"},
            
            # Nous Hermes family (fine-tuned for chat/coding)
            "nous-hermes-2-llama3": {"provider": "local", "max_tokens": 8192, "type": "local", "category": "nous", "size": "8B"},
            "nous-hermes-3-llama3": {"provider": "local", "max_tokens": 8192, "type": "local", "category": "nous", "size": "8B"},
            
            # Community fine-tuned models
            "openhermes": {"provider": "local", "max_tokens": 8192, "type": "local", "category": "community", "size": "7B"},
            "openchat": {"provider": "local", "max_tokens": 8192, "type": "local", "category": "community", "size": "7B"},
            "mythomax": {"provider": "local", "max_tokens": 8192, "type": "local", "category": "community", "size": "13B"},
            
            # Qwen 2 (Alibaba)
            "qwen2-7b": {"provider": "local", "max_tokens": 32768, "type": "local", "category": "qwen", "size": "7B"},
            "qwen2-72b": {"provider": "local", "max_tokens": 32768, "type": "local", "category": "qwen", "size": "72B"},
            
            # Deepseek LLM (optimized for code)
            "deepseek-coder-33b": {"provider": "local", "max_tokens": 16384, "type": "local", "category": "deepseek", "size": "33B"},
            "deepseek-coder-1.3b": {"provider": "local", "max_tokens": 16384, "type": "local", "category": "deepseek", "size": "1.3B"},
            "deepseek-v2": {"provider": "local", "max_tokens": 32768, "type": "local", "category": "deepseek", "size": "236B"},
            
            # Phi-3 (Microsoft - lightweight)
            "phi-3-mini": {"provider": "local", "max_tokens": 4096, "type": "local", "category": "phi", "size": "3.8B"},
            "phi-3-medium": {"provider": "local", "max_tokens": 4096, "type": "local", "category": "phi", "size": "14B"},
            
            # Gemma (Google - small but versatile)
            "gemma-2b": {"provider": "local", "max_tokens": 8192, "type": "local", "category": "gemma", "size": "2B"},
            "gemma-7b": {"provider": "local", "max_tokens": 8192, "type": "local", "category": "gemma", "size": "7B"},
            
            # Yi models (01.AI - Chinese, top benchmarks)
            "yi-34b": {"provider": "local", "max_tokens": 32768, "type": "local", "category": "yi", "size": "34B"},
            "yi-6b": {"provider": "local", "max_tokens": 4096, "type": "local", "category": "yi", "size": "6B"},
            
            # Code-specialized models
            "code-llama-34b": {"provider": "local", "max_tokens": 16384, "type": "local", "category": "code", "size": "34B"},
            "wizardcoder-15b": {"provider": "local", "max_tokens": 16384, "type": "local", "category": "code", "size": "15B"},
            "codefuse-13b": {"provider": "local", "max_tokens": 8192, "type": "local", "category": "code", "size": "13B"},
            
            # Solar and community models
            "solar-10.7b": {"provider": "local", "max_tokens": 8192, "type": "local", "category": "solar", "size": "10.7B"},
            "dolphin-mixtral": {"provider": "local", "max_tokens": 8192, "type": "local", "category": "community", "size": "8x7B"},
            "starling-7b": {"provider": "local", "max_tokens": 8192, "type": "local", "category": "community", "size": "7B"},
            "zephyr-7b": {"provider": "local", "max_tokens": 8192, "type": "local", "category": "community", "size": "7B"},
        }
        
        # If no specific model provided, use defaults
        if not model:
            model = "gpt-3.5-turbo" if provider == "openai" else "gemini-1.5-pro"
        
        # Get model configuration
        if model not in model_configs:
            raise ValueError(f"Unsupported model: {model}")
        
        config = model_configs[model]
        actual_provider = config["provider"]
        max_tokens = config["max_tokens"]

        if actual_provider == "openai":
            if not self.openai_key:
                raise ValueError("OpenAI API key not found")
            chat = LlmChat(
                api_key=self.openai_key,
                session_id=session_id,
                system_message=self.system_prompt
            ).with_model("openai", model).with_max_tokens(max_tokens)
            
        elif actual_provider == "gemini":
            if not self.gemini_key:
                raise ValueError("Gemini API key not found")
            chat = LlmChat(
                api_key=self.gemini_key,
                session_id=session_id,
                system_message=self.system_prompt
            ).with_model("gemini", model).with_max_tokens(max_tokens)
            
        else:
            raise ValueError(f"Unsupported provider: {actual_provider}")
            
        return chat

    async def generate_website(self, prompt: str, provider: str, website_type: str = "landing", model: str = None) -> Dict[str, Any]:
        """Generate a complete website using the specified AI provider and model"""
        session_id = str(uuid.uuid4())
        
        try:
            # Create specialized prompts based on website type
            enhanced_prompt = self._enhance_prompt(prompt, website_type)
            
            chat = await self.create_chat_instance(provider, session_id, model)
            
            user_message = UserMessage(text=enhanced_prompt)
            
            # Add timeout to prevent hanging
            try:
                response = await asyncio.wait_for(
                    chat.send_message(user_message),
                    timeout=120  # 2 minutes timeout
                )
            except asyncio.TimeoutError:
                logger.error(f"Timeout waiting for {model or provider} response after 120 seconds")
                return {
                    "success": False,
                    "error": f"Timeout: {model or provider} took too long to respond. Please try again.",
                    "provider": provider,
                    "model": model
                }
            except Exception as api_error:
                logger.error(f"API error from {model or provider}: {str(api_error)}")
                return {
                    "success": False,
                    "error": f"API Error: {str(api_error)}",
                    "provider": provider,
                    "model": model
                }
            
            # Parse the response and extract code
            parsed_result = self._parse_ai_response(response, provider)
            
            return {
                "success": True,
                "provider": provider,
                "model": model or ("gpt-3.5-turbo" if provider == "openai" else "gemini-1.5-pro"),
                "website_type": website_type,
                "session_id": session_id,
                "files": parsed_result["files"],
                "metadata": {
                    "generated_at": datetime.utcnow().isoformat(),
                    "prompt": prompt,
                    "enhanced_prompt": enhanced_prompt,
                    "provider": provider,
                    "model": model or ("gpt-3.5-turbo" if provider == "openai" else "gemini-1.5-pro")
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating website with {provider}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "provider": provider
            }

    async def compare_providers(self, prompt: str, website_type: str = "landing") -> Dict[str, Any]:
        """Generate websites using both providers for comparison"""
        try:
            # Generate with both providers simultaneously
            openai_task = self.generate_website(prompt, "openai", website_type)
            gemini_task = self.generate_website(prompt, "gemini", website_type)
            
            openai_result, gemini_result = await asyncio.gather(openai_task, gemini_task)
            
            return {
                "success": True,
                "comparison_id": str(uuid.uuid4()),
                "original_prompt": prompt,
                "website_type": website_type,
                "results": {
                    "openai": openai_result,
                    "gemini": gemini_result
                },
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in provider comparison: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    def _enhance_prompt(self, prompt: str, website_type: str) -> str:
        """Enhance the user prompt with specific requirements"""
        
        base_requirements = """
IMPORTANT REQUIREMENTS:
1. Generate COMPLETE, PROFESSIONAL website files
2. Create separate HTML, CSS, and JS files 
3. Use modern, responsive design principles
4. Include professional color schemes and typography
5. Make it mobile-first responsive
6. Add smooth animations and interactions
7. Ensure accessibility (ARIA labels, semantic HTML)
8. Use modern CSS Grid and Flexbox
9. Include proper meta tags for SEO
10. Make it production-ready

STRUCTURE YOUR RESPONSE EXACTLY AS:
=== FILE: index.html ===
[Complete HTML content here]

=== FILE: styles.css ===
[Complete CSS content here]

=== FILE: script.js ===
[Complete JavaScript content here]

=== END FILES ===
"""

        type_specific = {
            "landing": """
Create a professional LANDING PAGE with:
- Hero section with compelling headline and CTA
- Features/benefits section
- Testimonials/social proof
- About section
- Contact/CTA section
- Professional footer
""",
            "business": """
Create a professional BUSINESS WEBSITE with:
- Corporate header with navigation
- Hero banner with company value proposition
- Services/products section
- About us section
- Team section
- Contact information
- Professional corporate footer
""",
            "portfolio": """
Create a professional PORTFOLIO WEBSITE with:
- Personal/professional header
- Hero section with introduction
- Portfolio/work showcase gallery
- Skills and expertise section
- About/bio section
- Contact form and information
""",
            "ecommerce": """
Create a professional E-COMMERCE WEBSITE with:
- Product header with cart/search
- Hero section with featured products
- Product categories grid
- Featured/bestseller products
- Customer testimonials
- Footer with links and info
""",
            "blog": """
Create a professional BLOG WEBSITE with:
- Blog header with navigation
- Hero section with latest post
- Recent posts grid/list
- Categories and tags
- About the author section
- Subscription/newsletter signup
"""
        }
        
        specific_requirements = type_specific.get(website_type, type_specific["landing"])
        
        enhanced_prompt = f"""
{prompt}

{specific_requirements}

{base_requirements}

Remember: This needs to be PROFESSIONAL, MODERN, and BUSINESS-READY. Think Fortune 500 company quality.
"""
        
        return enhanced_prompt

    def _parse_ai_response(self, response: str, provider: str) -> Dict[str, Any]:
        """Parse AI response and extract file contents"""
        files = {}
        
        try:
            # Look for file markers in response
            lines = response.split('\n')
            current_file = None
            file_content = []
            
            for line in lines:
                if line.startswith('=== FILE:'):
                    # Save previous file if exists
                    if current_file and file_content:
                        files[current_file] = '\n'.join(file_content)
                    
                    # Extract filename
                    current_file = line.replace('=== FILE:', '').strip()
                    file_content = []
                    
                elif line.startswith('=== END FILES ==='):
                    # Save last file
                    if current_file and file_content:
                        files[current_file] = '\n'.join(file_content)
                    break
                    
                elif current_file:
                    file_content.append(line)
            
            # If no file markers found, try to extract HTML/CSS/JS from code blocks
            if not files:
                files = self._extract_code_blocks(response)
            
            # Ensure we have at least an HTML file
            if not files and not any('html' in f.lower() for f in files.keys()):
                files['index.html'] = self._generate_fallback_html(response)
            
            return {"files": files}
            
        except Exception as e:
            logger.error(f"Error parsing {provider} response: {str(e)}")
            # Return fallback response
            return {
                "files": {
                    "index.html": self._generate_fallback_html(response),
                    "styles.css": "/* Generated styles */\nbody { font-family: Arial, sans-serif; margin: 0; padding: 20px; }",
                    "script.js": "// Generated JavaScript\nconsole.log('Website generated successfully!');"
                }
            }

    def _extract_code_blocks(self, response: str) -> Dict[str, str]:
        """Extract code from markdown code blocks"""
        files = {}
        lines = response.split('\n')
        
        current_language = None
        current_content = []
        in_code_block = False
        
        for line in lines:
            if line.strip().startswith('```'):
                if in_code_block:
                    # End of code block
                    if current_language and current_content:
                        filename = self._language_to_filename(current_language)
                        files[filename] = '\n'.join(current_content)
                    in_code_block = False
                    current_language = None
                    current_content = []
                else:
                    # Start of code block
                    in_code_block = True
                    current_language = line.strip()[3:].lower()
            elif in_code_block:
                current_content.append(line)
        
        return files

    def _language_to_filename(self, language: str) -> str:
        """Convert code block language to filename"""
        mapping = {
            'html': 'index.html',
            'css': 'styles.css', 
            'javascript': 'script.js',
            'js': 'script.js'
        }
        return mapping.get(language.lower(), f"{language}.txt")

    def _generate_fallback_html(self, content: str) -> str:
        """Generate a fallback HTML page"""
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Website</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }}
        .container {{ max-width: 800px; margin: 0 auto; }}
        h1 {{ color: #333; text-align: center; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Generated Website</h1>
        <div>
            <p>AI Response:</p>
            <pre style="background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto;">{content[:1000]}...</pre>
        </div>
    </div>
</body>
</html>"""