#!/usr/bin/env node

/**
 * Generate and store vector embeddings for FAQs using OpenAI's embedding API
 * 
 * Usage:
 *   node scripts/generate-embeddings.js
 *   node scripts/generate-embeddings.js --force
 *   node scripts/generate-embeddings.js --retry
 *   node scripts/generate-embeddings.js --dry-run
 *   node scripts/generate-embeddings.js --limit 10
 */

import 'dotenv/config';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BATCH_SIZE = 10;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const COST_PER_1M_TOKENS = 0.02; // USD for text-embedding-3-small

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  force: args.includes('--force'),
  retry: args.includes('--retry'),
  dryRun: args.includes('--dry-run'),
  limit: args.find(arg => arg.startsWith('--limit'))?.split('=')[1] || null
};

// Global state for graceful shutdown
let isShuttingDown = false;
let processedCount = 0;
let failedIds = [];

/**
 * Validate required environment variables
 * @throws {Error} If required variables are missing
 */
function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'OPENAI_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file.`
    );
  }
}

/**
 * Initialize OpenAI client
 * @returns {OpenAI} Configured OpenAI client
 */
function initializeOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

/**
 * Initialize Supabase client
 * @returns {SupabaseClient} Configured Supabase client
 */
function initializeSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

/**
 * Create log file for this session
 * @returns {string} Log file path
 */
function createLogFile() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = path.join(__dirname, '..', 'logs', `embeddings-${timestamp}.log`);
  
  // Ensure logs directory exists
  const logsDir = path.dirname(logPath);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  return logPath;
}

/**
 * Write to log file and console
 * @param {string} message - Message to log
 * @param {string} logPath - Path to log file
 * @param {string} level - Log level (info, error, warn)
 */
function log(message, logPath, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  
  fs.appendFileSync(logPath, logMessage);
  
  if (level === 'error') {
    console.error(chalk.red(message));
  } else if (level === 'warn') {
    console.warn(chalk.yellow(message));
  } else {
    console.log(message);
  }
}

/**
 * Load failed FAQ IDs from previous run
 * @returns {number[]} Array of failed FAQ IDs
 */
function loadFailedIds() {
  const failedPath = path.join(__dirname, '..', 'failed-embeddings.json');
  
  if (fs.existsSync(failedPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(failedPath, 'utf8'));
      return data.failedIds || [];
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not read failed-embeddings.json: ${error.message}`));
      return [];
    }
  }
  
  return [];
}

/**
 * Save failed FAQ IDs for retry
 * @param {number[]} ids - Array of failed FAQ IDs
 */
function saveFailedIds(ids) {
  const failedPath = path.join(__dirname, '..', 'failed-embeddings.json');
  
  try {
    fs.writeFileSync(
      failedPath,
      JSON.stringify({ failedIds: ids, timestamp: new Date().toISOString() }, null, 2)
    );
    console.log(chalk.yellow(`\nSaved ${ids.length} failed IDs to failed-embeddings.json`));
  } catch (error) {
    console.error(chalk.red(`Error saving failed IDs: ${error.message}`));
  }
}

/**
 * Fetch FAQs from Supabase
 * @param {SupabaseClient} supabase - Supabase client
 * @param {Object} options - Fetch options
 * @returns {Promise<Array>} Array of FAQ objects
 */
async function fetchFAQs(supabase, options = {}) {
  const { force = false, retry = false, limit = null } = options;

  let query = supabase
    .from('faqs')
    .select('id, question, answer, category, keywords');

  if (retry) {
    const failedIds = loadFailedIds();
    if (failedIds.length === 0) {
      throw new Error('No failed embeddings to retry. Run without --retry flag first.');
    }
    query = query.in('id', failedIds);
  } else if (!force) {
    query = query.is('embedding', null);
  }

  if (limit) {
    query = query.limit(parseInt(limit));
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch FAQs: ${error.message}`);
  }

  return data || [];
}

/**
 * Generate embedding for text using OpenAI
 * @param {OpenAI} openai - OpenAI client
 * @param {string} text - Text to embed
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} Embedding data with vector and token count
 */
async function generateEmbedding(openai, text, retryCount = 0) {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: 'float'
    });

    return {
      embedding: response.data[0].embedding,
      tokens: response.usage.total_tokens
    };
  } catch (error) {
    // Handle rate limiting with exponential backoff
    if (error.status === 429 && retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(chalk.yellow(`Rate limited. Retrying in ${delay}ms...`));
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateEmbedding(openai, text, retryCount + 1);
    }

    throw error;
  }
}

