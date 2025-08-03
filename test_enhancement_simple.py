#!/usr/bin/env python3
"""
Simple AI Enhancement Testing - Focus on key functionality
"""

import requests
import json
import uuid
from datetime import datetime

def test_suggestions_mode():
    """Test enhancement suggestions mode (should be fast)"""
    
    # Get backend URL
    with open('/app/frontend/.env', 'r') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                base_url = line.split('=')[1].strip()
                break
    
    api_url = f"{base_url}/api"
    
    print("🔧 Testing Enhancement Suggestions Mode...")
    
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
    
    try:
        response = requests.post(f"{api_url}/enhance-project", 
                               json=payload, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("success") and "suggestions" in data:
                suggestions = data.get("suggestions", [])
                print(f"✅ PASS: Generated {len(suggestions)} enhancement suggestions")
                
                # Print first few suggestions
                for i, suggestion in enumerate(suggestions[:3]):
                    print(f"   📝 {i+1}. {suggestion.get('title', 'Unknown')}: {suggestion.get('description', 'No description')}")
                
                return True
            else:
                print(f"❌ FAIL: Invalid response format: {data}")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: Exception: {str(e)}")
        return False

def test_priority_logic():
    """Test that apply=true takes priority over enhancement_type"""
    
    # Get backend URL
    with open('/app/frontend/.env', 'r') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                base_url = line.split('=')[1].strip()
                break
    
    api_url = f"{base_url}/api"
    
    print("🔧 Testing Priority Logic (apply=true vs enhancement_type)...")
    
    sample_html = "<html><body><h1>Test</h1></body></html>"
    
    # Test with apply=true AND enhancement_type=suggestions
    # Should NOT return suggestions (should try to apply enhancement)
    enhancement = {
        "type": "visual",
        "title": "Test Enhancement",
        "description": "Test description"
    }
    
    payload = {
        "project_id": str(uuid.uuid4()),
        "current_content": sample_html,
        "enhancement": enhancement,
        "enhancement_type": "suggestions",  # This should be ignored
        "apply": True  # This should take priority
    }
    
    try:
        response = requests.post(f"{api_url}/enhance-project", 
                               json=payload, timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            
            # Should NOT return suggestions
            if "suggestions" in data:
                print("❌ FAIL: Returned suggestions when apply=true (priority logic broken)")
                return False
            elif "enhanced_project" in data or "error" in data:
                print("✅ PASS: apply=true correctly took priority over enhancement_type=suggestions")
                return True
            else:
                print(f"❌ FAIL: Unexpected response format: {data}")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: Exception: {str(e)}")
        return False

def test_ai_service_integration():
    """Test AI service integration"""
    
    # Get backend URL
    with open('/app/frontend/.env', 'r') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                base_url = line.split('=')[1].strip()
                break
    
    api_url = f"{base_url}/api"
    
    print("🔧 Testing AI Service Integration...")
    
    try:
        response = requests.get(f"{api_url}/ai-providers", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            providers = data.get("providers", [])
            
            # Check if OpenAI is configured (used for enhancements)
            openai_provider = next((p for p in providers if p.get("id") == "openai"), None)
            
            if openai_provider:
                model = openai_provider.get("model", "")
                if "gpt-4" in model.lower():
                    print(f"✅ PASS: AI service integrated with {model} for enhancements")
                    return True
                else:
                    print(f"❌ FAIL: Unexpected model: {model}")
                    return False
            else:
                print("❌ FAIL: OpenAI provider not found")
                return False
        else:
            print(f"❌ FAIL: Could not verify AI providers: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: Exception: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Simple AI Enhancement Testing")
    print("=" * 60)
    
    results = []
    
    # Test 1: AI Service Integration
    results.append(test_ai_service_integration())
    print()
    
    # Test 2: Enhancement Suggestions Mode
    results.append(test_suggestions_mode())
    print()
    
    # Test 3: Priority Logic
    results.append(test_priority_logic())
    print()
    
    # Summary
    passed = sum(results)
    total = len(results)
    
    print("=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"Total Tests: {total}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Enhancement functionality is working correctly.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check the output above for details.")