#!/usr/bin/env python3
"""
Direct AI Enhancement Testing
Tests the enhance-project endpoint directly without creating projects
"""

import requests
import json
import uuid
from datetime import datetime

class DirectEnhancementTester:
    def __init__(self):
        # Get backend URL from frontend env
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.split('=')[1].strip()
                    break
        
        self.api_url = f"{self.base_url}/api"
        self.test_results = []
        
        print(f"🔧 Testing AI Enhancement Endpoint at: {self.api_url}")
        print("=" * 70)

    def log_test(self, test_name: str, success: bool, details: str = "", error: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        })
        
        print(f"{status} {test_name}")
        if details:
            print(f"   📝 {details}")
        if error:
            print(f"   ⚠️  {error}")
        print()

    def test_enhancement_suggestions_mode(self):
        """Test enhancement endpoint in suggestions mode (apply=false)"""
        try:
            sample_html = """
            <!DOCTYPE html>
            <html>
            <head><title>Test Website</title></head>
            <body>
                <h1>Welcome to TechCorp</h1>
                <p>We are a software development company.</p>
                <button>Contact Us</button>
            </body>
            </html>
            """
            
            payload = {
                "project_id": str(uuid.uuid4()),
                "current_content": sample_html,
                "enhancement_type": "suggestions",
                "apply": False
            }
            
            response = requests.post(f"{self.api_url}/enhance-project", 
                                   json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and "suggestions" in data:
                    suggestions = data.get("suggestions", [])
                    if len(suggestions) > 0:
                        details = f"Generated {len(suggestions)} enhancement suggestions"
                        self.log_test("Enhancement Suggestions Mode", True, details)
                        return True
                    else:
                        self.log_test("Enhancement Suggestions Mode", False, 
                                    error="No suggestions generated")
                else:
                    self.log_test("Enhancement Suggestions Mode", False, 
                                error=f"Invalid response: {data}")
            else:
                self.log_test("Enhancement Suggestions Mode", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Enhancement Suggestions Mode", False, error=str(e))
        
        return False

    def test_enhancement_apply_mode_visual(self):
        """Test enhancement endpoint with apply=true for visual improvements"""
        try:
            sample_html = """
            <!DOCTYPE html>
            <html>
            <head><title>Test Website</title></head>
            <body>
                <h1>Welcome to TechCorp</h1>
                <p>We are a software development company.</p>
                <button>Contact Us</button>
            </body>
            </html>
            """
            
            enhancement = {
                "type": "visual",
                "title": "Mejorar Paleta de Colores",
                "description": "Aplicar una paleta de colores moderna y profesional que mejore la legibilidad y el impacto visual",
                "impact": "high",
                "icon": "🎨"
            }
            
            payload = {
                "project_id": str(uuid.uuid4()),
                "current_content": sample_html,
                "enhancement": enhancement,
                "apply": True,
                "modification_type": "enhancement"
            }
            
            response = requests.post(f"{self.api_url}/enhance-project", 
                                   json=payload, timeout=90)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and "enhanced_project" in data:
                    enhanced_project = data.get("enhanced_project", {})
                    enhanced_files = enhanced_project.get("files", {})
                    
                    if len(enhanced_files) > 0:
                        # Verify files were actually enhanced
                        has_html = any("html" in f.lower() for f in enhanced_files.keys())
                        has_css = any("css" in f.lower() for f in enhanced_files.keys())
                        
                        if has_html and has_css:
                            details = f"Successfully applied visual enhancement, generated {len(enhanced_files)} files"
                            self.log_test("Enhancement Apply Mode - Visual", True, details)
                            return enhanced_project
                        else:
                            self.log_test("Enhancement Apply Mode - Visual", False, 
                                        error="Missing essential files in enhanced project")
                    else:
                        self.log_test("Enhancement Apply Mode - Visual", False, 
                                    error="No enhanced files generated")
                else:
                    self.log_test("Enhancement Apply Mode - Visual", False, 
                                error=f"Enhancement failed: {data.get('error', 'Unknown error')}")
            else:
                self.log_test("Enhancement Apply Mode - Visual", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Enhancement Apply Mode - Visual", False, error=str(e))
        
        return None

    def test_enhancement_apply_mode_content(self):
        """Test enhancement endpoint with apply=true for content improvements"""
        try:
            sample_html = """
            <!DOCTYPE html>
            <html>
            <head><title>Test Website</title></head>
            <body>
                <h1>Welcome to TechCorp</h1>
                <p>We are a software development company.</p>
                <button>Contact Us</button>
            </body>
            </html>
            """
            
            enhancement = {
                "type": "content",
                "title": "Optimizar Contenido",
                "description": "Mejorar textos, llamadas a la acción y estructura del contenido para mayor conversión",
                "impact": "high",
                "icon": "📝"
            }
            
            payload = {
                "project_id": str(uuid.uuid4()),
                "current_content": sample_html,
                "enhancement": enhancement,
                "apply": True,
                "modification_type": "enhancement"
            }
            
            response = requests.post(f"{self.api_url}/enhance-project", 
                                   json=payload, timeout=90)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and "enhanced_project" in data:
                    enhanced_project = data.get("enhanced_project", {})
                    enhanced_files = enhanced_project.get("files", {})
                    
                    if len(enhanced_files) > 0:
                        details = f"Successfully applied content enhancement, generated {len(enhanced_files)} files"
                        self.log_test("Enhancement Apply Mode - Content", True, details)
                        return enhanced_project
                    else:
                        self.log_test("Enhancement Apply Mode - Content", False, 
                                    error="No enhanced files generated")
                else:
                    self.log_test("Enhancement Apply Mode - Content", False, 
                                error=f"Enhancement failed: {data.get('error', 'Unknown error')}")
            else:
                self.log_test("Enhancement Apply Mode - Content", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Enhancement Apply Mode - Content", False, error=str(e))
        
        return None

    def test_custom_prompt_enhancement(self):
        """Test custom prompt enhancement with apply=true"""
        try:
            sample_html = """
            <!DOCTYPE html>
            <html>
            <head><title>Test Website</title></head>
            <body>
                <h1>Welcome to TechCorp</h1>
                <p>We are a software development company.</p>
                <button>Contact Us</button>
            </body>
            </html>
            """
            
            enhancement = {
                "prompt": "Add a testimonials section with 3 customer reviews and improve the call-to-action buttons to be more prominent",
                "description": "Add testimonials section and improve CTA buttons"
            }
            
            payload = {
                "project_id": str(uuid.uuid4()),
                "current_content": sample_html,
                "enhancement": enhancement,
                "apply": True,
                "modification_type": "custom_prompt"
            }
            
            response = requests.post(f"{self.api_url}/enhance-project", 
                                   json=payload, timeout=90)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and "enhanced_project" in data:
                    enhanced_project = data.get("enhanced_project", {})
                    enhanced_files = enhanced_project.get("files", {})
                    
                    if len(enhanced_files) > 0:
                        details = f"Successfully applied custom prompt enhancement, generated {len(enhanced_files)} files"
                        self.log_test("Custom Prompt Enhancement", True, details)
                        return enhanced_project
                    else:
                        self.log_test("Custom Prompt Enhancement", False, 
                                    error="No enhanced files generated")
                else:
                    self.log_test("Custom Prompt Enhancement", False, 
                                error=f"Enhancement failed: {data.get('error', 'Unknown error')}")
            else:
                self.log_test("Custom Prompt Enhancement", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Custom Prompt Enhancement", False, error=str(e))
        
        return None

    def test_chat_interactive_enhancement(self):
        """Test chat-style interactive enhancement with apply=true"""
        try:
            sample_html = """
            <!DOCTYPE html>
            <html>
            <head><title>Test Website</title></head>
            <body>
                <h1>Welcome to TechCorp</h1>
                <p>We are a software development company.</p>
                <button>Contact Us</button>
            </body>
            </html>
            """
            
            enhancement = {
                "message": "Make the website more modern with better colors and add some animations",
                "description": "Modernize design with better colors and animations"
            }
            
            payload = {
                "project_id": str(uuid.uuid4()),
                "current_content": sample_html,
                "enhancement": enhancement,
                "apply": True,
                "modification_type": "chat_interactive"
            }
            
            response = requests.post(f"{self.api_url}/enhance-project", 
                                   json=payload, timeout=90)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and "enhanced_project" in data:
                    enhanced_project = data.get("enhanced_project", {})
                    enhanced_files = enhanced_project.get("files", {})
                    
                    if len(enhanced_files) > 0:
                        details = f"Successfully applied chat interactive enhancement, generated {len(enhanced_files)} files"
                        self.log_test("Chat Interactive Enhancement", True, details)
                        return enhanced_project
                    else:
                        self.log_test("Chat Interactive Enhancement", False, 
                                    error="No enhanced files generated")
                else:
                    self.log_test("Chat Interactive Enhancement", False, 
                                error=f"Enhancement failed: {data.get('error', 'Unknown error')}")
            else:
                self.log_test("Chat Interactive Enhancement", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Chat Interactive Enhancement", False, error=str(e))
        
        return None

    def test_enhancement_priority_logic(self):
        """Test that apply=true takes priority over enhancement_type"""
        try:
            sample_html = """
            <!DOCTYPE html>
            <html>
            <head><title>Test Website</title></head>
            <body>
                <h1>Welcome to TechCorp</h1>
                <p>We are a software development company.</p>
                <button>Contact Us</button>
            </body>
            </html>
            """
            
            # Send request with apply=true AND enhancement_type=suggestions
            # Should apply enhancement, not return suggestions
            enhancement = {
                "type": "performance",
                "title": "Optimización SEO",
                "description": "Mejorar meta tags, estructura semántica y rendimiento para mejor posicionamiento",
                "impact": "medium",
                "icon": "🚀"
            }
            
            payload = {
                "project_id": str(uuid.uuid4()),
                "current_content": sample_html,
                "enhancement": enhancement,
                "enhancement_type": "suggestions",  # This should be ignored
                "apply": True  # This should take priority
            }
            
            response = requests.post(f"{self.api_url}/enhance-project", 
                                   json=payload, timeout=90)
            
            if response.status_code == 200:
                data = response.json()
                
                # Should return enhanced_project, NOT suggestions
                if data.get("success"):
                    if "enhanced_project" in data and "suggestions" not in data:
                        details = "apply=true correctly took priority over enhancement_type=suggestions"
                        self.log_test("Enhancement Priority Logic", True, details)
                    elif "suggestions" in data:
                        self.log_test("Enhancement Priority Logic", False, 
                                    error="Returned suggestions instead of applying enhancement")
                    else:
                        self.log_test("Enhancement Priority Logic", False, 
                                    error="Unexpected response format")
                else:
                    self.log_test("Enhancement Priority Logic", False, 
                                error=f"Enhancement failed: {data.get('error', 'Unknown error')}")
            else:
                self.log_test("Enhancement Priority Logic", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Enhancement Priority Logic", False, error=str(e))

    def test_ai_service_integration(self):
        """Test that AI service is properly integrated and accessible"""
        try:
            # Test by checking AI providers endpoint
            response = requests.get(f"{self.api_url}/ai-providers", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                providers = data.get("providers", [])
                
                # Check if OpenAI is configured (used for enhancements)
                openai_provider = next((p for p in providers if p.get("id") == "openai"), None)
                
                if openai_provider:
                    model = openai_provider.get("model", "")
                    if "gpt-4" in model.lower():
                        details = f"AI service integrated with {model} for enhancements"
                        self.log_test("AI Service Integration", True, details)
                    else:
                        self.log_test("AI Service Integration", False, 
                                    error=f"Unexpected model: {model}")
                else:
                    self.log_test("AI Service Integration", False, 
                                error="OpenAI provider not found")
            else:
                self.log_test("AI Service Integration", False, 
                            error=f"Could not verify AI providers: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("AI Service Integration", False, error=str(e))

    def run_all_tests(self):
        """Run all enhancement tests"""
        print("🚀 Starting Direct AI Enhancement Testing")
        print("=" * 70)
        
        # Test 1: AI Service Integration
        self.test_ai_service_integration()
        
        # Test 2: Enhancement Suggestions Mode (apply=false)
        self.test_enhancement_suggestions_mode()
        
        # Test 3: Enhancement Priority Logic (apply=true takes priority)
        self.test_enhancement_priority_logic()
        
        # Test 4: Visual Enhancement with apply=true
        self.test_enhancement_apply_mode_visual()
        
        # Test 5: Content Enhancement with apply=true
        self.test_enhancement_apply_mode_content()
        
        # Test 6: Custom Prompt Enhancement with apply=true
        self.test_custom_prompt_enhancement()
        
        # Test 7: Chat Interactive Enhancement with apply=true
        self.test_chat_interactive_enhancement()
        
        # Generate Summary
        self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("=" * 70)
        print("📊 DIRECT AI ENHANCEMENT TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['error']}")
            print()
        
        print("✅ PASSED TESTS:")
        for result in self.test_results:
            if result["success"]:
                print(f"   • {result['test']}")
        
        print("\n" + "=" * 70)

if __name__ == "__main__":
    tester = DirectEnhancementTester()
    tester.run_all_tests()