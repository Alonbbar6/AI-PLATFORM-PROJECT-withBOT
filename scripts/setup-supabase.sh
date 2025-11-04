#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Supabase CLI is not installed. Please install it first:${NC}"
    echo "npm install -g supabase --save-dev"
    echo -e "Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Load environment variables
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo -e "${YELLOW}Warning: .env file not found. Using default values.${NC}"
fi

# Set default values if not set in .env
SUPABASE_URL=${SUPABASE_URL:-"http://localhost:54321"}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WoHP05EDvXBwCHJDbc6QY"}
SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY:-"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9obAHOGyVVKa3pz--HVGlFhxOAExds_eIGB5zXqUQ"}

# Export for Supabase CLI
export SUPABASE_URL

echo -e "${GREEN}Starting Supabase setup...${NC}"

# Check if migrations directory exists
if [ ! -d "migrations" ]; then
    echo -e "${RED}Error: migrations directory not found.${NC}"
    exit 1
fi

# Apply migrations in order
for migration in $(ls migrations/*.sql | sort); do
    echo -e "${GREEN}Applying migration: ${migration}${NC}"
    
    if ! psql "$SUPABASE_URL" -f "$migration"; then
        echo -e "${RED}Error applying migration: ${migration}${NC}"
        exit 1
    fi
done

# Verify the table was created
echo -e "\n${GREEN}Verifying setup...${NC}"
if ! psql "$SUPABASE_URL" -c "\dt public.*" | grep -q "faqs"; then
    echo -e "${RED}Error: Failed to verify faqs table creation${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Supabase setup completed successfully!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Run the import script to load your FAQ data:"
echo "   node scripts/import-faqs.js"
echo -e "\n2. Start the development server:"
echo "   npm run dev"
