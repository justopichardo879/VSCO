#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Professional Website Generator
Tests all backend APIs, AI integration, and database operations
"""

import asyncio
import json
import os
import sys
import requests
from datetime import datetime
from typing import Dict, Any, List

# Add backend to path for imports
sys.path.append('/app/backend')

class BackendTester:
    def __init__(self):
        # Get backend URL from frontend env
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.split('=')[1].strip()
                    break
        
        self.api_url = f"{self.base_url}/api"
        self.test_results = []
        
        print(f"🔧 Testing Backend API at: {self.api_url}")
        print("=" * 60)

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

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "Professional Website Generator API" in data.get("message", ""):
                    self.log_test("API Root Endpoint", True, 
                                f"Version: {data.get('version', 'unknown')}")
                else:
                    self.log_test("API Root Endpoint", False, 
                                error="Invalid response format")
            else:
                self.log_test("API Root Endpoint", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("API Root Endpoint", False, error=str(e))

    def test_ai_providers_endpoint(self):
        """Test AI providers configuration endpoint"""
        try:
            response = requests.get(f"{self.api_url}/ai-providers", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                providers = data.get("providers", [])
                
                # Check if both OpenAI and Gemini are configured
                provider_ids = [p.get("id") for p in providers]
                
                if "openai" in provider_ids and "gemini" in provider_ids:
                    openai_provider = next(p for p in providers if p["id"] == "openai")
                    gemini_provider = next(p for p in providers if p["id"] == "gemini")
                    
                    details = f"OpenAI: {openai_provider.get('model')}, Gemini: {gemini_provider.get('model')}"
                    self.log_test("AI Providers Configuration", True, details)
                else:
                    self.log_test("AI Providers Configuration", False, 
                                error=f"Missing providers. Found: {provider_ids}")
            else:
                self.log_test("AI Providers Configuration", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("AI Providers Configuration", False, error=str(e))

    def test_website_types_endpoint(self):
        """Test website types endpoint"""
        try:
            response = requests.get(f"{self.api_url}/website-types", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                types = data.get("types", [])
                
                # Check if all 5 website types are available
                expected_types = ["landing", "business", "portfolio", "ecommerce", "blog"]
                available_types = [t.get("id") for t in types]
                
                if all(t in available_types for t in expected_types):
                    self.log_test("Website Types Endpoint", True, 
                                f"All 5 types available: {', '.join(available_types)}")
                else:
                    missing = [t for t in expected_types if t not in available_types]
                    self.log_test("Website Types Endpoint", False, 
                                error=f"Missing types: {missing}")
            else:
                self.log_test("Website Types Endpoint", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Website Types Endpoint", False, error=str(e))

    def test_website_generation_openai(self):
        """Test website generation with OpenAI"""
        try:
            payload = {
                "prompt": "Create a professional landing page for a modern tech startup called 'InnovateTech' that specializes in AI solutions",
                "website_type": "landing",
                "provider": "openai"
            }
            
            response = requests.post(f"{self.api_url}/generate-website", 
                                   json=payload, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success"):
                    files = data.get("files", {})
                    metadata = data.get("metadata", {})
                    
                    # Check if essential files are generated
                    has_html = any("html" in f.lower() for f in files.keys())
                    has_css = any("css" in f.lower() for f in files.keys())
                    
                    if has_html and has_css:
                        details = f"Generated {len(files)} files, Provider: {metadata.get('provider')}"
                        self.log_test("OpenAI Website Generation", True, details)
                        return data  # Return for further testing
                    else:
                        self.log_test("OpenAI Website Generation", False, 
                                    error="Missing essential files (HTML/CSS)")
                else:
                    self.log_test("OpenAI Website Generation", False, 
                                error=data.get("error", "Generation failed"))
            else:
                self.log_test("OpenAI Website Generation", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("OpenAI Website Generation", False, error=str(e))
        
        return None

    def test_website_generation_gemini(self):
        """Test website generation with Gemini"""
        try:
            payload = {
                "prompt": "Create a professional business website for a consulting firm called 'Strategic Solutions' with services and team sections",
                "website_type": "business", 
                "provider": "gemini"
            }
            
            response = requests.post(f"{self.api_url}/generate-website", 
                                   json=payload, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success"):
                    files = data.get("files", {})
                    metadata = data.get("metadata", {})
                    
                    # Check if essential files are generated
                    has_html = any("html" in f.lower() for f in files.keys())
                    has_css = any("css" in f.lower() for f in files.keys())
                    
                    if has_html and has_css:
                        details = f"Generated {len(files)} files, Provider: {metadata.get('provider')}"
                        self.log_test("Gemini Website Generation", True, details)
                        return data  # Return for further testing
                    else:
                        self.log_test("Gemini Website Generation", False, 
                                    error="Missing essential files (HTML/CSS)")
                else:
                    self.log_test("Gemini Website Generation", False, 
                                error=data.get("error", "Generation failed"))
            else:
                self.log_test("Gemini Website Generation", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Gemini Website Generation", False, error=str(e))
        
        return None

    def test_provider_comparison(self):
        """Test provider comparison mode"""
        try:
            payload = {
                "prompt": "Create a professional portfolio website for a graphic designer showcasing creative work",
                "website_type": "portfolio",
                "provider": None  # This triggers comparison mode
            }
            
            response = requests.post(f"{self.api_url}/generate-website", 
                                   json=payload, timeout=120)  # Longer timeout for comparison
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success"):
                    results = data.get("results", {})
                    
                    # Check if both providers generated results
                    if "openai" in results and "gemini" in results:
                        openai_success = results["openai"].get("success", False)
                        gemini_success = results["gemini"].get("success", False)
                        
                        if openai_success and gemini_success:
                            details = f"Both providers generated successfully, Comparison ID: {data.get('comparison_id')}"
                            self.log_test("Provider Comparison Mode", True, details)
                            return data
                        else:
                            failed_providers = []
                            if not openai_success:
                                failed_providers.append("OpenAI")
                            if not gemini_success:
                                failed_providers.append("Gemini")
                            
                            self.log_test("Provider Comparison Mode", False, 
                                        error=f"Failed providers: {', '.join(failed_providers)}")
                    else:
                        self.log_test("Provider Comparison Mode", False, 
                                    error="Missing provider results")
                else:
                    self.log_test("Provider Comparison Mode", False, 
                                error=data.get("error", "Comparison failed"))
            else:
                self.log_test("Provider Comparison Mode", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Provider Comparison Mode", False, error=str(e))
        
        return None

    def test_projects_list(self):
        """Test projects listing endpoint"""
        try:
            response = requests.get(f"{self.api_url}/projects", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if "projects" in data and "total" in data:
                    total_projects = data.get("total", 0)
                    projects_count = len(data.get("projects", []))
                    
                    details = f"Found {total_projects} total projects, showing {projects_count}"
                    self.log_test("Projects List Endpoint", True, details)
                    
                    return data.get("projects", [])
                else:
                    self.log_test("Projects List Endpoint", False, 
                                error="Invalid response format")
            else:
                self.log_test("Projects List Endpoint", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Projects List Endpoint", False, error=str(e))
        
        return []

    def test_project_retrieval(self, projects: List[Dict]):
        """Test individual project retrieval"""
        if not projects:
            self.log_test("Project Retrieval", False, error="No projects available to test")
            return
        
        try:
            # Test with first project
            project = projects[0]
            project_id = project.get("id")
            
            if not project_id:
                self.log_test("Project Retrieval", False, error="Project missing ID")
                return
            
            response = requests.get(f"{self.api_url}/projects/{project_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("id") == project_id:
                    files_count = len(data.get("files", []))
                    details = f"Retrieved project {project_id[:8]}... with {files_count} files"
                    self.log_test("Project Retrieval", True, details)
                else:
                    self.log_test("Project Retrieval", False, 
                                error="Project ID mismatch")
            elif response.status_code == 404:
                self.log_test("Project Retrieval", False, 
                            error="Project not found (404)")
            else:
                self.log_test("Project Retrieval", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Project Retrieval", False, error=str(e))

    def test_project_deletion_functionality(self):
        """Test project deletion functionality comprehensively"""
        print("🗑️  TESTING PROJECT DELETION FUNCTIONALITY")
        print("-" * 50)
        
        # First, get current projects list
        initial_projects = self.get_projects_for_testing()
        initial_count = len(initial_projects)
        
        if initial_count == 0:
            # Create a test project first
            test_project = self.create_test_project_for_deletion()
            if not test_project:
                self.log_test("Project Deletion Setup", False, 
                            error="Could not create test project for deletion testing")
                return
            
            # Refresh projects list
            initial_projects = self.get_projects_for_testing()
            initial_count = len(initial_projects)
        
        if initial_count == 0:
            self.log_test("Project Deletion - No Projects", False, 
                        error="No projects available for deletion testing")
            return
        
        # Test 1: Delete existing project
        self.test_delete_existing_project(initial_projects[0])
        
        # Test 2: Verify deletion in database (check projects list)
        self.test_verify_deletion_in_database(initial_projects[0]["id"], initial_count)
        
        # Test 3: Test deletion of non-existent project (404 error)
        self.test_delete_nonexistent_project()
        
        # Test 4: Test GET /api/projects after deletion
        self.test_projects_list_after_deletion(initial_count - 1)

    def get_projects_for_testing(self):
        """Get projects list for testing purposes"""
        try:
            response = requests.get(f"{self.api_url}/projects", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data.get("projects", [])
        except Exception:
            pass
        return []

    def create_test_project_for_deletion(self):
        """Create a test project specifically for deletion testing"""
        try:
            payload = {
                "prompt": "Create a simple test website for deletion testing purposes",
                "website_type": "landing",
                "provider": "openai"
            }
            
            response = requests.post(f"{self.api_url}/generate-website", 
                                   json=payload, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    return data
        except Exception as e:
            print(f"Error creating test project: {e}")
        
        return None

    def test_delete_existing_project(self, project):
        """Test DELETE /api/projects/{project_id} endpoint"""
        try:
            project_id = project.get("id")
            project_name = project.get("name", "Unknown")
            
            response = requests.delete(f"{self.api_url}/projects/{project_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and "deleted successfully" in data.get("message", ""):
                    details = f"Successfully deleted project '{project_name}' (ID: {project_id[:8]}...)"
                    self.log_test("DELETE Project Endpoint", True, details)
                    return True
                else:
                    self.log_test("DELETE Project Endpoint", False, 
                                error=f"Invalid response format: {data}")
            else:
                self.log_test("DELETE Project Endpoint", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("DELETE Project Endpoint", False, error=str(e))
        
        return False

    def test_verify_deletion_in_database(self, deleted_project_id, initial_count):
        """Verify that project was actually deleted from database"""
        try:
            # Check projects list
            current_projects = self.get_projects_for_testing()
            current_count = len(current_projects)
            
            # Verify count decreased
            if current_count == initial_count - 1:
                # Verify specific project is not in list
                project_ids = [p.get("id") for p in current_projects]
                
                if deleted_project_id not in project_ids:
                    details = f"Project count decreased from {initial_count} to {current_count}, deleted project not in list"
                    self.log_test("Database Deletion Verification", True, details)
                else:
                    self.log_test("Database Deletion Verification", False, 
                                error="Deleted project still appears in projects list")
            else:
                self.log_test("Database Deletion Verification", False, 
                            error=f"Project count unchanged: {initial_count} -> {current_count}")
                
        except Exception as e:
            self.log_test("Database Deletion Verification", False, error=str(e))

    def test_delete_nonexistent_project(self):
        """Test deletion of non-existent project (should return 404)"""
        try:
            fake_project_id = "nonexistent-project-id-12345"
            
            response = requests.delete(f"{self.api_url}/projects/{fake_project_id}", timeout=10)
            
            if response.status_code == 404:
                data = response.json()
                if "not found" in data.get("detail", "").lower():
                    details = f"Correctly returned 404 for non-existent project ID"
                    self.log_test("Delete Non-existent Project (404)", True, details)
                else:
                    self.log_test("Delete Non-existent Project (404)", False, 
                                error="404 returned but wrong error message")
            else:
                self.log_test("Delete Non-existent Project (404)", False, 
                            error=f"Expected 404, got HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Delete Non-existent Project (404)", False, error=str(e))

    def test_projects_list_after_deletion(self, expected_count):
        """Test GET /api/projects after deletion to confirm list updates"""
        try:
            response = requests.get(f"{self.api_url}/projects", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if "projects" in data and "total" in data:
                    actual_count = data.get("total", 0)
                    projects_shown = len(data.get("projects", []))
                    
                    if actual_count == expected_count:
                        details = f"Projects list correctly updated: {actual_count} total, showing {projects_shown}"
                        self.log_test("Projects List After Deletion", True, details)
                    else:
                        self.log_test("Projects List After Deletion", False, 
                                    error=f"Expected {expected_count} projects, found {actual_count}")
                else:
                    self.log_test("Projects List After Deletion", False, 
                                error="Invalid response format")
            else:
                self.log_test("Projects List After Deletion", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Projects List After Deletion", False, error=str(e))

    def test_database_connectivity(self):
        """Test database connectivity through API"""
        try:
            # Test by creating a simple status check (legacy endpoint)
            payload = {
                "status": "testing_db_connectivity",
                "timestamp": datetime.now().isoformat()
            }
            
            response = requests.post(f"{self.api_url}/status", json=payload, timeout=10)
            
            if response.status_code == 200:
                # Now try to retrieve it
                get_response = requests.get(f"{self.api_url}/status", timeout=10)
                
                if get_response.status_code == 200:
                    status_checks = get_response.json()
                    if isinstance(status_checks, list):
                        self.log_test("Database Connectivity", True, 
                                    f"Database operations working, {len(status_checks)} status checks found")
                    else:
                        self.log_test("Database Connectivity", False, 
                                    error="Invalid status checks format")
                else:
                    self.log_test("Database Connectivity", False, 
                                error=f"Failed to retrieve status: HTTP {get_response.status_code}")
            else:
                self.log_test("Database Connectivity", False, 
                            error=f"Failed to create status: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Database Connectivity", False, error=str(e))

    def test_api_keys_configuration(self):
        """Test API keys are properly configured"""
        try:
            # Check backend .env file
            env_path = "/app/backend/.env"
            if not os.path.exists(env_path):
                self.log_test("API Keys Configuration", False, error=".env file not found")
                return
            
            with open(env_path, 'r') as f:
                env_content = f.read()
            
            has_openai = "OPENAI_API_KEY=" in env_content and "sk-proj-" in env_content
            has_gemini = "GEMINI_API_KEY=" in env_content and "AIzaSy" in env_content
            
            if has_openai and has_gemini:
                self.log_test("API Keys Configuration", True, 
                            "Both OpenAI and Gemini API keys configured")
            else:
                missing = []
                if not has_openai:
                    missing.append("OpenAI")
                if not has_gemini:
                    missing.append("Gemini")
                
                self.log_test("API Keys Configuration", False, 
                            error=f"Missing API keys: {', '.join(missing)}")
                
        except Exception as e:
            self.log_test("API Keys Configuration", False, error=str(e))

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Comprehensive Backend Testing")
        print("=" * 60)
        
        # Test 1: API Root
        self.test_api_root()
        
        # Test 2: API Keys Configuration
        self.test_api_keys_configuration()
        
        # Test 3: AI Providers Configuration
        self.test_ai_providers_endpoint()
        
        # Test 4: Website Types
        self.test_website_types_endpoint()
        
        # Test 5: Database Connectivity
        self.test_database_connectivity()
        
        # Test 6: OpenAI Website Generation
        openai_result = self.test_website_generation_openai()
        
        # Test 7: Gemini Website Generation  
        gemini_result = self.test_website_generation_gemini()
        
        # Test 8: Provider Comparison
        comparison_result = self.test_provider_comparison()
        
        # Test 9: Projects List
        projects = self.test_projects_list()
        
        # Test 10: Project Retrieval
        self.test_project_retrieval(projects)
        
        # Test 11: PROJECT DELETION FUNCTIONALITY (FOCUS TEST)
        self.test_project_deletion_functionality()
        
        # Generate Summary
        self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
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
        
        print("\n" + "=" * 60)
        
        # Save detailed results
        with open('/app/backend_test_results.json', 'w') as f:
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
        
        print("📄 Detailed results saved to: /app/backend_test_results.json")

if __name__ == "__main__":
    tester = BackendTester()
    tester.run_all_tests()