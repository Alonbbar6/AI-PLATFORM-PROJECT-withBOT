# FAQ System Setup Guide

Complete guide for setting up and managing the FAQ database and embedding system.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# 3. Run database migrations
chmod +x scripts/setup-supabase.sh
./scripts/setup-supabase.sh

# 4. Generate embeddings
npm run generate:embeddings

# 5. Verify everything works
npm run verify:embeddings
```

## Detailed Setup

### 1. Database Setup

#### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

#### Option B: Manual Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migrations in order:
   - `migrations/001_create_faqs_table.sql`
   - `migrations/002_seed_sample_data.sql`

### 2. Environment Configuration

Create a `.env` file with the following:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key

# Application Configuration
NODE_ENV=development
PORT=3000
```

#### Where to Find Your Keys

**Supabase Keys:**
1. Go to your Supabase project dashboard
2. Click **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_KEY` (⚠️ Keep this secret!)

**OpenAI API Key:**
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Go to **API Keys**
3. Click **Create new secret key**
4. Copy the key immediately (you won't see it again!)

### 3. Import FAQ Data

You have several options to populate your FAQ database:

#### Option A: Use Sample Data (Quick Start)

The seed migration already includes sample data. Skip to embedding generation.

#### Option B: Import from JSON

```bash
# Import from the provided faqs.json
node scripts/import-faqs.js --file data/faqs.json
```

#### Option C: Add FAQs Manually

```bash
# Interactive CLI to add one FAQ at a time
node scripts/add-faq.js
```

### 4. Generate Embeddings

Generate vector embeddings for semantic search:

```bash
# Generate embeddings for all FAQs
npm run generate:embeddings

# Or with options
node scripts/generate-embeddings.js --limit=10  # Test with 10 FAQs first
node scripts/generate-embeddings.js --dry-run   # Preview without generating
```

**Expected Output:**
```
🚀 FAQ Embedding Generator

✓ Environment variables validated
✓ OpenAI and Supabase clients initialized

Configuration:
  Model: text-embedding-3-small
  Batch Size: 10
  Force Regenerate: No
  Retry Failed: No
  Dry Run: No

📥 Fetching FAQs from Supabase...
✓ Found 60 FAQs to process

⚙️  Processing FAQs...

████████████████████████████████████████████████ | 100% | 60/60 FAQs | ETA: 0s

✓ Generated embedding for FAQ 1: "What is the main objective of Module 1?..."
✓ Generated embedding for FAQ 2: "How do I set up my development environment?..."
...

============================================================
  SUMMARY
============================================================
  ✓ Successful: 60
  ✗ Failed: 0
  Total Processed: 60
  Duration: 12.34s
  Rate: 4.86 embeddings/second

💰 Cost Estimate: $0.0024 USD (12,000 tokens)
============================================================
```

### 5. Verify Setup

Run the verification script to ensure everything is working:

```bash
npm run verify:embeddings
```

**Expected Output:**
```
🔍 Verifying FAQ Embeddings...

======================================================================
  EMBEDDING VERIFICATION REPORT
======================================================================

📊 Coverage Statistics:
  Total FAQs: 60
  With Embeddings: 60
  Missing Embeddings: 0
  Progress: [██████████████████████████████████████████████████] 100.00%

✓ All FAQs have embeddings!

🔍 Dimension Verification:
  ✓ All embeddings have correct dimensions (1536)

🔎 Similarity Search Test:
  ✓ Similarity search is working
  Sample Query: "What is the main objective of Module 1?..."
  Results Found: 5
  Top Match: "What is the main objective of Module 1?..."
  Similarity: 100.00%

💡 Recommendations:
  ✓ Everything looks good! Your embedding system is ready to use.

======================================================================
```

## Managing FAQs

### Adding New FAQs

#### Method 1: Interactive CLI

```bash
node scripts/add-faq.js
```

Follow the prompts to enter:
- Question
- Answer
- Category
- Keywords (comma-separated)

#### Method 2: Edit JSON File

1. Add your FAQ to `data/faqs.json`
2. Import: `node scripts/import-faqs.js`
3. Generate embeddings: `npm run generate:embeddings`

#### Method 3: Via Spreadsheet

1. Edit `data/faq-template.csv`
2. Convert: `node scripts/csv-to-json.js`
3. Import: `node scripts/import-faqs.js`
4. Generate embeddings: `npm run generate:embeddings`

### Updating FAQs

When you update FAQ content, regenerate embeddings:

```bash
# Regenerate for specific FAQs (after updating in database)
npm run generate:embeddings

# Force regenerate all embeddings
node scripts/generate-embeddings.js --force
```

### Exporting FAQs

Export your FAQ database to JSON:

```bash
node scripts/export-faqs.js

