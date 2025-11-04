#!/usr/bin/env node

/**
 * Verify embeddings in the FAQ database
 * 
 * Usage:
 *   node scripts/verify-embeddings.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';

const EXPECTED_DIMENSIONS = 1536;

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_KEY'
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
 * Initialize Supabase client
 */
function initializeSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

/**
 * Get total FAQ count
 */
async function getTotalCount(supabase) {
  const { count, error } = await supabase
    .from('faqs')
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Failed to get total count: ${error.message}`);
  }

  return count;
}

/**
 * Get count of FAQs with embeddings
 */
async function getEmbeddedCount(supabase) {
  const { count, error } = await supabase
    .from('faqs')
    .select('*', { count: 'exact', head: true })
    .not('embedding', 'is', null);

  if (error) {
    throw new Error(`Failed to get embedded count: ${error.message}`);
  }

  return count;
}

/**
 * Get FAQs without embeddings
 */
async function getMissingEmbeddings(supabase) {
  const { data, error } = await supabase
    .from('faqs')
    .select('id, question, category')
    .is('embedding', null);

  if (error) {
    throw new Error(`Failed to get missing embeddings: ${error.message}`);
  }

  return data || [];
}

/**
 * Verify embedding dimensions
 */
async function verifyDimensions(supabase) {
  const { data, error } = await supabase
    .from('faqs')
    .select('id, embedding')
    .not('embedding', 'is', null)
    .limit(10);

  if (error) {
    throw new Error(`Failed to fetch embeddings: ${error.message}`);
  }

  const issues = [];

  for (const faq of data) {
    if (faq.embedding && faq.embedding.length !== EXPECTED_DIMENSIONS) {
      issues.push({
        id: faq.id,
        dimensions: faq.embedding.length,
        expected: EXPECTED_DIMENSIONS
      });
    }
  }

  return issues;
}

/**
 * Test similarity search with a sample query
 */
async function testSimilaritySearch(supabase) {
  try {
    // Get a random FAQ with embedding
    const { data: sampleFaq, error: sampleError } = await supabase
      .from('faqs')
      .select('id, question, embedding')
      .not('embedding', 'is', null)
      .limit(1)
      .single();

    if (sampleError || !sampleFaq) {
      return { success: false, message: 'No FAQs with embeddings found' };
    }

    // Try to find similar FAQs using the match_faqs function
    const { data, error } = await supabase.rpc('match_faqs', {
      query_embedding: sampleFaq.embedding,
      match_threshold: 0.5,
      match_count: 5
    });

    if (error) {
      return { 
        success: false, 
        message: `Similarity search failed: ${error.message}`,
        hint: 'Make sure the match_faqs function exists in your database'
      };
    }

    return {
      success: true,
      sampleQuestion: sampleFaq.question,
      resultsCount: data.length,
      topResult: data[0]
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Generate verification report
 */
function generateReport(stats) {
  console.log(chalk.bold.cyan('\n' + '='.repeat(70)));
  console.log(chalk.bold.cyan('  EMBEDDING VERIFICATION REPORT'));
  console.log(chalk.bold.cyan('='.repeat(70)));

  // Coverage Statistics
  console.log(chalk.bold('\n📊 Coverage Statistics:'));
  console.log(chalk.white(`  Total FAQs: ${stats.total}`));
  console.log(chalk.green(`  With Embeddings: ${stats.embedded}`));
  console.log(chalk.yellow(`  Missing Embeddings: ${stats.missing}`));
  
  const percentage = stats.total > 0 ? ((stats.embedded / stats.total) * 100).toFixed(2) : 0;
  const progressBar = '█'.repeat(Math.floor(percentage / 2)) + '░'.repeat(50 - Math.floor(percentage / 2));
  console.log(chalk.cyan(`  Progress: [${progressBar}] ${percentage}%`));

  // Missing Embeddings
  if (stats.missingFaqs.length > 0) {
    console.log(chalk.bold('\n⚠️  FAQs Missing Embeddings:'));
    stats.missingFaqs.slice(0, 10).forEach(faq => {
      const preview = faq.question.substring(0, 60);
      console.log(chalk.yellow(`  • [ID: ${faq.id}] [${faq.category}] "${preview}..."`));
    });
    
    if (stats.missingFaqs.length > 10) {
      console.log(chalk.yellow(`  ... and ${stats.missingFaqs.length - 10} more`));
    }
  } else {
    console.log(chalk.bold.green('\n✓ All FAQs have embeddings!'));
  }

  // Dimension Verification
  console.log(chalk.bold('\n🔍 Dimension Verification:'));
  if (stats.dimensionIssues.length === 0) {
    console.log(chalk.green(`  ✓ All embeddings have correct dimensions (${EXPECTED_DIMENSIONS})`));
  } else {
    console.log(chalk.red(`  ✗ Found ${stats.dimensionIssues.length} embeddings with incorrect dimensions:`));
    stats.dimensionIssues.forEach(issue => {
      console.log(chalk.red(`    • FAQ ${issue.id}: ${issue.dimensions} dimensions (expected ${issue.expected})`));
    });
  }

  // Similarity Search Test
  console.log(chalk.bold('\n🔎 Similarity Search Test:'));
  if (stats.searchTest.success) {
    console.log(chalk.green('  ✓ Similarity search is working'));
    console.log(chalk.white(`  Sample Query: "${stats.searchTest.sampleQuestion.substring(0, 60)}..."`));
    console.log(chalk.white(`  Results Found: ${stats.searchTest.resultsCount}`));
    if (stats.searchTest.topResult) {
      console.log(chalk.white(`  Top Match: "${stats.searchTest.topResult.question.substring(0, 60)}..."`));
      console.log(chalk.white(`  Similarity: ${(stats.searchTest.topResult.similarity * 100).toFixed(2)}%`));
    }
  } else {
    console.log(chalk.red('  ✗ Similarity search failed'));
    console.log(chalk.red(`  Error: ${stats.searchTest.message}`));
    if (stats.searchTest.hint) {
      console.log(chalk.yellow(`  Hint: ${stats.searchTest.hint}`));
    }
  }

  // Recommendations
  console.log(chalk.bold('\n💡 Recommendations:'));
  if (stats.missing > 0) {
    console.log(chalk.yellow('  • Run: npm run generate:embeddings'));
  }
  if (stats.dimensionIssues.length > 0) {
    console.log(chalk.yellow('  • Regenerate embeddings with incorrect dimensions using --force flag'));
  }
  if (!stats.searchTest.success) {
    console.log(chalk.yellow('  • Verify that the match_faqs function exists in your database'));
    console.log(chalk.yellow('  • Run the migration: migrations/001_create_faqs_table.sql'));
  }
  if (stats.missing === 0 && stats.dimensionIssues.length === 0 && stats.searchTest.success) {
    console.log(chalk.green('  ✓ Everything looks good! Your embedding system is ready to use.'));
  }

  console.log(chalk.bold.cyan('\n' + '='.repeat(70) + '\n'));
}

/**
 * Main execution function
 */
async function main() {
  console.log(chalk.bold.cyan('\n🔍 Verifying FAQ Embeddings...\n'));

  try {
    // Validate environment
    validateEnvironment();
    console.log(chalk.green('✓ Environment variables validated'));

    // Initialize Supabase
    const supabase = initializeSupabase();
    console.log(chalk.green('✓ Supabase client initialized'));

    // Gather statistics
    console.log(chalk.cyan('\n📊 Gathering statistics...\n'));

    const total = await getTotalCount(supabase);
    const embedded = await getEmbeddedCount(supabase);
    const missing = total - embedded;
    const missingFaqs = await getMissingEmbeddings(supabase);
    const dimensionIssues = await verifyDimensions(supabase);
    const searchTest = await testSimilaritySearch(supabase);

    const stats = {
      total,
      embedded,
      missing,
      missingFaqs,
      dimensionIssues,
      searchTest
    };

    // Generate and display report
    generateReport(stats);

  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    process.exit(1);
  }
}

// Run the script
main();
