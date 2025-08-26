#!/bin/bash
# Test script for gin-jwt authentication implementation

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api"

echo -e "${YELLOW}Testing Gin-JWT Authentication Implementation${NC}"
echo "============================================="

# Test 1: Register a test user
echo -e "\n${YELLOW}Test 1: User Registration${NC}"
register_response=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser_ginjwt",
    "password": "testpassword123",
    "editorPassword": "editorpass123",
    "gridType": "default"
  }')

echo "Registration response: $register_response"

if echo "$register_response" | grep -q "token"; then
  echo -e "${GREEN}✓ Registration successful${NC}"
  token=$(echo "$register_response" | grep -o '"token":"[^"]*"' | sed 's/"token":"\(.*\)"/\1/')
  echo "Token extracted: ${token:0:50}..."
else
  echo -e "${RED}✗ Registration failed${NC}"
  echo "Response: $register_response"
fi

# Test 2: Login with the user
echo -e "\n${YELLOW}Test 2: User Login${NC}"
login_response=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser_ginjwt",
    "password": "testpassword123"
  }')

echo "Login response: $login_response"

if echo "$login_response" | grep -q "token"; then
  echo -e "${GREEN}✓ Login successful${NC}"
  login_token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | sed 's/"token":"\(.*\)"/\1/')
  echo "Login token extracted: ${login_token:0:50}..."
else
  echo -e "${RED}✗ Login failed${NC}"
  echo "Response: $login_response"
fi

# Test 3: Test protected endpoint with valid token
echo -e "\n${YELLOW}Test 3: Protected Endpoint (Valid Token)${NC}"
if [ ! -z "$login_token" ]; then
  protected_response=$(curl -s -X GET "$BASE_URL/user" \
    -H "Authorization: Bearer $login_token")
  
  echo "Protected endpoint response: $protected_response"
  
  if echo "$protected_response" | grep -q "username"; then
    echo -e "${GREEN}✓ Protected endpoint access successful${NC}"
    echo "User info retrieved successfully"
  else
    echo -e "${RED}✗ Protected endpoint access failed${NC}"
    echo "Response: $protected_response"
  fi
else
  echo -e "${RED}✗ No token available for testing${NC}"
fi

# Test 4: Test protected endpoint with invalid token
echo -e "\n${YELLOW}Test 4: Protected Endpoint (Invalid Token)${NC}"
invalid_response=$(curl -s -X GET "$BASE_URL/user" \
  -H "Authorization: Bearer invalid_token_test")

echo "Invalid token response: $invalid_response"

if echo "$invalid_response" | grep -q -E "(Unauthorized|error)"; then
  echo -e "${GREEN}✓ Invalid token correctly rejected${NC}"
else
  echo -e "${RED}✗ Invalid token not properly rejected${NC}"
  echo "Response: $invalid_response"
fi

# Test 5: Test protected endpoint without token
echo -e "\n${YELLOW}Test 5: Protected Endpoint (No Token)${NC}"
no_token_response=$(curl -s -X GET "$BASE_URL/user")

echo "No token response: $no_token_response"

if echo "$no_token_response" | grep -q -E "(Unauthorized|error)"; then
  echo -e "${GREEN}✓ Request without token correctly rejected${NC}"
else
  echo -e "${RED}✗ Request without token not properly rejected${NC}"
  echo "Response: $no_token_response"
fi

# Test 6: Test token refresh
echo -e "\n${YELLOW}Test 6: Token Refresh${NC}"
if [ ! -z "$login_token" ]; then
  refresh_response=$(curl -s -X POST "$BASE_URL/refresh_token" \
    -H "Authorization: Bearer $login_token")
  
  echo "Refresh response: $refresh_response"
  
  if echo "$refresh_response" | grep -q "token"; then
    echo -e "${GREEN}✓ Token refresh successful${NC}"
    new_token=$(echo "$refresh_response" | grep -o '"token":"[^"]*"' | sed 's/"token":"\(.*\)"/\1/')
    echo "New token: ${new_token:0:50}..."
  else
    echo -e "${RED}✗ Token refresh failed${NC}"
    echo "Response: $refresh_response"
  fi
else
  echo -e "${RED}✗ No token available for refresh testing${NC}"
fi

# Test 7: Test editor password verification
echo -e "\n${YELLOW}Test 7: Editor Password Check${NC}"
if [ ! -z "$login_token" ]; then
  editor_response=$(curl -s -X POST "$BASE_URL/check-editor-password" \
    -H "Authorization: Bearer $login_token" \
    -H "Content-Type: application/json" \
    -d '{"password": "editorpass123"}')
  
  echo "Editor password response: $editor_response"
  
  if echo "$editor_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Editor password verification successful${NC}"
  else
    echo -e "${RED}✗ Editor password verification failed${NC}"
    echo "Response: $editor_response"
  fi
else
  echo -e "${RED}✗ No token available for editor password testing${NC}"
fi

# Test 8: Test logout
echo -e "\n${YELLOW}Test 8: User Logout${NC}"
if [ ! -z "$login_token" ]; then
  logout_response=$(curl -s -X POST "$BASE_URL/logout" \
    -H "Authorization: Bearer $login_token")
  
  echo "Logout response: $logout_response"
  
  if echo "$logout_response" | grep -q -E "(Successfully logged out|message)"; then
    echo -e "${GREEN}✓ Logout successful${NC}"
  else
    echo -e "${RED}✗ Logout failed${NC}"
    echo "Response: $logout_response"
  fi
else
  echo -e "${RED}✗ No token available for logout testing${NC}"
fi

echo -e "\n${YELLOW}Gin-JWT Authentication Test Complete${NC}"
echo "============================================="
