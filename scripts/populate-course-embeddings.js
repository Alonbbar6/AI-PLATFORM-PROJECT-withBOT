#!/usr/bin/env node

/**
 * Populate Course Embeddings from PDF Module Files
 *
 * This script reads PDF module files, extracts content, generates embeddings,
 * and populates the course_embeddings table in Supabase.
 *
 * SAFE FOR TEAM USE: Only appends new content, doesn't overwrite existing data
 *
 * Usage:
 *   node scripts/populate-course-embeddings.js
 *   node scripts/populate-course-embeddings.js --dry-run
 *   node scripts/populate-course-embeddings.js --module 3
 *   node scripts/populate-course-embeddings.js --clear-first (WARNING: Deletes all existing data)
 */

import dotenv from 'dotenv';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');
const pdfParse = PDFParse;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

// ============================================
// CONFIGURATION
// ============================================

const CHUNK_SIZE = 1000; // Characters per chunk
const CHUNK_OVERLAP = 200; // Overlap between chunks
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  dryRun: args.includes('--dry-run'),
  clearFirst: args.includes('--clear-first'),
  module: args.find(arg => arg.startsWith('--module'))?.split('=')[1] || null
};

// Module file paths (relative to Desktop)
const MODULE_FILES = [
  { number: 1, path: '/Users/user/Desktop/Module_1_AI_Landscape_Quiz_Condensed (1).pdf', name: 'AI Landscape & Fundamentals' },
  { number: 3, path: '/Users/user/Desktop/Module 3.pdf', name: 'Module 3' },
  { number: 5, path: '/Users/user/Desktop/Module 5.pdf', name: 'Module 5' },
  { number: 6, path: '/Users/user/Desktop/Module 6.pdf', name: 'Module 6' },
  { number: 7, path: '/Users/user/Desktop/Module 7.pdf', name: 'Module 7' },
  { number: 8, path: '/Users/user/Desktop/Module 8.pdf', name: 'Module 8' },
  { number: 9, path: '/Users/user/Desktop/Module 9.pdf', name: 'Module 9' },
  { number: 10, path: '/Users/user/Desktop/Module 10.pdf', name: 'Module 10' }
];

// ============================================
// INITIALIZE CLIENTS
// ============================================

console.log('🔍 Validating environment variables...');

const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY', 'OPENAI_API_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n💡 Please check your .env file');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

console.log('✅ Environment validated and clients initialized\n');

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Read and parse PDF file
 */
