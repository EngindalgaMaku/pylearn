#!/bin/bash
# Simple test script for Python Code Execution API

# Configuration
API_URL="https://code.pylearn.net/execute"
API_KEY="$1"  # API key should be passed as first argument

# Check if API key is provided
if [ -z "$API_KEY" ]; then
  echo "❌ Error: API key is required"
  echo "Usage: ./test-simple.sh <your-api-key>"
  exit 1
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Testing Python Code Execution API${NC}"
echo -e "${BLUE}URL: $API_URL${NC}"
echo -e "${BLUE}API Key: ${API_KEY:0:4}...${NC}"

# Test 1: Hello World
echo -e "\n${BLUE}Test 1: Hello World${NC}"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "X-API-Key: $API_KEY" \
  -H "Origin: https://pylearn.net" \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"Hello, World!\")"}')

# Check if curl command was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Curl command failed${NC}"
  exit 1
fi

# Check if response contains error
if echo "$RESPONSE" | grep -q "error"; then
  ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$ERROR" ] && [ "$ERROR" != "" ]; then
    echo -e "${RED}❌ API returned error: $ERROR${NC}"
  fi
fi

# Extract output
OUTPUT=$(echo "$RESPONSE" | grep -o '"output":"[^"]*"' | cut -d'"' -f4)
OUTPUT=$(echo -e "$OUTPUT") # Handle escape sequences

echo -e "${GREEN}Output:${NC} $OUTPUT"

# Test 2: Simple calculation
echo -e "\n${BLUE}Test 2: Simple calculation${NC}"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "X-API-Key: $API_KEY" \
  -H "Origin: https://pylearn.net" \
  -H "Content-Type: application/json" \
  -d '{"code":"a = 5\nb = 7\nprint(f\"Sum: {a + b}\")\nprint(f\"Product: {a * b}\")"}')

# Extract output
OUTPUT=$(echo "$RESPONSE" | grep -o '"output":"[^"]*"' | cut -d'"' -f4)
OUTPUT=$(echo -e "$OUTPUT") # Handle escape sequences

echo -e "${GREEN}Output:${NC} $OUTPUT"

# Test 3: With test cases
echo -e "\n${BLUE}Test 3: With test cases${NC}"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "X-API-Key: $API_KEY" \
  -H "Origin: https://pylearn.net" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def add(a, b):\n    return a + b",
    "test_cases": [
      {
        "input": "add(2, 3)",
        "expected_output": "5",
        "code": "result = add(2, 3)\nprint(result)"
      },
      {
        "input": "add(-1, 1)",
        "expected_output": "0",
        "code": "result = add(-1, 1)\nprint(result)"
      }
    ]
  }')

# Extract test results
echo -e "${GREEN}Test Results:${NC}"
echo "$RESPONSE" | grep -o '"passed":[^,]*' | while read -r line; do
  PASSED=$(echo "$line" | cut -d':' -f2)
  if [ "$PASSED" = "true" ]; then
    echo -e "  ${GREEN}✅ Test passed${NC}"
  else
    echo -e "  ${RED}❌ Test failed${NC}"
  fi
done

echo -e "\n${GREEN}✅ All tests completed!${NC}"

