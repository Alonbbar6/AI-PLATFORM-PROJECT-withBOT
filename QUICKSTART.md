# Quick Start Guide - FAQ Embedding System

## 🚀 Get Started in 5 Minutes

### Step 1: Verify Your Environment

Make sure you have your `.env` file configured:

```bash
cat .env
```

You should see:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_KEY`
- ✅ `OPENAI_API_KEY`

### Step 2: Run Database Migrations

```bash
# Make sure you're in the project directory
cd /Users/user/Desktop/teams\ ai\ project/AI-PLATFORM-PROJECT

# Run migrations (if not already done)
./scripts/setup-supabase.sh
```

### Step 3: Generate Embeddings

```bash
# Generate embeddings for all FAQs
npm run generate:embeddings
```

**Expected time**: ~30-60 seconds for 60 FAQs

### Step 4: Verify Everything Works

```bash
npm run verify:embeddings
```

You should see 100% coverage!

---

## 📋 Common Commands

```bash
# Generate embeddings for new FAQs only
npm run generate:embeddings

# Verify embedding coverage
npm run verify:embeddings

# Retry failed embeddings
npm run retry:embeddings

# Test with 5 FAQs first
node scripts/generate-embeddings.js --limit=5

# Preview without generating
node scripts/generate-embeddings.js --dry-run

# Force regenerate all
node scripts/generate-embeddings.js --force
```

---

## 🎯 What You Just Built

### 1. Vector Embeddings
- ✅ 60 FAQs with semantic search capability
- ✅ OpenAI text-embedding-3-small model
- ✅ 1536-dimensional vectors

### 2. Database Setup
- ✅ PostgreSQL with pgvector extension
- ✅ Optimized indexes for fast search
- ✅ Match function for similarity search

### 3. Production-Ready Scripts
- ✅ Automatic retry on failures
- ✅ Progress tracking
- ✅ Cost estimation
- ✅ Graceful shutdown (CTRL+C)

---

## 💡 Next Steps

### Use the Embeddings in Your App

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Search for similar FAQs
async function searchFAQs(queryEmbedding) {
  const { data, error } = await supabase.rpc('match_faqs', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: 5
  });
  
  return data;
}
```

### Generate Embedding for User Query

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function getQueryEmbedding(question) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: question
  });
  
  return response.data[0].embedding;
}
```

### Complete Search Flow

```javascript
async function answerQuestion(userQuestion) {
  // 1. Generate embedding for user's question
  const queryEmbedding = await getQueryEmbedding(userQuestion);
  
  // 2. Find similar FAQs
  const similarFAQs = await searchFAQs(queryEmbedding);
  
  // 3. Return the best match
  if (similarFAQs.length > 0) {
    return similarFAQs[0]; // { question, answer, similarity }
  }
  
  return null;
}
```

---

## 🔧 Troubleshooting

### "Missing required environment variables"
→ Check your `.env` file has all required keys

### "No FAQs to process"
→ All embeddings are already generated! Use `--force` to regenerate

### "Rate limit exceeded"
→ Wait a few minutes, then run `npm run retry:embeddings`

### "Similarity search failed"
→ Run the migration: `./scripts/setup-supabase.sh`

---

## 📊 Cost Breakdown

For your 60 FAQs:
- **Tokens used**: ~12,000
- **Cost**: ~$0.0024 USD
- **Per FAQ**: ~$0.00004 USD

Adding 1000 more FAQs would cost approximately **$0.04 USD**.

---

## 📚 Full Documentation

- **[FAQ Setup Guide](docs/FAQ-SETUP.md)** - Complete setup instructions
- **[Embeddings Documentation](docs/EMBEDDINGS.md)** - Detailed system guide
- **[Main README](README.md)** - Project overview

---

## ✅ Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Embeddings generated
- [ ] Verification passed
- [ ] Ready to implement search!

---

## 🎉 You're All Set!

Your FAQ system is now powered by AI semantic search. Users can ask questions in natural language and get relevant answers instantly.

**Happy coding!** 🚀