async function readPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to read PDF ${filePath}: ${error.message}`);
  }
}

/**
 * Split text into chunks with overlap
 */
function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);

    // Only add non-empty chunks
    if (chunk.trim().length > 0) {
      chunks.push({
        content: chunk.trim(),
        start_position: start,
        end_position: end
      });
    }

    start += chunkSize - overlap;
  }

  return chunks;
}

/**
 * Extract topics/keywords from text chunk (simple extraction)
 */
function extractTopics(text) {
  // Simple topic extraction - you can enhance this with NLP
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being']);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  // Get frequency
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Get top 10 words
  const topWords = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  return topWords;
}

/**
 * Generate embedding with retry logic
 */
async function generateEmbedding(text, retryCount = 0) {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: 'float'
    });

    return response.data[0].embedding;
  } catch (error) {
    if (error.status === 429 && retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`  ⏳ Rate limited. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateEmbedding(text, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Store chunk in course_embeddings table
 */
async function storeChunk(moduleNumber, moduleName, filename, chunk, embedding, chunkIndex, totalChunks, topics) {
  const record = {
    module_number: moduleNumber,
    module_name: moduleName,
    filename: filename,
    content: chunk.content,
    embedding: embedding,
    chunk_index: chunkIndex,
    chunk_type: 'text',
    part_number: chunkIndex + 1,
    total_parts: totalChunks,
    topics: topics,
    full_content_length: chunk.content.length,
    content_type: 'pdf',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('course_embeddings')
    .insert(record)
    .select();

  if (error) {
    throw new Error(`Failed to store chunk: ${error.message}`);
  }

  return data;
}

/**
 * Check if module already exists in database
 */
async function checkModuleExists(moduleNumber, filename) {
  const { data, error } = await supabase
    .from('course_embeddings')
    .select('id, chunk_index')
    .eq('module_number', moduleNumber)
    .eq('filename', filename);

  if (error) {
    console.warn(`  ⚠️  Warning: Could not check existing data: ${error.message}`);
    return { exists: false, count: 0 };
  }

  return {
    exists: data && data.length > 0,
    count: data ? data.length : 0
  };
}

/**
 * Clear all course embeddings (DANGEROUS - use with caution)
 */
async function clearAllEmbeddings() {
  console.log('⚠️  WARNING: About to delete ALL course embeddings!');
  console.log('⏳ Waiting 5 seconds... Press Ctrl+C to cancel');

  await new Promise(resolve => setTimeout(resolve, 5000));

  const { error } = await supabase
    .from('course_embeddings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (error) {
    throw new Error(`Failed to clear embeddings: ${error.message}`);
  }

  console.log('✅ All embeddings cleared\n');
}

/**
 * Process a single module file
 */
async function processModule(moduleInfo) {
  const { number, path: filePath, name } = moduleInfo;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📚 Processing Module ${number}: ${name}`);
  console.log(`📄 File: ${path.basename(filePath)}`);
  console.log('='.repeat(60));

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return { success: false, reason: 'File not found' };
  }

  // Check if already processed
  const existingCheck = await checkModuleExists(number, path.basename(filePath));
  if (existingCheck.exists && !flags.clearFirst) {
    console.log(`ℹ️  Module ${number} already has ${existingCheck.count} chunks in database`);
    console.log(`💡 Use --clear-first to reprocess, or skip to avoid duplicates`);

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('Continue anyway? (yes/no): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('⏭️  Skipping module');
      return { success: false, reason: 'Skipped by user' };
    }
  }

  try {
    // Read PDF
    console.log('\n📖 Reading PDF...');
    const text = await readPDF(filePath);
    console.log(`✅ Extracted ${text.length} characters`);

    // Chunk text
    console.log(`\n✂️  Splitting into chunks (${CHUNK_SIZE} chars with ${CHUNK_OVERLAP} overlap)...`);
    const chunks = chunkText(text);
    console.log(`✅ Created ${chunks.length} chunks`);

    if (flags.dryRun) {
      console.log('\n🏃 DRY RUN - Not generating embeddings or storing data');
      console.log(`Would process ${chunks.length} chunks for Module ${number}`);
      return { success: true, chunks: chunks.length, dryRun: true };
    }

    // Process each chunk
    console.log(`\n⚙️  Generating embeddings and storing chunks...`);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const progress = `[${i + 1}/${chunks.length}]`;

      try {
        // Extract topics
        const topics = extractTopics(chunk.content);

        // Generate embedding
        process.stdout.write(`${progress} Generating embedding... `);
        const embedding = await generateEmbedding(chunk.content);

        // Validate
        if (embedding.length !== EMBEDDING_DIMENSIONS) {
          throw new Error(`Invalid embedding dimensions: ${embedding.length}`);
        }

        // Store in database
        process.stdout.write(`Storing... `);
        await storeChunk(
          number,
          name,
          path.basename(filePath),
          chunk,
          embedding,
          i,
          chunks.length,
          topics
        );

        console.log('✅');
        successCount++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        failCount++;
      }
    }

    console.log(`\n📊 Module ${number} Complete:`);
    console.log(`   ✅ Success: ${successCount}/${chunks.length}`);
    if (failCount > 0) {
      console.log(`   ❌ Failed: ${failCount}`);
    }

    return {
      success: true,
      total: chunks.length,
      successful: successCount,
      failed: failCount
    };

  } catch (error) {
    console.error(`\n❌ Error processing module: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🎓 COURSE EMBEDDINGS GENERATOR - PDF to Database');
  console.log('='.repeat(60));
  console.log('📁 Target Table: course_embeddings');
  console.log('🔧 Safe Mode: Will not overwrite existing data (unless --clear-first)');
  console.log('='.repeat(60) + '\n');

  if (flags.dryRun) {
    console.log('🏃 DRY RUN MODE - No data will be stored\n');
  }

  if (flags.clearFirst && !flags.dryRun) {
    await clearAllEmbeddings();
  }

  // Filter modules if specific module requested
  let modulesToProcess = MODULE_FILES;
  if (flags.module) {
    const moduleNum = parseInt(flags.module);
    modulesToProcess = MODULE_FILES.filter(m => m.number === moduleNum);
    if (modulesToProcess.length === 0) {
      console.error(`❌ Module ${moduleNum} not found`);
      process.exit(1);
    }
  }

  console.log(`📚 Processing ${modulesToProcess.length} module(s)...\n`);

  const results = [];

  for (const moduleInfo of modulesToProcess) {
    const result = await processModule(moduleInfo);
    results.push({ module: moduleInfo.number, ...result });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(60));

  const totalModules = results.length;
  const successfulModules = results.filter(r => r.success).length;
  const totalChunks = results.reduce((sum, r) => sum + (r.successful || 0), 0);
  const totalFailed = results.reduce((sum, r) => sum + (r.failed || 0), 0);

  console.log(`Modules Processed: ${successfulModules}/${totalModules}`);
  if (!flags.dryRun) {
    console.log(`Total Chunks Stored: ${totalChunks}`);
    if (totalFailed > 0) {
      console.log(`Total Failed: ${totalFailed}`);
    }
  }

  console.log('='.repeat(60));

  if (!flags.dryRun && totalChunks > 0) {
    console.log('\n✅ Success! Your course_embeddings table is populated.');
    console.log('💬 Your chatbot can now answer questions about the course content!\n');
  } else if (flags.dryRun) {
    console.log('\n💡 Run without --dry-run to actually generate embeddings and store data\n');
  }
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