/**
 * Update FAQ with embedding in Supabase
 * @param {SupabaseClient} supabase - Supabase client
 * @param {number} id - FAQ ID
 * @param {number[]} embedding - Embedding vector
 * @returns {Promise<void>}
 */
async function updateEmbedding(supabase, id, embedding) {
  const { error } = await supabase
    .from('faqs')
    .update({ embedding })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update FAQ ${id}: ${error.message}`);
  }
}

/**
 * Cache embedding locally before uploading
 * @param {number} id - FAQ ID
 * @param {number[]} embedding - Embedding vector
 */
function cacheEmbedding(id, embedding) {
  const cachePath = path.join(__dirname, '..', 'cache', 'embeddings-cache.json');
  
  let cache = {};
  if (fs.existsSync(cachePath)) {
    try {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not read cache: ${error.message}`));
    }
  }

  cache[id] = {
    embedding,
    timestamp: new Date().toISOString()
  };

  try {
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.warn(chalk.yellow(`Warning: Could not write to cache: ${error.message}`));
  }
}

/**
 * Process a single FAQ
 * @param {OpenAI} openai - OpenAI client
 * @param {SupabaseClient} supabase - Supabase client
 * @param {Object} faq - FAQ object
 * @param {string} logPath - Log file path
 * @param {boolean} dryRun - Whether this is a dry run
 * @returns {Promise<Object>} Result object with success status and tokens used
 */
