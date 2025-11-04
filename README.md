# AI-PLATFORM-PROJECT

Integrated educational and technological platform developed under the Miami Tech Works EPIC program. Delivers a 20-hour bilingual AI course with authentication, interactive modules, quizzes, progress tracking, certification, analytics, and an AI chatbot. Built using Next.js, Supabase, and Vercel following the SCRUM framework.

## Features

- 🎓 Interactive learning modules
- 🤖 AI-powered chatbot with semantic search
- 📊 Progress tracking and analytics
- 🏆 Certification system
- 🔐 Secure authentication
- 🌐 Bilingual support (English/Spanish)
- 🔍 Vector-based FAQ search

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## FAQ System Setup

This project includes a comprehensive FAQ system with vector embeddings for semantic search.

### Initial Setup

```bash
# 1. Run database migrations
chmod +x scripts/setup-supabase.sh
./scripts/setup-supabase.sh

# 2. Generate embeddings for FAQs
npm run generate:embeddings

# 3. Verify everything works
npm run verify:embeddings
```

### Available Scripts

```bash
npm run generate:embeddings  # Generate embeddings for new FAQs
npm run verify:embeddings    # Verify embedding coverage and quality
npm run retry:embeddings     # Retry failed embeddings
```

### Documentation

- **[FAQ Setup Guide](docs/FAQ-SETUP.md)** - Complete setup instructions
- **[Embeddings Documentation](docs/EMBEDDINGS.md)** - Detailed embedding system guide

## Project Structure

```
├── app/                    # Next.js app directory
├── data/                   # FAQ data files
│   ├── faqs.json          # FAQ database
│   └── faq-template.json  # Template for new FAQs
├── migrations/            # Database migrations
│   ├── 001_create_faqs_table.sql
│   └── 002_seed_sample_data.sql
├── scripts/               # Utility scripts
│   ├── generate-embeddings.js
│   └── verify-embeddings.js
├── docs/                  # Documentation
│   ├── FAQ-SETUP.md
│   └── EMBEDDINGS.md
└── public/               # Static assets
```

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# OpenAI (for embeddings)
OPENAI_API_KEY=your-openai-api-key

# Application
NODE_ENV=development
PORT=3000
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS
- **Backend**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenAI Embeddings API
- **Deployment**: Vercel

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Contributing

This project follows the SCRUM framework. Please refer to the team documentation for contribution guidelines.

## License

Developed under the Miami Tech Works EPIC program.
