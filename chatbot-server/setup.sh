#!/bin/bash

# ============================================
# CHATBOT SERVER SETUP SCRIPT
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🤖 AI TRAINING PLATFORM CHATBOT SERVER SETUP${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check Node.js
echo -e "${CYAN}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo -e "${YELLOW}Please install Node.js 20.x or higher${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION} found${NC}\n"

# Install dependencies
echo -e "${CYAN}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}\n"

# Setup environment
echo -e "${CYAN}Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env and add your credentials${NC}\n"
    
    echo -e "${CYAN}Required variables:${NC}"
    echo -e "  - OPENAI_API_KEY"
    echo -e "  - NEXT_PUBLIC_SUPABASE_URL"
    echo -e "  - SUPABASE_SERVICE_ROLE_KEY\n"
    
    read -p "Press Enter to open .env in your default editor..."
    ${EDITOR:-nano} .env
else
    echo -e "${YELLOW}⚠️  .env file already exists${NC}\n"
fi

# Make scripts executable
echo -e "${CYAN}Making scripts executable...${NC}"
chmod +x test-n8n-webhook.sh
chmod +x setup.sh
echo -e "${GREEN}✅ Scripts are executable${NC}\n"

# Run diagnostics
echo -e "${CYAN}Running diagnostics...${NC}\n"
node debug-workflow.js

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${CYAN}Next steps:${NC}"
echo -e "  1. ${YELLOW}npm start${NC} - Start the server"
echo -e "  2. ${YELLOW}npm test${NC} - Run API tests"
echo -e "  3. ${YELLOW}./test-n8n-webhook.sh${NC} - Test n8n webhook"
echo -e "  4. ${YELLOW}node debug-workflow.js${NC} - Run diagnostics\n"

echo -e "${CYAN}Documentation:${NC}"
echo -e "  - README.md - Quick start guide"
echo -e "  - N8N-WORKFLOW-GUIDE.md - n8n setup"
echo -e "  - TROUBLESHOOTING.md - Common issues"
echo -e "  - DEPLOYMENT-GUIDE.md - Deployment options\n"
