#!/usr/bin/env python3
"""
Simple API Test for Delete Functionality
Tests the HTTP API endpoints with shorter timeouts
"""

import requests
import json
import time
from datetime import datetime

def test_api_with_retries():
    """Test API with retries and shorter timeouts"""
    
    # Get backend URL
    with open('/app/frontend/.env', 'r') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                base_url = line.split('=')[1].strip()
                break
    
    api_url = f"{base_url}/api"
    
    print(f"🔧 Testing API at: {api_url}")
    print("=" * 60)
    
    results = []
    
    # Test 1: API Root (quick test)
    print("🧪 Testing API Root...")
    try:
        response = requests.get(f"{api_url}/", timeout=15)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API Root: {data.get('message', 'Unknown')}")
            results.append(("API Root", True, "Working"))
        else:
            print(f"❌ API Root: HTTP {response.status_code}")
            results.append(("API Root", False, f"HTTP {response.status_code}"))
    except Exception as e:
        print(f"❌ API Root: {str(e)}")
        results.append(("API Root", False, str(e)))
    
    # Test 2: Projects List
    print("\n🧪 Testing Projects List...")
    try:
        response = requests.get(f"{api_url}/projects", timeout=15)
        if response.status_code == 200:
            data = response.json()
            total = data.get('total', 0)
            print(f"✅ Projects List: Found {total} projects")
            results.append(("Projects List", True, f"{total} projects"))
            
            # If we have projects, test deletion
            if total > 0:
                projects = data.get('projects', [])
                if projects:
                    project_to_delete = projects[0]
                    project_id = project_to_delete.get('id')
                    
                    print(f"\n🧪 Testing Project Deletion for ID: {project_id[:8]}...")
                    try:
                        delete_response = requests.delete(f"{api_url}/projects/{project_id}", timeout=15)
                        if delete_response.status_code == 200:
                            delete_data = delete_response.json()
                            if delete_data.get('success'):
                                print(f"✅ Project Deletion: Successfully deleted project")
                                results.append(("Project Deletion", True, "Deleted successfully"))
                                
                                # Verify deletion
                                time.sleep(2)
                                verify_response = requests.get(f"{api_url}/projects", timeout=15)
                                if verify_response.status_code == 200:
                                    verify_data = verify_response.json()
                                    new_total = verify_data.get('total', 0)
                                    if new_total == total - 1:
                                        print(f"✅ Deletion Verification: Count decreased {total} → {new_total}")
                                        results.append(("Deletion Verification", True, f"Count: {total} → {new_total}"))
                                    else:
                                        print(f"❌ Deletion Verification: Count unchanged {total} → {new_total}")
                                        results.append(("Deletion Verification", False, "Count unchanged"))
                            else:
                                print(f"❌ Project Deletion: {delete_data}")
                                results.append(("Project Deletion", False, str(delete_data)))
                        else:
                            print(f"❌ Project Deletion: HTTP {delete_response.status_code}")
                            results.append(("Project Deletion", False, f"HTTP {delete_response.status_code}"))
                    except Exception as e:
                        print(f"❌ Project Deletion: {str(e)}")
                        results.append(("Project Deletion", False, str(e)))
            
        else:
            print(f"❌ Projects List: HTTP {response.status_code}")
            results.append(("Projects List", False, f"HTTP {response.status_code}"))
    except Exception as e:
        print(f"❌ Projects List: {str(e)}")
        results.append(("Projects List", False, str(e)))
    
    # Test 3: 404 Error Handling
    print(f"\n🧪 Testing 404 Error Handling...")
    try:
        fake_id = "nonexistent-project-12345"
        response = requests.delete(f"{api_url}/projects/{fake_id}", timeout=15)
        if response.status_code == 404:
            print(f"✅ 404 Error Handling: Correctly returned 404")
            results.append(("404 Error Handling", True, "Correct 404 response"))
        else:
            print(f"❌ 404 Error Handling: Expected 404, got {response.status_code}")
            results.append(("404 Error Handling", False, f"Got {response.status_code}"))
    except Exception as e:
        print(f"❌ 404 Error Handling: {str(e)}")
        results.append(("404 Error Handling", False, str(e)))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 SIMPLE API TEST SUMMARY")
    print("=" * 60)
    
    total_tests = len(results)
    passed_tests = sum(1 for r in results if r[1])
    
    print(f"Total Tests: {total_tests}")
    print(f"✅ Passed: {passed_tests}")
    print(f"❌ Failed: {total_tests - passed_tests}")
    print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    print()
    
    for test_name, success, details in results:
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details}")
    
    # Save results
    with open('/app/simple_api_test_results.json', 'w') as f:
        json.dump({
            "summary": {
                "total": total_tests,
                "passed": passed_tests,
                "failed": total_tests - passed_tests,
                "success_rate": (passed_tests/total_tests)*100
            },
            "results": [{"test": r[0], "success": r[1], "details": r[2]} for r in results],
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\n📄 Results saved to: /app/simple_api_test_results.json")

if __name__ == "__main__":
    test_api_with_retries()