async function processFAQ(openai, supabase, faq, logPath, dryRun = false) {
  try {
    // Combine question and answer for embedding
    const text = `${faq.question}\n${faq.answer}`;
    
    if (dryRun) {
      log(`[DRY RUN] Would process FAQ ${faq.id}: "${faq.question.substring(0, 50)}..."`, logPath);
      return { success: true, tokens: 0, id: faq.id };
    }

    // Generate embedding
    const { embedding, tokens } = await generateEmbedding(openai, text);

    // Validate embedding dimensions
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Invalid embedding dimensions: ${embedding.length} (expected ${EMBEDDING_DIMENSIONS})`);
    }

    // Cache embedding
    cacheEmbedding(faq.id, embedding);

    // Update in Supabase
    await updateEmbedding(supabase, faq.id, embedding);

    const preview = faq.question.substring(0, 60);
    console.log(chalk.green(`✓ Generated embedding for FAQ ${faq.id}: "${preview}..."`));
    log(`Successfully processed FAQ ${faq.id}`, logPath);

    return { success: true, tokens, id: faq.id };
  } catch (error) {
    const preview = faq.question.substring(0, 60);
    console.error(chalk.red(`✗ Failed FAQ ${faq.id}: "${preview}..." - ${error.message}`));
    log(`Failed to process FAQ ${faq.id}: ${error.message}`, logPath, 'error');
    
    return { success: false, tokens: 0, id: faq.id, error: error.message };
  }
}

/**
 * Process FAQs in batches
 * @param {OpenAI} openai - OpenAI client
 * @param {SupabaseClient} supabase - Supabase client
 * @param {Array} faqs - Array of FAQ objects
 * @param {string} logPath - Log file path
 * @param {boolean} dryRun - Whether this is a dry run
 * @returns {Promise<Object>} Processing results
 */
async function processBatch(openai, supabase, faqs, logPath, dryRun = false) {
  const results = {
    successful: 0,
    failed: 0,
    totalTokens: 0,
    failedIds: []
  };

  // Create progress bar
  const progressBar = new cliProgress.SingleBar({
    format: chalk.cyan('{bar}') + ' | {percentage}% | {value}/{total} FAQs | ETA: {eta}s',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });

  progressBar.start(faqs.length, 0);

  const startTime = Date.now();

  // Process in batches
  for (let i = 0; i < faqs.length; i += BATCH_SIZE) {
    if (isShuttingDown) {
      console.log(chalk.yellow('\nGracefully shutting down...'));
      break;
    }

    const batch = faqs.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(faq => processFAQ(openai, supabase, faq, logPath, dryRun));
    
    const batchResults = await Promise.all(batchPromises);

    for (const result of batchResults) {
      if (result.success) {
        results.successful++;
        results.totalTokens += result.tokens;
      } else {
        results.failed++;
        results.failedIds.push(result.id);
        failedIds.push(result.id);
      }
      
      processedCount++;
      progressBar.update(processedCount);
    }

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < faqs.length && !dryRun) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  progressBar.stop();

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  const rate = processedCount / duration;

  results.duration = duration;
  results.rate = rate;

  return results;
}

/**
 * Calculate and display cost estimate
 * @param {number} totalTokens - Total tokens used
 */
function displayCostEstimate(totalTokens) {
  const cost = (totalTokens / 1_000_000) * COST_PER_1M_TOKENS;
  console.log(chalk.cyan(`\n💰 Cost Estimate: $${cost.toFixed(4)} USD (${totalTokens.toLocaleString()} tokens)`));
}

/**
 * Display final summary
 * @param {Object} results - Processing results
 * @param {boolean} dryRun - Whether this was a dry run
 */
function displaySummary(results, dryRun = false) {
  console.log(chalk.bold('\n' + '='.repeat(60)));
  console.log(chalk.bold.cyan('  SUMMARY'));
  console.log(chalk.bold('='.repeat(60)));
  
  if (dryRun) {
    console.log(chalk.yellow('  Mode: DRY RUN (no embeddings generated)'));
  }
  
  console.log(chalk.green(`  ✓ Successful: ${results.successful}`));
  console.log(chalk.red(`  ✗ Failed: ${results.failed}`));
  console.log(chalk.white(`  Total Processed: ${processedCount}`));
  console.log(chalk.white(`  Duration: ${results.duration.toFixed(2)}s`));
  console.log(chalk.white(`  Rate: ${results.rate.toFixed(2)} embeddings/second`));
  
  if (!dryRun) {
    displayCostEstimate(results.totalTokens);
  }
  
  console.log(chalk.bold('='.repeat(60) + '\n'));
}

/**
 * Main execution function
 */
async function main() {
  const logPath = createLogFile();
  
  console.log(chalk.bold.cyan('\n🚀 FAQ Embedding Generator\n'));
  
  try {
    // Validate environment
    validateEnvironment();
    console.log(chalk.green('✓ Environment variables validated'));

    // Initialize clients
    const openai = initializeOpenAI();
    const supabase = initializeSupabase();
    console.log(chalk.green('✓ OpenAI and Supabase clients initialized'));

    // Display configuration
    console.log(chalk.cyan('\nConfiguration:'));
    console.log(`  Model: ${EMBEDDING_MODEL}`);
    console.log(`  Batch Size: ${BATCH_SIZE}`);
    console.log(`  Force Regenerate: ${flags.force ? 'Yes' : 'No'}`);
    console.log(`  Retry Failed: ${flags.retry ? 'Yes' : 'No'}`);
    console.log(`  Dry Run: ${flags.dryRun ? 'Yes' : 'No'}`);
    if (flags.limit) {
      console.log(`  Limit: ${flags.limit} FAQs`);
    }

    // Fetch FAQs
    console.log(chalk.cyan('\n📥 Fetching FAQs from Supabase...'));
    const faqs = await fetchFAQs(supabase, {
      force: flags.force,
      retry: flags.retry,
      limit: flags.limit
    });

    if (faqs.length === 0) {
      console.log(chalk.yellow('\n✓ No FAQs to process. All embeddings are up to date!'));
      return;
    }

    console.log(chalk.green(`✓ Found ${faqs.length} FAQs to process`));
    log(`Starting processing of ${faqs.length} FAQs`, logPath);

    // Process FAQs
    console.log(chalk.cyan('\n⚙️  Processing FAQs...\n'));
    const results = await processBatch(openai, supabase, faqs, logPath, flags.dryRun);

    // Save failed IDs if any
    if (results.failedIds.length > 0) {
      saveFailedIds(results.failedIds);
    }

    // Display summary
    displaySummary(results, flags.dryRun);

    log(`Processing complete. Successful: ${results.successful}, Failed: ${results.failed}`, logPath);

    if (results.failed > 0) {
      console.log(chalk.yellow(`\n💡 Tip: Run with --retry flag to reprocess failed embeddings`));
    }

  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
    log(`Fatal error: ${error.message}`, logPath, 'error');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n⚠️  Received SIGINT. Saving progress...'));
  isShuttingDown = true;
  
  if (failedIds.length > 0) {
    saveFailedIds(failedIds);
  }
  
  console.log(chalk.green(`✓ Processed ${processedCount} FAQs before shutdown`));
  process.exit(0);
});

// Run the script
main();
