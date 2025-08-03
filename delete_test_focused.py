#!/usr/bin/env python3
"""
Focused Test for Project Deletion Functionality
Tests the recently fixed delete project feature
"""

import requests
import json
import time
from datetime import datetime

class DeleteFunctionalityTester:
    def __init__(self):
        # Get backend URL from frontend env
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.split('=')[1].strip()
                    break
        
        self.api_url = f"{self.base_url}/api"
        self.test_results = []
        
        print(f"🗑️  FOCUSED DELETE FUNCTIONALITY TEST")
        print(f"🔧 Testing Backend API at: {self.api_url}")
        print("=" * 60)

    def log_result(self, test_name: str, success: bool, details: str = "", error: str = ""):
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

    def get_projects_list(self):
        """Get current projects list"""
        try:
            response = requests.get(f"{self.api_url}/projects", timeout=30)
            if response.status_code == 200:
                data = response.json()
                return data.get("projects", []), data.get("total", 0)
        except Exception as e:
            print(f"Error getting projects: {e}")
        return [], 0

    def create_test_project(self):
        """Create a test project for deletion"""
        try:
            payload = {
                "prompt": "Create a simple test landing page for a company called 'TestCorp' for deletion testing",
                "website_type": "landing",
                "provider": "openai"
            }
            
            print("🔄 Creating test project for deletion...")
            response = requests.post(f"{self.api_url}/generate-website", 
                                   json=payload, timeout=120)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    project_id = data.get("project_id")
                    print(f"✅ Test project created with ID: {project_id}")
                    return {
                        "id": project_id,
                        "name": "TestCorp Landing Page",
                        "provider": "openai"
                    }
        except Exception as e:
            print(f"❌ Error creating test project: {e}")
        
        return None

    def test_1_delete_endpoint_functionality(self):
        """Test 1: DELETE /api/projects/{project_id} endpoint"""
        print("🧪 TEST 1: DELETE Endpoint Functionality")
        print("-" * 40)
        
        # Get or create a project to delete
        projects, total = self.get_projects_list()
        
        if not projects:
            # Create a test project
            test_project = self.create_test_project()
            if not test_project:
                self.log_result("DELETE Endpoint - Setup", False, 
                              error="Could not create test project")
                return None
            projects = [test_project]
        
        project_to_delete = projects[0]
        project_id = project_to_delete.get("id")
        project_name = project_to_delete.get("name", "Unknown")
        
        try:
            print(f"🗑️  Attempting to delete project: {project_name} (ID: {project_id})")
            
            response = requests.delete(f"{self.api_url}/projects/{project_id}", timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and "deleted successfully" in data.get("message", ""):
                    self.log_result("DELETE /api/projects/{id}", True, 
                                  f"Successfully deleted project '{project_name}'")
                    return project_id
                else:
                    self.log_result("DELETE /api/projects/{id}", False, 
                                  error=f"Invalid response: {data}")
            else:
                self.log_result("DELETE /api/projects/{id}", False, 
                              error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("DELETE /api/projects/{id}", False, error=str(e))
        
        return None

    def test_2_database_deletion_verification(self, deleted_project_id, initial_count):
        """Test 2: Verify deletion reflects in database"""
        print("🧪 TEST 2: Database Deletion Verification")
        print("-" * 40)
        
        try:
            # Wait a moment for database to update
            time.sleep(2)
            
            # Get updated projects list
            current_projects, current_total = self.get_projects_list()
            
            # Check if count decreased
            if current_total == initial_count - 1:
                # Check if deleted project is not in list
                project_ids = [p.get("id") for p in current_projects]
                
                if deleted_project_id not in project_ids:
                    self.log_result("Database Deletion Verification", True, 
                                  f"Project count: {initial_count} → {current_total}, deleted project not found in list")
                else:
                    self.log_result("Database Deletion Verification", False, 
                                  error="Deleted project still appears in projects list")
            else:
                self.log_result("Database Deletion Verification", False, 
                              error=f"Project count unchanged: {initial_count} → {current_total}")
                
        except Exception as e:
            self.log_result("Database Deletion Verification", False, error=str(e))

    def test_3_error_handling_404(self):
        """Test 3: Error handling for non-existent project"""
        print("🧪 TEST 3: Error Handling (404 for non-existent project)")
        print("-" * 40)
        
        try:
            fake_project_id = "nonexistent-project-12345-test"
            
            response = requests.delete(f"{self.api_url}/projects/{fake_project_id}", timeout=30)
            
            if response.status_code == 404:
                data = response.json()
                if "not found" in data.get("detail", "").lower():
                    self.log_result("404 Error Handling", True, 
                                  "Correctly returned 404 for non-existent project")
                else:
                    self.log_result("404 Error Handling", False, 
                                  error=f"404 returned but wrong message: {data}")
            else:
                self.log_result("404 Error Handling", False, 
                              error=f"Expected 404, got HTTP {response.status_code}")
                
        except Exception as e:
            self.log_result("404 Error Handling", False, error=str(e))

    def test_4_projects_list_after_deletion(self):
        """Test 4: GET /api/projects after deletion"""
        print("🧪 TEST 4: Projects List After Deletion")
        print("-" * 40)
        
        try:
            response = requests.get(f"{self.api_url}/projects", timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                if "projects" in data and "total" in data:
                    total_projects = data.get("total", 0)
                    projects_shown = len(data.get("projects", []))
                    
                    self.log_result("GET /api/projects After Deletion", True, 
                                  f"Projects list working: {total_projects} total, showing {projects_shown}")
                else:
                    self.log_result("GET /api/projects After Deletion", False, 
                                  error="Invalid response format")
            else:
                self.log_result("GET /api/projects After Deletion", False, 
                              error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("GET /api/projects After Deletion", False, error=str(e))

    def run_focused_delete_tests(self):
        """Run all focused delete functionality tests"""
        print("🚀 STARTING FOCUSED DELETE FUNCTIONALITY TESTS")
        print("=" * 60)
        
        # Get initial state
        initial_projects, initial_count = self.get_projects_list()
        print(f"📊 Initial state: {initial_count} projects in database")
        print()
        
        # Test 1: Delete endpoint functionality
        deleted_project_id = self.test_1_delete_endpoint_functionality()
        
        if deleted_project_id:
            # Test 2: Verify deletion in database
            self.test_2_database_deletion_verification(deleted_project_id, initial_count)
        
        # Test 3: Error handling (404)
        self.test_3_error_handling_404()
        
        # Test 4: Projects list after deletion
        self.test_4_projects_list_after_deletion()
        
        # Generate summary
        self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("=" * 60)
        print("📊 DELETE FUNCTIONALITY TEST SUMMARY")
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
        
        # Save results
        with open('/app/delete_test_results.json', 'w') as f:
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
        
        print("📄 Results saved to: /app/delete_test_results.json")

if __name__ == "__main__":
    tester = DeleteFunctionalityTester()
    tester.run_focused_delete_tests()