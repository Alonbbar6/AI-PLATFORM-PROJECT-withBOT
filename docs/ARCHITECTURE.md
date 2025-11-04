# FAQ Embedding System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FAQ EMBEDDING SYSTEM                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Data Layer │      │ Script Layer │      │ Service Layer│
└──────────────┘      └──────────────┘      └──────────────┘
       │                     │                      │
       ▼                     ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  faqs.json   │      │  generate-   │      │   OpenAI     │
│              │─────▶│  embeddings  │─────▶│   API        │
│  60 FAQs     │      │              │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
                             │                      │
                             │                      ▼
                             │              ┌──────────────┐
                             │              │  Embeddings  │
                             │              │  (1536-dim)  │
                             │              └──────────────┘
                             │                      │
                             ▼                      ▼
                      ┌──────────────┐      ┌──────────────┐
                      │   Supabase   │◀─────│    Cache     │
                      │  PostgreSQL  │      │   (local)    │
                      │  + pgvector  │      └──────────────┘
                      └──────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │   Verify     │
                      │  Embeddings  │
                      └──────────────┘
```

## Data Flow

### 1. Embedding Generation Flow

```
User runs: npm run generate:embeddings
           │
           ▼
    ┌─────────────┐
    │ Load .env   │
    │ variables   │
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │ Initialize  │
    │ OpenAI +    │
    │ Supabase    │
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │ Fetch FAQs  │
    │ from DB     │
    │ (no embed)  │
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │ Process in  │
    │ batches of  │
    │ 10 FAQs     │
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │ For each    │
    │ FAQ:        │
    │ Q + A → txt │
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │ Call OpenAI │
    │ Embeddings  │
    │ API         │
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │ Cache       │
    │ locally     │
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │ Update      │
    │ Supabase    │
    │ with vector │
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │ Show        │
    │ progress &  │
    │ summary     │
    └─────────────┘
```

### 2. Search Flow (Application Usage)

```
User Query: "How do I set up my environment?"
           │
           ▼
    ┌─────────────┐
    │ Generate    │
    │ embedding   │
    │ for query   │
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │ Call        │
    │ match_faqs  │
    │ function    │
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │ Cosine      │
    │ similarity  │
    │ search      │
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │ Return top  │
    │ 5 matches   │
    │ with scores │
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │ Display     │
    │ answer to   │
    │ user        │
    └─────────────┘
```

## Component Architecture

### Scripts Layer

```
scripts/
├── generate-embeddings.js
│   ├── validateEnvironment()
│   ├── initializeOpenAI()
│   ├── initializeSupabase()
│   ├── fetchFAQs()
│   ├── generateEmbedding()
│   ├── updateEmbedding()
│   ├── processBatch()
│   └── main()
│
├── verify-embeddings.js
│   ├── getTotalCount()
│   ├── getEmbeddedCount()
│   ├── getMissingEmbeddings()
│   ├── verifyDimensions()
│   ├── testSimilaritySearch()
│   └── generateReport()
│
└── setup-supabase.sh
    ├── Check CLI installation
    ├── Load environment
    ├── Apply migrations
    └── Verify setup
```

### Database Schema

```sql
Table: faqs
├── id (BIGSERIAL PRIMARY KEY)
├── question (TEXT NOT NULL)
├── answer (TEXT NOT NULL)
├── category (TEXT NOT NULL)
├── keywords (TEXT[] NOT NULL)
├── embedding (VECTOR(1536))
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

Indexes:
├── PRIMARY KEY on id
├── UNIQUE on question
├── ivfflat on embedding (vector_cosine_ops)
├── btree on category
└── gin on keywords

Functions:
└── match_faqs(query_embedding, match_threshold, match_count)
    └── Returns similar FAQs with similarity scores
```

## Error Handling Architecture

```
┌─────────────────────────────────────────┐
│         Error Handling Layers           │
└─────────────────────────────────────────┘

Layer 1: Environment Validation
├── Missing variables → Clear error message
└── Invalid format → Validation error

Layer 2: API Errors
├── Rate limiting → Exponential backoff retry
├── Invalid key → Authentication error
├── Network error → Retry with delay
└── Timeout → Retry with longer timeout

Layer 3: Database Errors
├── Connection failed → Retry connection
├── Query error → Log and skip
├── Update failed → Save to failed list
└── Constraint violation → Skip duplicate

Layer 4: Application Errors
├── Unexpected error → Log and continue
├── SIGINT (Ctrl+C) → Graceful shutdown
└── Out of memory → Reduce batch size

Recovery Mechanisms:
├── failed-embeddings.json → Track failures
├── cache/embeddings-cache.json → Local backup
└── logs/ → Detailed error logs
```

## Performance Optimization

```
┌─────────────────────────────────────────┐
│        Performance Strategies           │
└─────────────────────────────────────────┘

1. Batch Processing
   ├── Process 10 FAQs at a time
   ├── Parallel API calls within batch
   └── Small delay between batches

2. Caching
   ├── Local cache before upload
   ├── Prevents duplicate API calls
   └── Faster recovery on failure

3. Database Optimization
   ├── ivfflat index for fast search
   ├── Appropriate list parameter (100)
   └── Efficient query planning

