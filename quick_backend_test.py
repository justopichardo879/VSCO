#!/usr/bin/env python3
"""
Quick Backend Testing for Professional Website Generator
Tests core API endpoints without time-consuming AI generation
"""

import requests
import json
from datetime import datetime

class QuickBackendTester:
    def __init__(self):
        # Get backend URL from frontend env
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.split('=')[1].strip()
                    break
        
        self.api_url = f"{self.base_url}/api"
        self.results = []
        
        print(f"🔧 Quick Testing Backend API at: {self.api_url}")
        print("=" * 60)

    def test_endpoint(self, name, endpoint, method="GET", payload=None, timeout=10):
        """Test a single endpoint"""
        try:
            if method == "GET":
                response = requests.get(f"{self.api_url}{endpoint}", timeout=timeout)
            elif method == "POST":
                response = requests.post(f"{self.api_url}{endpoint}", json=payload, timeout=timeout)
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                print(f"✅ {name}: OK")
                if isinstance(data, dict):
                    if "message" in data:
                        print(f"   📝 {data['message']}")
                    elif "providers" in data:
                        providers = [p["id"] for p in data["providers"]]
                        print(f"   📝 Providers: {', '.join(providers)}")
                    elif "types" in data:
                        types = [t["id"] for t in data["types"]]
                        print(f"   📝 Types: {', '.join(types)}")
                    elif "projects" in data:
                        print(f"   📝 Found {data.get('total', 0)} projects")
                
                self.results.append({"test": name, "success": True, "status": response.status_code})
            else:
                print(f"❌ {name}: HTTP {response.status_code}")
                print(f"   ⚠️  {response.text[:100]}...")
                self.results.append({"test": name, "success": False, "status": response.status_code})
                
        except Exception as e:
            print(f"❌ {name}: {str(e)}")
            self.results.append({"test": name, "success": False, "error": str(e)})
        
        print()

    def run_tests(self):
        """Run all quick tests"""
        print("🚀 Starting Quick Backend Tests")
        print("=" * 60)
        
        # Test 1: API Root
        self.test_endpoint("API Root", "/")
        
        # Test 2: AI Providers
        self.test_endpoint("AI Providers", "/ai-providers")
        
        # Test 3: Website Types
        self.test_endpoint("Website Types", "/website-types")
        
        # Test 4: Projects List
        self.test_endpoint("Projects List", "/projects")
        
        # Test 5: Templates
        self.test_endpoint("Templates", "/templates")
        
        # Test 6: Database connectivity (legacy status endpoint)
        status_payload = {
            "status": "quick_test",
            "timestamp": datetime.now().isoformat()
        }
        self.test_endpoint("Database Test", "/status", "POST", status_payload)
        
        # Test 7: Get status checks
        self.test_endpoint("Get Status Checks", "/status")
        
        # Generate Summary
        self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("=" * 60)
        print("📊 QUICK TEST SUMMARY")
        print("=" * 60)
        
        total = len(self.results)
        passed = sum(1 for r in self.results if r["success"])
        failed = total - passed
        
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    error_info = result.get("error", f"HTTP {result.get('status', 'unknown')}")
                    print(f"   • {result['test']}: {error_info}")

if __name__ == "__main__":
    tester = QuickBackendTester()
    tester.run_tests()