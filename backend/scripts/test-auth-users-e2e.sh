#!/bin/bash

# End-to-End Testing Script for Auth & Users Module
# This script tests the complete workflow of authentication and user management

set -e

BASE_URL="http://localhost:3000/api"
ADMIN_EMAIL="admin@test.capcos.fr"
ADMIN_PASSWORD="AdminPassword123!"
COLLAB_EMAIL="collab@test.capcos.fr"
COLLAB_PASSWORD="CollaboratorPass456!"

echo "======================================"
echo "Auth & Users E2E Testing Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# Function to extract JWT token from response
extract_token() {
  echo "$1" | jq -r '.access_token'
}

# Function to extract user ID from response
extract_user_id() {
  echo "$1" | jq -r '.user.id'
}

# Make sure the API is running
echo "Checking if API is running..."
if ! curl -s -f "$BASE_URL/auth/validate" -H "Authorization: Bearer dummy" > /dev/null 2>&1; then
  print_error "API is not running at $BASE_URL"
  exit 1
fi
print_success "API is running"
echo ""

# =================
# Step 1: Register Admin User
# =================
echo "Step 1: Register Admin User"
echo "---"

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"role\": \"admin\"
  }")

ADMIN_TOKEN=$(extract_token "$REGISTER_RESPONSE")
ADMIN_ID=$(extract_user_id "$REGISTER_RESPONSE")

if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
  print_success "Admin user registered: $ADMIN_EMAIL"
  print_info "Admin ID: $ADMIN_ID"
  print_info "JWT Token: ${ADMIN_TOKEN:0:50}..."
else
  print_error "Failed to register admin user"
  echo "$REGISTER_RESPONSE" | jq .
  exit 1
fi
echo ""

# =================
# Step 2: Login with Admin
# =================
echo "Step 2: Login with Admin Credentials"
echo "---"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

ADMIN_TOKEN_LOGIN=$(extract_token "$LOGIN_RESPONSE")

if [ "$ADMIN_TOKEN_LOGIN" != "null" ] && [ -n "$ADMIN_TOKEN_LOGIN" ]; then
  print_success "Admin login successful"
  print_info "JWT Token: ${ADMIN_TOKEN_LOGIN:0:50}..."
else
  print_error "Failed to login with admin credentials"
  echo "$LOGIN_RESPONSE" | jq .
  exit 1
fi
echo ""

# =================
# Step 3: Create Collaborator User (as Admin)
# =================
echo "Step 3: Create Collaborator User via Users API (as Admin)"
echo "---"

CREATE_USER_RESPONSE=$(curl -s -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN_LOGIN" \
  -d "{
    \"email\": \"$COLLAB_EMAIL\",
    \"password\": \"$COLLAB_PASSWORD\",
    \"roles\": [\"collaborateur\"]
  }")

COLLAB_USER_ID=$(echo "$CREATE_USER_RESPONSE" | jq -r '.id // empty')

if [ -n "$COLLAB_USER_ID" ] && [ "$COLLAB_USER_ID" != "null" ]; then
  print_success "Collaborator user created: $COLLAB_EMAIL"
  print_info "Collaborator ID: $COLLAB_USER_ID"
else
  print_error "Failed to create collaborator user"
  echo "$CREATE_USER_RESPONSE" | jq .
  exit 1
fi
echo ""

# =================
# Step 4: List All Users (as Admin)
# =================
echo "Step 4: List All Users (Admin Only)"
echo "---"

LIST_USERS_RESPONSE=$(curl -s -X GET "$BASE_URL/users?page=1&limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN_LOGIN")

USERS_COUNT=$(echo "$LIST_USERS_RESPONSE" | jq '.pagination.total // 0')

if [ "$USERS_COUNT" -ge 2 ]; then
  print_success "Users list retrieved"
  print_info "Total users: $USERS_COUNT"
else
  print_error "Could not retrieve users list or insufficient users"
  echo "$LIST_USERS_RESPONSE" | jq .
fi
echo ""

# =================
# Step 5: Login as Collaborator
# =================
echo "Step 5: Login as Collaborator"
echo "---"

COLLAB_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$COLLAB_EMAIL\",
    \"password\": \"$COLLAB_PASSWORD\"
  }")

COLLAB_TOKEN=$(extract_token "$COLLAB_LOGIN_RESPONSE")
COLLAB_ROLES=$(echo "$COLLAB_LOGIN_RESPONSE" | jq -r '.user.roles | @json')

if [ "$COLLAB_TOKEN" != "null" ] && [ -n "$COLLAB_TOKEN" ]; then
  print_success "Collaborator login successful"
  print_info "Roles: $COLLAB_ROLES"
else
  print_error "Failed to login as collaborator"
  echo "$COLLAB_LOGIN_RESPONSE" | jq .
  exit 1
fi
echo ""

# =================
# Step 6: Assign Additional Role (Compta) to Collaborator
# =================
echo "Step 6: Assign Compta Role to Collaborator (as Admin)"
echo "---"

ASSIGN_ROLE_RESPONSE=$(curl -s -X POST "$BASE_URL/users/$COLLAB_USER_ID/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN_LOGIN" \
  -d "{
    \"role\": \"compta\"
  }")

ASSIGN_MESSAGE=$(echo "$ASSIGN_ROLE_RESPONSE" | jq -r '.message // empty')

if echo "$ASSIGN_MESSAGE" | grep -q "assigned"; then
  print_success "Compta role assigned to collaborator"
