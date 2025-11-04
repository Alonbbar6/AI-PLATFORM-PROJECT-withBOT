# FAQ Embedding System Documentation

## Overview

This system generates and manages vector embeddings for FAQ entries using OpenAI's embedding API. Embeddings enable semantic search, allowing users to find relevant FAQs based on meaning rather than just keyword matching.

## Table of Contents

- [Setup](#setup)
- [Usage](#usage)
- [Cost Information](#cost-information)
- [Troubleshooting](#troubleshooting)
- [Advanced Features](#advanced-features)

## Setup

### 1. Prerequisites

- Node.js 18+ installed
- OpenAI API account
- Supabase project set up with the FAQ table

### 2. Get Your OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (you won't be able to see it again!)

### 3. Configure Environment Variables

Add your OpenAI API key to the `.env` file:

```bash
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

Make sure these are also set:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

### 4. Run Database Migrations

Ensure the FAQ table and vector search functions are set up:

```bash
# If using Supabase CLI
supabase db push

# Or run the migrations manually
psql your-database-url -f migrations/001_create_faqs_table.sql
```

### 5. Install Dependencies

Dependencies should already be installed, but if needed:

```bash
npm install
```

## Usage

### Generate Embeddings for All FAQs

Process all FAQs that don't have embeddings yet:

```bash
npm run generate:embeddings
```

### Verify Embeddings

Check the status of your embeddings:

```bash
npm run verify:embeddings
```

This will show:
- Total FAQs vs FAQs with embeddings
- List of FAQs missing embeddings
- Dimension verification
- Similarity search test

### Retry Failed Embeddings

If some embeddings failed to generate, retry only those:

```bash
npm run retry:embeddings
```

### Advanced Options

#### Force Regenerate All Embeddings

Regenerate embeddings even for FAQs that already have them:

```bash
node scripts/generate-embeddings.js --force
```

#### Dry Run (Test Without Generating)

See what would be processed without making API calls:

```bash
node scripts/generate-embeddings.js --dry-run
```

#### Limit Processing

Process only a specific number of FAQs (useful for testing):

```bash
node scripts/generate-embeddings.js --limit=10
```

#### Combine Flags

```bash
node scripts/generate-embeddings.js --dry-run --limit=5
```

## Cost Information

### Pricing (as of 2024)

The system uses OpenAI's `text-embedding-3-small` model:

- **Cost**: $0.02 per 1 million tokens
- **Average FAQ**: ~100-200 tokens (question + answer)
- **Estimated cost per 1000 FAQs**: $0.002 - $0.004 USD

### Cost Examples

| FAQs | Estimated Tokens | Estimated Cost |
|------|------------------|----------------|
| 100  | 10,000 - 20,000  | $0.0002 - $0.0004 |
| 1,000| 100,000 - 200,000| $0.002 - $0.004 |
| 10,000| 1,000,000 - 2,000,000| $0.02 - $0.04 |

### Cost Optimization Tips

1. **Use the small model**: `text-embedding-3-small` is 10x cheaper than `text-embedding-3-large`
2. **Avoid regenerating**: Only regenerate embeddings when content changes
3. **Batch processing**: The system automatically batches requests to optimize API usage
4. **Cache locally**: Embeddings are cached before uploading to prevent data loss

## Troubleshooting

### Error: "Missing required environment variables"

**Solution**: Check your `.env` file has all required variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
OPENAI_API_KEY=...
```

### Error: "Rate limit exceeded"

**Solution**: The system automatically retries with exponential backoff. If you're hitting rate limits frequently:

1. Reduce batch size in the script (default is 10)
2. Wait a few minutes and run with `--retry` flag
3. Check your OpenAI account tier and limits

### Error: "Failed to update FAQ"

**Solution**: This is usually a Supabase connection issue:

1. Verify your `SUPABASE_SERVICE_KEY` is correct
2. Check that the `faqs` table exists
3. Ensure the `embedding` column is of type `VECTOR(1536)`

### Error: "Invalid embedding dimensions"

**Solution**: The embedding model returned unexpected dimensions:

1. Verify you're using `text-embedding-3-small` (1536 dimensions)
2. Check your OpenAI API key is valid
3. Try regenerating with `--force` flag

### Embeddings Generated But Search Not Working

**Solution**: The `match_faqs` function might be missing:

1. Run the migration: `migrations/001_create_faqs_table.sql`
2. Verify the function exists in Supabase SQL Editor
3. Run `npm run verify:embeddings` to test

### Script Interrupted/Crashed

**Solution**: The system saves progress automatically:

1. Failed FAQ IDs are saved to `failed-embeddings.json`
2. Run with `--retry` flag to continue: `npm run retry:embeddings`
3. Check `logs/` folder for detailed error logs

## Advanced Features

### Graceful Shutdown

Press `CTRL+C` to stop the script. It will:
- Save all failed FAQ IDs
- Display progress summary
- Exit cleanly

### Progress Tracking

The script shows:
- Real-time progress bar
- Embeddings per second rate
- Estimated time remaining
- Success/failure counts

### Logging

All operations are logged to `logs/embeddings-[timestamp].log`:

```bash
# View recent logs
ls -lt logs/

# Read a specific log
cat logs/embeddings-2024-01-15T10-30-00.log
```

### Caching

Embeddings are cached locally in `cache/embeddings-cache.json` before uploading to Supabase. This prevents data loss if the upload fails.

### Batch Processing

The system processes FAQs in batches of 10 to:
- Avoid overwhelming the API
- Provide better progress feedback
- Enable easier error recovery

## File Structure

```
├── scripts/
│   ├── generate-embeddings.js    # Main embedding generation script
│   └── verify-embeddings.js      # Verification and testing script
├── logs/                          # Operation logs (auto-generated)
├── cache/                         # Local embedding cache (auto-generated)
├── failed-embeddings.json         # Failed FAQ IDs (auto-generated)
└── docs/
    └── EMBEDDINGS.md             # This file
```

## Best Practices

1. **Run verification first**: Always run `npm run verify:embeddings` before generating
2. **Test with limits**: Use `--limit=10` when testing changes
3. **Monitor costs**: Check the cost estimate after each run
4. **Keep logs**: Don't delete log files until you're sure everything worked
5. **Backup before force**: Use `--force` carefully as it regenerates all embeddings
6. **Regular updates**: Regenerate embeddings when FAQ content changes significantly

## Support

If you encounter issues not covered here:

1. Check the log files in `logs/` directory
2. Run `npm run verify:embeddings` for diagnostics
3. Review the error messages carefully
4. Check OpenAI and Supabase status pages

## Next Steps

After generating embeddings:

1. Implement semantic search in your application
2. Use the `match_faqs` function in Supabase
3. Build a chatbot interface
4. Monitor search quality and user feedback

## Example Workflow

```bash
# 1. Verify current state
npm run verify:embeddings

# 2. Generate embeddings for new FAQs
npm run generate:embeddings

# 3. If any failed, retry them
npm run retry:embeddings

# 4. Verify everything is working
npm run verify:embeddings

# 5. Test with a dry run before force regeneration
node scripts/generate-embeddings.js --dry-run --force

# 6. Force regenerate if needed
node scripts/generate-embeddings.js --force
```
