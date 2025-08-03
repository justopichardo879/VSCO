#!/usr/bin/env python3
"""
Direct Database Test for Project Deletion Functionality
Tests the delete functionality by directly accessing the database and API
"""

import sys
import os
import asyncio
import json
from datetime import datetime

# Add backend to path
sys.path.append('/app/backend')

from database import DatabaseService
from motor.motor_asyncio import AsyncIOMotorClient

class DirectDeleteTester:
    def __init__(self):
        self.test_results = []
        print("🗑️  DIRECT DELETE FUNCTIONALITY TEST")
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

    async def test_database_connection(self):
        """Test database connection"""
        try:
            db_service = DatabaseService()
            await db_service.connect()
            
            # Test basic database operation
            projects = await db_service.list_projects(1, 10)
            
            self.log_result("Database Connection", True, 
                          f"Connected successfully, found {projects.get('total', 0)} projects")
            
            await db_service.close()
            return True
            
        except Exception as e:
            self.log_result("Database Connection", False, error=str(e))
            return False

    async def test_delete_project_function(self):
        """Test the delete_project function directly"""
        try:
            db_service = DatabaseService()
            await db_service.connect()
            
            # First, get existing projects
            projects_data = await db_service.list_projects(1, 10)
            initial_count = projects_data.get('total', 0)
            projects = projects_data.get('projects', [])
            
            print(f"📊 Found {initial_count} projects in database")
            
            if initial_count == 0:
                # Create a test project first
                test_project_data = {
                    "success": True,
                    "files": {
                        "index.html": "<html><body><h1>Test Project for Deletion</h1></body></html>",
                        "styles.css": "body { font-family: Arial; }"
                    },
                    "metadata": {
                        "provider": "test",
                        "website_type": "landing",
                        "prompt": "Test project for deletion testing"
                    }
                }
                
                project_id = await db_service.save_project(test_project_data)
                print(f"✅ Created test project with ID: {project_id}")
                
                # Refresh projects list
                projects_data = await db_service.list_projects(1, 10)
                initial_count = projects_data.get('total', 0)
                projects = projects_data.get('projects', [])
            
            if projects:
                # Test deletion
                project_to_delete = projects[0]
                project_id = project_to_delete.get('id')
                
                print(f"🗑️  Testing deletion of project: {project_id}")
                
                # Call delete function
                deletion_result = await db_service.delete_project(project_id)
                
                if deletion_result:
                    # Verify deletion
                    updated_projects = await db_service.list_projects(1, 10)
                    new_count = updated_projects.get('total', 0)
                    
                    if new_count == initial_count - 1:
                        # Check if project is actually gone
                        deleted_project = await db_service.get_project(project_id)
                        
                        if deleted_project is None:
                            self.log_result("Delete Project Function", True, 
                                          f"Successfully deleted project, count: {initial_count} → {new_count}")
                        else:
                            self.log_result("Delete Project Function", False, 
                                          error="Project still exists after deletion")
                    else:
                        self.log_result("Delete Project Function", False, 
                                      error=f"Project count unchanged: {initial_count} → {new_count}")
                else:
                    self.log_result("Delete Project Function", False, 
                                  error="delete_project returned False")
            else:
                self.log_result("Delete Project Function", False, 
                              error="No projects available for testing")
            
            await db_service.close()
            
        except Exception as e:
            self.log_result("Delete Project Function", False, error=str(e))

    async def test_delete_nonexistent_project(self):
        """Test deletion of non-existent project"""
        try:
            db_service = DatabaseService()
            await db_service.connect()
            
            fake_project_id = "nonexistent-project-12345"
            
            result = await db_service.delete_project(fake_project_id)
            
            if result is False:
                self.log_result("Delete Non-existent Project", True, 
                              "Correctly returned False for non-existent project")
            else:
                self.log_result("Delete Non-existent Project", False, 
                              error="Should return False for non-existent project")
            
            await db_service.close()
            
        except Exception as e:
            self.log_result("Delete Non-existent Project", False, error=str(e))

    async def test_api_endpoint_structure(self):
        """Test that the API endpoint exists in server.py"""
        try:
            # Read server.py to check if DELETE endpoint exists
            with open('/app/backend/server.py', 'r') as f:
                server_content = f.read()
            
            # Check for DELETE endpoint
            has_delete_endpoint = '@api_router.delete("/projects/{project_id}")' in server_content
            has_delete_function = 'async def delete_project(project_id: str):' in server_content
            has_db_call = 'await db_service.delete_project(project_id)' in server_content
            
            if has_delete_endpoint and has_delete_function and has_db_call:
                self.log_result("API Endpoint Structure", True, 
                              "DELETE endpoint properly implemented in server.py")
            else:
                missing = []
                if not has_delete_endpoint:
                    missing.append("DELETE route decorator")
                if not has_delete_function:
                    missing.append("delete_project function")
                if not has_db_call:
                    missing.append("database service call")
                
                self.log_result("API Endpoint Structure", False, 
                              error=f"Missing: {', '.join(missing)}")
            
        except Exception as e:
            self.log_result("API Endpoint Structure", False, error=str(e))

    async def run_all_tests(self):
        """Run all direct tests"""
        print("🚀 STARTING DIRECT DELETE FUNCTIONALITY TESTS")
        print("=" * 60)
        
        # Test 1: Database connection
        db_connected = await self.test_database_connection()
        
        if db_connected:
            # Test 2: Delete project function
            await self.test_delete_project_function()
            
            # Test 3: Delete non-existent project
            await self.test_delete_nonexistent_project()
        
        # Test 4: API endpoint structure
        await self.test_api_endpoint_structure()
        
        # Generate summary
        self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("=" * 60)
        print("📊 DIRECT DELETE TEST SUMMARY")
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
        with open('/app/direct_delete_test_results.json', 'w') as f:
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
        
        print("📄 Results saved to: /app/direct_delete_test_results.json")

async def main():
    tester = DirectDeleteTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())