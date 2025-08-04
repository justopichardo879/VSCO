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
        
    async def create_chat_instance(self, provider: str, session_id: str = None) -> LlmChat:
        """Create a new LlmChat instance for the specified provider"""
        if not session_id:
            session_id = str(uuid.uuid4())
            
        system_message = """You are a world-class web developer and designer with expertise in creating professional, modern websites. 

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

        if provider == "openai":
            if not self.openai_key:
                raise ValueError("OpenAI API key not found")
            chat = LlmChat(
                api_key=self.openai_key,
                session_id=session_id,
                system_message=system_message
            ).with_model("openai", "gpt-3.5-turbo").with_max_tokens(8192)
            
        elif provider == "gemini":
            if not self.gemini_key:
                raise ValueError("Gemini API key not found")
            chat = LlmChat(
                api_key=self.gemini_key,
                session_id=session_id,
                system_message=system_message
            ).with_model("gemini", "gemini-1.5-pro").with_max_tokens(8192)
            
        else:
            raise ValueError(f"Unsupported provider: {provider}")
            
        return chat

    async def generate_website(self, prompt: str, provider: str, website_type: str = "landing") -> Dict[str, Any]:
        """Generate a complete website using the specified AI provider"""
        session_id = str(uuid.uuid4())
        
        try:
            # Create specialized prompts based on website type
            enhanced_prompt = self._enhance_prompt(prompt, website_type)
            
            chat = await self.create_chat_instance(provider, session_id)
            
            user_message = UserMessage(text=enhanced_prompt)
            
            # Add timeout to prevent hanging
            try:
                response = await asyncio.wait_for(
                    chat.send_message(user_message),
                    timeout=120  # 2 minutes timeout
                )
            except asyncio.TimeoutError:
                logger.error(f"Timeout waiting for {provider} response after 120 seconds")
                return {
                    "success": False,
                    "error": f"Timeout: {provider} took too long to respond. Please try again.",
                    "provider": provider
                }
            except Exception as api_error:
                logger.error(f"API error from {provider}: {str(api_error)}")
                return {
                    "success": False,
                    "error": f"API Error: {str(api_error)}",
                    "provider": provider
                }
            
            # Parse the response and extract code
            parsed_result = self._parse_ai_response(response, provider)
            
            return {
                "success": True,
                "provider": provider,
                "website_type": website_type,
                "session_id": session_id,
                "files": parsed_result["files"],
                "metadata": {
                    "generated_at": datetime.utcnow().isoformat(),
                    "prompt": prompt,
                    "enhanced_prompt": enhanced_prompt,
                    "provider": provider,
                    "model": "gpt-3.5-turbo" if provider == "openai" else "gemini-1.5-pro"
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