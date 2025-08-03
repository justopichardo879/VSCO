#!/usr/bin/env python3
"""
AI Enhancement Functionality Testing
Tests the recently fixed POST /api/enhance-project endpoint with apply=true
"""

import requests
import json
import sys
import os
from datetime import datetime
from typing import Dict, Any, Optional

class AIEnhancementTester:
    def __init__(self):
        # Get backend URL from frontend env
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.split('=')[1].strip()
                    break
        
        self.api_url = f"{self.base_url}/api"
        self.test_results = []
        
        print(f"🔧 Testing AI Enhancement Functionality at: {self.api_url}")
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

    def create_test_project(self) -> Optional[Dict[str, Any]]:
        """Create a test project for enhancement testing"""
        try:
            payload = {
                "prompt": "Create a professional landing page for TechCorp, a software development company specializing in web applications",
                "website_type": "landing",
                "provider": "openai"
            }
            
            response = requests.post(f"{self.api_url}/generate-website", 
                                   json=payload, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    project_id = data.get("project_id")
                    files = data.get("files", {})
                    
                    # Get HTML content for enhancement testing
                    html_content = ""
                    for filename, content in files.items():
                        if "html" in filename.lower():
                            html_content = content
                            break
                    
                    return {
                        "project_id": project_id,
                        "files": files,
                        "html_content": html_content
                    }
            
            return None
            
        except Exception as e:
            print(f"Error creating test project: {e}")
            return None

    def test_enhance_project_suggestions_mode(self, project_data: Dict[str, Any]):
        """Test enhancement endpoint in suggestions mode (apply=false)"""
        try:
            payload = {
                "project_id": project_data["project_id"],
                "current_content": project_data["html_content"],
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

    def test_enhance_project_apply_mode_visual(self, project_data: Dict[str, Any]):
        """Test enhancement endpoint with apply=true for visual improvements"""
        try:
            enhancement = {
                "type": "visual",
                "title": "Mejorar Paleta de Colores",
                "description": "Aplicar una paleta de colores moderna y profesional que mejore la legibilidad y el impacto visual",
                "impact": "high",
                "icon": "🎨"
            }
            
            payload = {
                "project_id": project_data["project_id"],
                "current_content": project_data["html_content"],
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

    def test_enhance_project_apply_mode_content(self, project_data: Dict[str, Any]):
        """Test enhancement endpoint with apply=true for content improvements"""
        try:
            enhancement = {
                "type": "content",
                "title": "Optimizar Contenido",
                "description": "Mejorar textos, llamadas a la acción y estructura del contenido para mayor conversión",
                "impact": "high",
                "icon": "📝"
            }
            
            payload = {
                "project_id": project_data["project_id"],
                "current_content": project_data["html_content"],
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

    def test_custom_prompt_enhancement(self, project_data: Dict[str, Any]):
        """Test custom prompt enhancement with apply=true"""
        try:
            enhancement = {
                "prompt": "Add a testimonials section with 3 customer reviews and improve the call-to-action buttons to be more prominent",
                "description": "Add testimonials section and improve CTA buttons"
            }
            
            payload = {
                "project_id": project_data["project_id"],
                "current_content": project_data["html_content"],
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

    def test_chat_interactive_enhancement(self, project_data: Dict[str, Any]):
        """Test chat-style interactive enhancement with apply=true"""
        try:
            enhancement = {
                "message": "Make the website more modern with better colors and add some animations",
                "description": "Modernize design with better colors and animations"
            }
            
            payload = {
                "project_id": project_data["project_id"],
                "current_content": project_data["html_content"],
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

    def verify_project_updated_in_database(self, project_id: str, original_files: Dict[str, str]):
        """Verify that the project was actually updated in the database"""
        try:
            response = requests.get(f"{self.api_url}/projects/{project_id}", timeout=10)
            
            if response.status_code == 200:
                updated_project = response.json()
                updated_files = updated_project.get("files", {})
                
                # Check if files were actually updated
                files_changed = False
                for filename, original_content in original_files.items():
                    if filename in updated_files:
                        if updated_files[filename] != original_content:
                            files_changed = True
                            break
                
                if files_changed:
                    # Check for enhancement metadata
                    metadata = updated_project.get("metadata", {})
                    is_enhanced = metadata.get("enhanced", False)
                    
                    if is_enhanced:
                        enhancement_applied = metadata.get("enhancement_applied", "Unknown")
                        details = f"Project updated in database with enhancement: {enhancement_applied}"
                        self.log_test("Database Update Verification", True, details)
                    else:
                        details = "Project files updated in database (enhancement metadata missing)"
                        self.log_test("Database Update Verification", True, details)
                else:
                    self.log_test("Database Update Verification", False, 
                                error="Project files were not updated in database")
            else:
                self.log_test("Database Update Verification", False, 
                            error=f"Could not retrieve updated project: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Database Update Verification", False, error=str(e))

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

    def test_enhancement_priority_logic(self, project_data: Dict[str, Any]):
        """Test that apply=true takes priority over enhancement_type"""
        try:
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
                "project_id": project_data["project_id"],
                "current_content": project_data["html_content"],
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

    def run_all_enhancement_tests(self):
        """Run all AI enhancement tests"""
        print("🚀 Starting AI Enhancement Functionality Testing")
        print("=" * 70)
        
        # Test 1: AI Service Integration
        self.test_ai_service_integration()
        
        # Test 2: Create test project
        print("📝 Creating test project for enhancement testing...")
        project_data = self.create_test_project()
        
        if not project_data:
            self.log_test("Test Project Creation", False, 
                        error="Could not create test project for enhancement testing")
            return
        
        self.log_test("Test Project Creation", True, 
                    f"Created project {project_data['project_id'][:8]}... with {len(project_data['files'])} files")
        
        # Store original files for comparison
        original_files = project_data["files"].copy()
        
        # Test 3: Enhancement Suggestions Mode (apply=false)
        self.test_enhance_project_suggestions_mode(project_data)
        
        # Test 4: Enhancement Priority Logic (apply=true takes priority)
        self.test_enhancement_priority_logic(project_data)
        
        # Test 5: Visual Enhancement with apply=true
        enhanced_visual = self.test_enhance_project_apply_mode_visual(project_data)
        
        # Test 6: Content Enhancement with apply=true
        enhanced_content = self.test_enhance_project_apply_mode_content(project_data)
        
        # Test 7: Custom Prompt Enhancement with apply=true
        enhanced_custom = self.test_custom_prompt_enhancement(project_data)
        
        # Test 8: Chat Interactive Enhancement with apply=true
        enhanced_chat = self.test_chat_interactive_enhancement(project_data)
        
        # Test 9: Verify Database Updates
        if enhanced_visual or enhanced_content or enhanced_custom or enhanced_chat:
            self.verify_project_updated_in_database(project_data["project_id"], original_files)
        
        # Generate Summary
        self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("=" * 70)
        print("📊 AI ENHANCEMENT TEST SUMMARY")
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
        
        # Save detailed results
        with open('/app/ai_enhancement_test_results.json', 'w') as f:
            json.dump({
                "summary": {
                    "total": total_tests,
                    "passed": passed_tests,
                    "failed": failed_tests,
                    "success_rate": (passed_tests/total_tests)*100
                },
                "results": self.test_results,
                "timestamp": datetime.now().isoformat()
            }, f, indent=2)
        
        print("📄 Detailed results saved to: /app/ai_enhancement_test_results.json")

if __name__ == "__main__":
    tester = AIEnhancementTester()
    tester.run_all_enhancement_tests()