4. API Optimization
   ├── Use text-embedding-3-small (cheaper)
   ├── Batch requests when possible
   └── Exponential backoff on rate limits

5. Memory Management
   ├── Stream processing for large datasets
   ├── Clear variables after use
   └── Efficient data structures
```

## Security Architecture

```
┌─────────────────────────────────────────┐
│          Security Layers                │
└─────────────────────────────────────────┘

Layer 1: Environment Variables
├── .env file (not committed)
├── .env.example (template only)
└── Validation on startup

Layer 2: API Keys
├── OpenAI API key (secret)
├── Supabase service key (secret)
└── Anon key (public, limited access)

Layer 3: Database Security
├── Row Level Security (RLS)
├── Service role for backend
└── Anon role for frontend

Layer 4: Data Protection
├── No sensitive data in logs
├── No API keys in error messages
└── Encrypted backups

Layer 5: Access Control
├── .gitignore for sensitive files
├── Proper file permissions
└── Secure credential storage
```

## Monitoring & Logging

```
┌─────────────────────────────────────────┐
│       Monitoring Architecture           │
└─────────────────────────────────────────┘

Logs Directory (logs/)
├── embeddings-[timestamp].log
│   ├── All operations
│   ├── Success/failure status
│   ├── Error details
│   └── Timing information

Cache Directory (cache/)
├── embeddings-cache.json
│   ├── Local backup
│   ├── Timestamp per entry
│   └── Recovery data

Failed Tracking
├── failed-embeddings.json
│   ├── Failed FAQ IDs
│   ├── Timestamp
│   └── Retry information

Console Output
├── Colored status messages
├── Progress bars
├── Summary statistics
└── Cost estimates
```

## Scalability Considerations

```
Current Capacity:
├── 60 FAQs: ~12 seconds
├── 1,000 FAQs: ~3.5 minutes
├── 10,000 FAQs: ~35 minutes
└── 100,000 FAQs: ~6 hours

Scaling Strategies:
├── Increase batch size (10 → 50)
├── Parallel processing (multiple workers)
├── Distributed processing (multiple machines)
└── Incremental updates (only changed FAQs)

Database Scaling:
├── Read replicas for search
├── Partitioning by category
├── Separate tables for different modules
└── Archive old embeddings
```

## Integration Points

```
┌─────────────────────────────────────────┐
│        System Integration               │
└─────────────────────────────────────────┘

Frontend Integration:
├── Search component
├── FAQ display
├── Chatbot interface
└── Admin panel

Backend Integration:
├── API endpoints
├── Webhook handlers
├── Scheduled jobs
└── Admin functions

External Services:
├── OpenAI API
├── Supabase
├── Vercel (deployment)
└── Monitoring services

Development Tools:
├── npm scripts
├── CLI commands
├── Testing utilities
└── Documentation
```

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Deployment Flow                 │
└─────────────────────────────────────────┘

Development:
├── Local development
├── Test with --dry-run
├── Verify with --limit
└── Full generation

Staging:
├── Deploy migrations
├── Generate embeddings
├── Run verification
└── Test search functionality

Production:
├── Backup existing data
├── Deploy migrations
├── Generate embeddings
├── Monitor performance
└── Verify functionality

Rollback Plan:
├── Database backups
├── Previous embeddings
├── Migration rollback
└── Error recovery
```

## Cost Architecture

```
┌─────────────────────────────────────────┐
│          Cost Breakdown                 │
└─────────────────────────────────────────┘

OpenAI Costs:
├── text-embedding-3-small: $0.02/1M tokens
├── Average FAQ: 100-200 tokens
├── 60 FAQs: ~$0.0024
└── 1,000 FAQs: ~$0.004

Supabase Costs:
├── Database storage: Included in free tier
├── Vector storage: Minimal overhead
├── API calls: Included in free tier
└── Bandwidth: Minimal for embeddings

Total Monthly Costs (1,000 FAQs):
├── Initial generation: $0.004
├── Updates (10% monthly): $0.0004
├── Infrastructure: $0 (free tier)
└── Total: ~$0.005/month
```

## Future Enhancements

```
Planned Features:
├── Multi-language support
├── Automatic FAQ updates
├── A/B testing for embeddings
├── Custom embedding models
└── Real-time embedding generation

Performance Improvements:
├── Streaming embeddings
├── Parallel processing
├── Caching strategies
└── Query optimization

Monitoring Enhancements:
├── Dashboard integration
├── Alert system
├── Performance metrics
└── Usage analytics
```

---

## Quick Reference

### Key Files
- **Main Script**: `scripts/generate-embeddings.js`
- **Verification**: `scripts/verify-embeddings.js`
- **Data**: `data/faqs.json`
- **Migrations**: `migrations/001_create_faqs_table.sql`

### Key Commands
- **Generate**: `npm run generate:embeddings`
- **Verify**: `npm run verify:embeddings`
- **Retry**: `npm run retry:embeddings`

### Key Concepts
- **Embeddings**: 1536-dimensional vectors
- **Model**: text-embedding-3-small
- **Search**: Cosine similarity
- **Batch Size**: 10 FAQs

---

**Architecture Status**: ✅ Production-Ready
