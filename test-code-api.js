// Test script for Python Code Execution API
const fetch = require('node-fetch');

// Configuration
const API_URL = 'https://code.pylearn.net/execute';
const API_KEY = 'your-api-key'; // Gerçek API anahtarınızı buraya yazın

// Test cases
const testCases = [
  {
    name: 'Basic Hello World',
    code: 'print("Hello, World!")',
    expected: 'Hello, World!'
  },
  {
    name: 'Simple Calculation',
    code: 'result = 5 * 7\nprint(f"5 x 7 = {result}")',
    expected: '5 x 7 = 35'
  },
  {
    name: 'Function Test',
    code: `def add(a, b):\n    return a + b\n\nprint(f"2 + 3 = {add(2, 3)}")`,
    expected: '2 + 3 = 5'
  },
  {
    name: 'Test with Test Cases',
    code: `def multiply(a, b):\n    return a * b`,
    testCases: [
      {
        input: 'multiply(3, 4)',
        expected_output: '12',
        code: 'result = multiply(3, 4)\nprint(result)'
      },
      {
        input: 'multiply(5, 0)',
        expected_output: '0',
        code: 'result = multiply(5, 0)\nprint(result)'
      }
    ]
  }
];

// Function to run a test
async function runTest(test) {
  console.log(`\n🧪 Running test: ${test.name}`);
  
  const payload = {
    code: test.code,
    language: 'python',
    timeout: 5
  };
  
  if (test.testCases) {
    payload.test_cases = test.testCases;
  }
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'Origin': 'https://pylearn.net'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Test failed: HTTP ${response.status} - ${errorText}`);
      return;
    }
    
    const result = await response.json();
    
    console.log('📋 Results:');
    console.log('Output:', result.output.trim());
    if (result.error) console.log('Error:', result.error);
    console.log(`⏱️ Execution time: ${result.execution_time.toFixed(3)}s`);
    
    if (test.expected) {
      const passed = result.output.trim().includes(test.expected);
      console.log(passed ? '✅ Test passed!' : `❌ Test failed! Expected: "${test.expected}"`);
    }
    
    if (result.test_results) {
      console.log('\n🔍 Test Case Results:');
      result.test_results.forEach((testResult, index) => {
        console.log(`  ${testResult.passed ? '✅' : '❌'} Test ${index + 1}: ${testResult.message}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Error running test: ${error.message}`);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting API tests...');
  
  // First check health endpoint
  try {
    console.log('\n🏥 Checking API health...');
    const healthResponse = await fetch(API_URL.replace('/execute', '/health'), {
      headers: {
        'X-API-Key': API_KEY,
        'Origin': 'https://pylearn.net'
      }
    });
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log(`✅ API is ${health.status}, Docker: ${health.docker}`);
    } else {
      console.log(`❌ Health check failed: HTTP ${healthResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Health check error: ${error.message}`);
  }
  
  // Run each test case
  for (const test of testCases) {
    await runTest(test);
  }
  
  console.log('\n🏁 All tests completed!');
}

// Run the tests
runAllTests().catch(err => {
  console.error('❌ Fatal error:', err);
});

