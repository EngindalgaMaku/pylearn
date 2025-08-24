#!/usr/bin/env python3
# Test script for Python Code Execution API
import requests
import json
import time
import sys

# Configuration
API_URL = 'https://code.pylearn.net/execute'
API_KEY = 'taklaciibo'  # Gerçek API anahtarınızı buraya yazın

# Test cases
test_cases = [
    {
        "name": "Basic Hello World",
        "code": 'print("Hello, World!")',
        "expected": "Hello, World!"
    },
    {
        "name": "Simple Calculation",
        "code": 'result = 5 * 7\nprint(f"5 x 7 = {result}")',
        "expected": "5 x 7 = 35"
    },
    {
        "name": "Function Test",
        "code": "def add(a, b):\n    return a + b\n\nprint(f\"2 + 3 = {add(2, 3)}\")",
        "expected": "2 + 3 = 5"
    },
    {
        "name": "Test with Test Cases",
        "code": "def multiply(a, b):\n    return a * b",
        "test_cases": [
            {
                "input": "multiply(3, 4)",
                "expected_output": "12",
                "code": "result = multiply(3, 4)\nprint(result)"
            },
            {
                "input": "multiply(5, 0)",
                "expected_output": "0",
                "code": "result = multiply(5, 0)\nprint(result)"
            }
        ]
    }
]

def run_test(test):
    """Run a single test case"""
    print(f"\n🧪 Running test: {test['name']}")
    
    payload = {
        "code": test["code"],
        "language": "python",
        "timeout": 5
    }
    
    if "test_cases" in test:
        payload["test_cases"] = test["test_cases"]
    
    try:
        response = requests.post(
            API_URL,
            headers={
                "Content-Type": "application/json",
                "X-API-Key": API_KEY,
                "Origin": "https://pylearn.net"
            },
            json=payload
        )
        
        if not response.ok:
            print(f"❌ Test failed: HTTP {response.status_code} - {response.text}")
            return
        
        result = response.json()
        
        print("📋 Results:")
        print("Output:", result["output"].strip())
        if result.get("error"):
            print("Error:", result["error"])
        print(f"⏱️ Execution time: {result['execution_time']:.3f}s")
        
        if "expected" in test:
            passed = test["expected"] in result["output"].strip()
            print("✅ Test passed!" if passed else f"❌ Test failed! Expected: \"{test['expected']}\"")
        
        if "test_results" in result and result["test_results"]:
            print("\n🔍 Test Case Results:")
            for i, test_result in enumerate(result["test_results"]):
                status = "✅" if test_result["passed"] else "❌"
                print(f"  {status} Test {i + 1}: {test_result['message']}")
                
    except Exception as e:
        print(f"❌ Error running test: {str(e)}")

def check_health():
    """Check the API health endpoint"""
    print("\n🏥 Checking API health...")
    try:
        health_url = API_URL.replace('/execute', '/health')
        response = requests.get(
            health_url,
            headers={
                "X-API-Key": API_KEY,
                "Origin": "https://pylearn.net"
            }
        )
        
        if response.ok:
            health = response.json()
            print(f"✅ API is {health['status']}, Docker: {health['docker']}")
            return True
        else:
            print(f"❌ Health check failed: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")
        return False

def run_all_tests():
    """Run all test cases"""
    print("🚀 Starting API tests...")
    
    # First check health
    if not check_health():
        print("❌ API health check failed. Skipping tests.")
        return
    
    # Run each test case
    for test in test_cases:
        run_test(test)
    
    print("\n🏁 All tests completed!")

if __name__ == "__main__":
    # Check if API key is provided as argument
    if len(sys.argv) > 1:
        API_KEY = sys.argv[1]
    elif API_KEY == 'your-api-key':
        print("⚠️  Warning: You need to set your API key in the script or provide it as an argument")
        print("Usage: python test-code-api.py <your-api-key>")
        sys.exit(1)
    
    run_all_tests()