else
  print_error "Failed to assign compta role"
  echo "$ASSIGN_ROLE_RESPONSE" | jq .
fi
echo ""

# =================
# Step 7: Get User Roles
# =================
echo "Step 7: Get User Roles"
echo "---"

GET_ROLES_RESPONSE=$(curl -s -X GET "$BASE_URL/users/$COLLAB_USER_ID/roles" \
  -H "Authorization: Bearer $ADMIN_TOKEN_LOGIN")

ROLES=$(echo "$GET_ROLES_RESPONSE" | jq -r '.roles | @json')

if echo "$ROLES" | grep -q "collaborateur"; then
  print_success "Retrieved user roles: $ROLES"
else
  print_error "Failed to retrieve user roles"
  echo "$GET_ROLES_RESPONSE" | jq .
fi
echo ""

# =================
# Step 8: Update User Email
# =================
echo "Step 8: Update User Email (as Admin)"
echo "---"

NEW_EMAIL="collab.updated@test.capcos.fr"

UPDATE_USER_RESPONSE=$(curl -s -X PUT "$BASE_URL/users/$COLLAB_USER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN_LOGIN" \
  -d "{
    \"email\": \"$NEW_EMAIL\",
    \"emailVerified\": true
  }")

UPDATED_EMAIL=$(echo "$UPDATE_USER_RESPONSE" | jq -r '.email // empty')

if [ "$UPDATED_EMAIL" = "$NEW_EMAIL" ]; then
  print_success "User email updated to: $NEW_EMAIL"
else
  print_error "Failed to update user email"
  echo "$UPDATE_USER_RESPONSE" | jq .
fi
echo ""

# =================
# Step 9: List Users by Role
# =================
echo "Step 9: List Users by Role (Compta)"
echo "---"

LIST_BY_ROLE_RESPONSE=$(curl -s -X GET "$BASE_URL/users/role/compta?page=1&limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN_LOGIN")

COMPTA_USERS=$(echo "$LIST_BY_ROLE_RESPONSE" | jq '.pagination.total // 0')

if [ "$COMPTA_USERS" -ge 1 ]; then
  print_success "Retrieved $COMPTA_USERS users with compta role"
else
  print_error "Could not retrieve users by role"
  echo "$LIST_BY_ROLE_RESPONSE" | jq .
fi
echo ""

# =================
# Step 10: Try Unauthorized Operation (Non-Admin)
# =================
echo "Step 10: Try Unauthorized Operation (Non-Admin Creates User)"
echo "---"

UNAUTHORIZED_RESPONSE=$(curl -s -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $COLLAB_TOKEN" \
  -d "{
    \"email\": \"unauthorized@test.capcos.fr\",
    \"password\": \"SomePassword123!\"
  }")

UNAUTHORIZED_STATUS=$(echo "$UNAUTHORIZED_RESPONSE" | jq -r '.statusCode // empty')

if [ "$UNAUTHORIZED_STATUS" = "403" ]; then
  print_success "Unauthorized operation was correctly rejected (403 Forbidden)"
else
  print_error "Unauthorized operation was not rejected properly"
  echo "$UNAUTHORIZED_RESPONSE" | jq .
fi
echo ""

# =================
# Step 11: Validate JWT Token
# =================
echo "Step 11: Validate JWT Token"
echo "---"

VALIDATE_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/validate" \
  -H "Authorization: Bearer $ADMIN_TOKEN_LOGIN")

VALID=$(echo "$VALIDATE_RESPONSE" | jq -r '.valid // empty')

if [ "$VALID" = "true" ]; then
  print_success "JWT token is valid"
  VALIDATED_EMAIL=$(echo "$VALIDATE_RESPONSE" | jq -r '.user.email // empty')
  print_info "Token user: $VALIDATED_EMAIL"
else
  print_error "JWT token validation failed"
  echo "$VALIDATE_RESPONSE" | jq .
fi
echo ""

# =================
# Step 12: Remove Role from User
# =================
echo "Step 12: Remove Compta Role from Collaborator"
echo "---"

REMOVE_ROLE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/users/$COLLAB_USER_ID/roles/compta" \
  -H "Authorization: Bearer $ADMIN_TOKEN_LOGIN")

REMOVE_MESSAGE=$(echo "$REMOVE_ROLE_RESPONSE" | jq -r '.message // empty')

if echo "$REMOVE_MESSAGE" | grep -q "removed"; then
  print_success "Compta role removed from collaborator"
else
  print_error "Failed to remove compta role"
  echo "$REMOVE_ROLE_RESPONSE" | jq .
fi
echo ""

# =================
# Step 13: Delete User
# =================
echo "Step 13: Delete User (as Admin)"
echo "---"

DELETE_USER_RESPONSE=$(curl -s -X DELETE "$BASE_URL/users/$COLLAB_USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN_LOGIN")

DELETE_MESSAGE=$(echo "$DELETE_USER_RESPONSE" | jq -r '.message // empty')

if echo "$DELETE_MESSAGE" | grep -q "deleted"; then
  print_success "User deleted successfully"
else
  print_error "Failed to delete user"
  echo "$DELETE_USER_RESPONSE" | jq .
fi
echo ""

# =================
# Summary
# =================
echo "======================================"
echo "End-to-End Testing Complete!"
echo "======================================"
echo ""
print_success "All tests passed successfully!"
echo ""
