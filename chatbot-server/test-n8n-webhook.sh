#!/bin/bash

# ============================================
# N8N WEBHOOK TESTING SCRIPT
# ============================================
# This script tests the n8n webhook endpoint
# Usage: ./test-n8n-webhook.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Configuration
N8N_WEBHOOK_URL="${N8N_WEBHOOK_URL:-https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 N8N WEBHOOK TEST SUITE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Testing webhook: ${N8N_WEBHOOK_URL}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# ============================================
# TEST 1: POST Request with JSON
# ============================================
echo -e "${YELLOW}📋 Test 1: POST Request with JSON${NC}"
echo -e "${GRAY}POST ${N8N_WEBHOOK_URL}${NC}\n"

echo -e "${CYAN}Request Body:${NC}"
cat << EOF
{
  "message": "What is Module 1 about?",
  "userId": "test-user-123"
}
EOF
echo -e "\n"

echo -e "${CYAN}Sending request...${NC}\n"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$N8N_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Module 1 about?",
    "userId": "test-user-123"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ PASSED${NC}"
  echo -e "${GRAY}HTTP Status: ${HTTP_CODE}${NC}"
  echo -e "${CYAN}Response:${NC}"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
elif [ "$HTTP_CODE" -eq 404 ]; then
  echo -e "${RED}❌ FAILED - Webhook not found${NC}"
  echo -e "${GRAY}HTTP Status: ${HTTP_CODE}${NC}"
  echo -e "${YELLOW}Response:${NC}"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo -e "\n${YELLOW}💡 TROUBLESHOOTING:${NC}"
  echo -e "   1. Make sure your n8n workflow is active"
  echo -e "   2. Click 'Execute Workflow' in n8n before testing"
  echo -e "   3. Check if the webhook path is correct"
  echo -e "   4. Verify the webhook is set to accept POST requests"
else
  echo -e "${RED}❌ FAILED${NC}"
  echo -e "${GRAY}HTTP Status: ${HTTP_CODE}${NC}"
  echo -e "${YELLOW}Response:${NC}"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
fi

echo -e "\n"

# ============================================
# TEST 2: GET Request (Should Fail)
# ============================================
echo -e "${YELLOW}📋 Test 2: GET Request (Should Fail)${NC}"
echo -e "${GRAY}GET ${N8N_WEBHOOK_URL}${NC}\n"

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$N8N_WEBHOOK_URL")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 404 ]; then
  echo -e "${GREEN}✅ PASSED - Correctly rejected GET request${NC}"
  echo -e "${GRAY}HTTP Status: ${HTTP_CODE}${NC}"
else
  echo -e "${YELLOW}⚠️  Unexpected response${NC}"
  echo -e "${GRAY}HTTP Status: ${HTTP_CODE}${NC}"
  echo -e "${CYAN}Response:${NC}"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
fi

echo -e "\n"

# ============================================
# TEST 3: POST with Missing Fields
# ============================================
echo -e "${YELLOW}📋 Test 3: POST with Missing Fields${NC}"
echo -e "${GRAY}POST ${N8N_WEBHOOK_URL}${NC}\n"

echo -e "${CYAN}Request Body (missing userId):${NC}"
cat << EOF
{
  "message": "Test message"
}
EOF
echo -e "\n"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$N8N_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test message"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "${CYAN}Response:${NC}"
echo -e "${GRAY}HTTP Status: ${HTTP_CODE}${NC}"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

echo -e "\n"

# ============================================
# SUMMARY
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🎉 Test suite completed!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${CYAN}📝 NEXT STEPS:${NC}"
echo -e "   1. If tests failed, check the troubleshooting guide"
echo -e "   2. Verify your n8n workflow configuration"
echo -e "   3. Make sure your API server is running"
echo -e "   4. Check the n8n execution logs for errors\n"
