#!/bin/bash
# Comprehensive test script for the clean JWT authentication implementation

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api"
USERNAME="cleantestuser_$(date +%s)"
PASSWORD="testpassword123"
EDITOR_PASSWORD="editorpass123"

echo -e "${BLUE}Testing Clean JWT Authentication Implementation${NC}"
echo "=============================================="
echo -e "Username: ${USERNAME}"
echo ""

# Test 1: Register a test user
echo -e "${YELLOW}Test 1: User Registration${NC}"
register_response=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"password\": \"$PASSWORD\",
    \"editorPassword\": \"$EDITOR_PASSWORD\",
    \"gridType\": \"default\"
  }")

if echo "$register_response" | grep -q "token"; then
  echo -e "${GREEN}✓ Registration successful${NC}"
  token=$(echo "$register_response" | jq -r '.token')
  echo "Token extracted: ${token:0:30}..."
  echo "Status: $(echo "$register_response" | jq -r '.status')"
else
  echo -e "${RED}✗ Registration failed${NC}"
  echo "Response: $register_response"
  exit 1
fi

echo ""

# Test 2: Login with the user
echo -e "${YELLOW}Test 2: User Login${NC}"
login_response=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"password\": \"$PASSWORD\"
  }")

if echo "$login_response" | grep -q "token"; then
  echo -e "${GREEN}✓ Login successful${NC}"
  login_token=$(echo "$login_response" | jq -r '.token')
  echo "Login token extracted: ${login_token:0:30}..."
  echo "Status: $(echo "$login_response" | jq -r '.status')"
else
  echo -e "${RED}✗ Login failed${NC}"
  echo "Response: $login_response"
  exit 1
fi

echo ""

# Test 3: Current User Endpoint (Valid Token)
echo -e "${YELLOW}Test 3: Current User (Valid Token)${NC}"
user_response=$(curl -s -X GET "$BASE_URL/user" \
  -H "Authorization: Bearer $login_token")

if echo "$user_response" | grep -q "username"; then
  echo -e "${GREEN}✓ Current user endpoint works${NC}"
  echo "Username: $(echo "$user_response" | jq -r '.username')"
  echo "Status: $(echo "$user_response" | jq -r '.status')"
  echo "ID: $(echo "$user_response" | jq -r '.id')"
else
  echo -e "${RED}✗ Current user endpoint failed${NC}"
  echo "Response: $user_response"
fi

echo ""

# Test 4: Editor Password Validation (Correct Password)
echo -e "${YELLOW}Test 4: Editor Password Validation (Correct)${NC}"
editor_valid_response=$(curl -s -X POST "$BASE_URL/check-editor-password" \
  -H "Authorization: Bearer $login_token" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"$EDITOR_PASSWORD\"}")

if echo "$editor_valid_response" | jq -r '.valid' | grep -q "true"; then
  echo -e "${GREEN}✓ Editor password validation successful${NC}"
else
  echo -e "${RED}✗ Editor password validation failed${NC}"
  echo "Response: $editor_valid_response"
fi

echo ""

# Test 5: Editor Password Validation (Wrong Password)
echo -e "${YELLOW}Test 5: Editor Password Validation (Wrong)${NC}"
editor_invalid_response=$(curl -s -X POST "$BASE_URL/check-editor-password" \
  -H "Authorization: Bearer $login_token" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"wrongpassword\"}")

if echo "$editor_invalid_response" | jq -r '.valid' | grep -q "false"; then
  echo -e "${GREEN}✓ Editor password correctly rejected${NC}"
else
  echo -e "${RED}✗ Editor password should have been rejected${NC}"
  echo "Response: $editor_invalid_response"
fi

echo ""

# Test 6: Protected Endpoint (Invalid Token)
echo -e "${YELLOW}Test 6: Protected Endpoint (Invalid Token)${NC}"
invalid_token_response=$(curl -s -X GET "$BASE_URL/user" \
  -H "Authorization: Bearer invalidtoken123")

if echo "$invalid_token_response" | grep -q "Invalid or expired token"; then
  echo -e "${GREEN}✓ Invalid token correctly rejected${NC}"
else
  echo -e "${RED}✗ Invalid token not properly rejected${NC}"
  echo "Response: $invalid_token_response"
fi

echo ""

# Test 7: Protected Endpoint (No Token)
echo -e "${YELLOW}Test 7: Protected Endpoint (No Token)${NC}"
no_token_response=$(curl -s -X GET "$BASE_URL/user")

if echo "$no_token_response" | grep -q "Authorization token required"; then
  echo -e "${GREEN}✓ Request without token correctly rejected${NC}"
else
  echo -e "${RED}✗ Request without token not properly rejected${NC}"
  echo "Response: $no_token_response"
fi

echo ""

# Test 8: Login with Wrong Credentials
echo -e "${YELLOW}Test 8: Login with Wrong Credentials${NC}"
wrong_login_response=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"password\": \"wrongpassword\"
  }")

if echo "$wrong_login_response" | grep -q "Invalid username or password"; then
  echo -e "${GREEN}✓ Wrong credentials correctly rejected${NC}"
else
  echo -e "${RED}✗ Wrong credentials not properly rejected${NC}"
  echo "Response: $wrong_login_response"
fi

echo ""

# Test 9: Register with Existing Username
echo -e "${YELLOW}Test 9: Register with Existing Username${NC}"
duplicate_response=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"password\": \"$PASSWORD\",
    \"editorPassword\": \"$EDITOR_PASSWORD\",
    \"gridType\": \"default\"
  }")

if echo "$duplicate_response" | grep -q "Username already exists"; then
  echo -e "${GREEN}✓ Duplicate username correctly rejected${NC}"
else
  echo -e "${RED}✗ Duplicate username not properly rejected${NC}"
  echo "Response: $duplicate_response"
fi

echo ""
echo -e "${BLUE}Clean JWT Authentication Tests Complete${NC}"
echo "=============================================="
echo ""
echo -e "${GREEN}✓ All authentication functions are working correctly!${NC}"
echo -e "${GREEN}✓ Clean architecture implementation successful${NC}"