# Export specific category
node scripts/export-faqs.js --category="Module 1"
```

### Validating FAQs

Check for issues in your FAQ database:

```bash
node scripts/validate-faqs.js
```

This checks for:
- Duplicate questions
- Missing fields
- Answer length issues
- FAQs without keywords

## Troubleshooting

### Common Issues

#### "No FAQs to process"

**Cause**: All FAQs already have embeddings.

**Solution**: This is normal! If you want to regenerate:
```bash
node scripts/generate-embeddings.js --force
```

#### "Rate limit exceeded"

**Cause**: Too many API requests to OpenAI.

**Solution**: 
1. Wait a few minutes
2. Run with retry: `npm run retry:embeddings`
3. Check your OpenAI account tier

#### "Failed to update FAQ"

**Cause**: Database connection or permission issue.

**Solution**:
1. Verify `SUPABASE_SERVICE_KEY` in `.env`
2. Check table permissions in Supabase
3. Ensure the `faqs` table exists

#### "Similarity search failed"

**Cause**: The `match_faqs` function doesn't exist.

**Solution**:
1. Run migration: `migrations/001_create_faqs_table.sql`
2. Verify in Supabase SQL Editor

### Getting Help

1. Check logs: `ls -lt logs/`
2. Run verification: `npm run verify:embeddings`
3. Review documentation: `docs/EMBEDDINGS.md`

## Cost Management

### Estimating Costs

The embedding system uses OpenAI's `text-embedding-3-small` model:

- **Cost**: $0.02 per 1M tokens
- **Average FAQ**: 100-200 tokens
- **1000 FAQs**: ~$0.002-0.004 USD

### Minimizing Costs

1. **Don't regenerate unnecessarily**: Only use `--force` when needed
2. **Test with limits**: Use `--limit=10` for testing
3. **Use dry runs**: Test with `--dry-run` before actual generation
4. **Batch updates**: Update multiple FAQs before regenerating embeddings

### Monitoring Costs

The script shows cost estimates after each run:

```
💰 Cost Estimate: $0.0024 USD (12,000 tokens)
```

Track your OpenAI usage at: https://platform.openai.com/usage

## Best Practices

### 1. Regular Maintenance

```bash
# Weekly: Verify embeddings
npm run verify:embeddings

# After content updates: Regenerate embeddings
npm run generate:embeddings

# Monthly: Validate FAQ quality
node scripts/validate-faqs.js
```

### 2. Content Guidelines

- **Questions**: Clear, concise, natural language
- **Answers**: 2-4 sentences, comprehensive but brief
- **Categories**: Consistent naming (Module 1, Module 2, etc.)
- **Keywords**: 3-5 relevant terms per FAQ

### 3. Testing Changes

Always test with a small subset first:

```bash
# Test with 5 FAQs
node scripts/generate-embeddings.js --limit=5 --dry-run

# If looks good, run for real
node scripts/generate-embeddings.js --limit=5

# Then do the full batch
npm run generate:embeddings
```

### 4. Backup Strategy

Before major changes:

```bash
# Export current FAQs
node scripts/export-faqs.js

# This creates: faqs-export-[timestamp].json
```

## Advanced Usage

### Batch Processing

Process FAQs in smaller batches:

```bash
# Process 50 at a time
node scripts/generate-embeddings.js --limit=50

# Check progress
npm run verify:embeddings

# Continue with next batch
node scripts/generate-embeddings.js --limit=50
```

### Custom Workflows

Create custom scripts by importing the utilities:

```javascript
import { generateEmbedding } from './scripts/generate-embeddings.js';
import { createClient } from '@supabase/supabase-js';

// Your custom logic here
```

### Monitoring

Check logs for detailed information:

```bash
# View latest log
tail -f logs/embeddings-*.log

# Search for errors
grep ERROR logs/embeddings-*.log

# Count successful embeddings
grep "Successfully processed" logs/embeddings-*.log | wc -l
```

## Next Steps

After setup is complete:

1. **Implement Search**: Use the `match_faqs` function in your application
2. **Build UI**: Create a search interface for users
3. **Add Chatbot**: Integrate with a chatbot for natural language queries
4. **Monitor Usage**: Track which FAQs are most searched
5. **Iterate**: Update FAQs based on user feedback

## Resources

- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Supabase Vector Documentation](https://supabase.com/docs/guides/ai/vector-columns)
- [Project Documentation](./EMBEDDINGS.md)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review log files in `logs/` directory
3. Run diagnostics: `npm run verify:embeddings`
4. Consult the detailed documentation: `docs/EMBEDDINGS.md`
