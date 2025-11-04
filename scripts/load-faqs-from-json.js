#!/usr/bin/env node

/**
 * Load FAQs from JSON file into Supabase database
 *
 * Usage:
 *   node scripts/load-faqs-from-json.js
 *   node scripts/load-faqs-from-json.js --clear (deletes existing FAQs first)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse arguments
const shouldClear = process.argv.includes('--clear');

console.log(chalk.bold.cyan('\n📥 Loading FAQs from JSON to Database\n'));

// Validate environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(chalk.red(`❌ Missing environment variables`));
  console.error(chalk.red(`   NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL ? '✓' : '✗'}`));
  console.error(chalk.red(`   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_KEY ? '✓' : '✗'}`));
  process.exit(1);
}

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log(chalk.green('✓ Supabase client initialized'));

// Read FAQs from JSON file
const faqsPath = path.join(__dirname, '../data/faqs.json');

if (!fs.existsSync(faqsPath)) {
  console.error(chalk.red(`❌ FAQs file not found at: ${faqsPath}`));
  process.exit(1);
}

const faqsData = JSON.parse(fs.readFileSync(faqsPath, 'utf8'));
console.log(chalk.green(`✓ Loaded ${faqsData.length} FAQs from JSON file`));

// Clear existing FAQs if requested
if (shouldClear) {
  console.log(chalk.yellow('\n⚠️  Clearing existing FAQs...'));
  const { error: deleteError } = await supabase
    .from('faqs')
    .delete()
    .neq('id', 0); // Delete all

  if (deleteError) {
    console.error(chalk.red('❌ Error clearing FAQs:', deleteError.message));
  } else {
    console.log(chalk.green('✓ Existing FAQs cleared'));
  }
}

// Insert FAQs
console.log(chalk.cyan('\n📝 Inserting FAQs into database...\n'));

let successCount = 0;
let errorCount = 0;

for (let i = 0; i < faqsData.length; i++) {
  const faq = faqsData[i];

  const { error } = await supabase
    .from('faqs')
    .insert({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      keywords: faq.keywords || []
    });

  if (error) {
    errorCount++;
    console.log(chalk.red(`✗ [${i + 1}/${faqsData.length}] Failed: ${faq.question.substring(0, 50)}...`));
    console.log(chalk.red(`  Error: ${error.message}`));
  } else {
    successCount++;
    console.log(chalk.green(`✓ [${i + 1}/${faqsData.length}] ${faq.question.substring(0, 60)}...`));
  }

  // Small delay to avoid rate limiting
  if (i < faqsData.length - 1) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

// Summary
console.log(chalk.bold('\n' + '='.repeat(60)));
console.log(chalk.bold.cyan('  SUMMARY'));
console.log(chalk.bold('='.repeat(60)));
console.log(chalk.green(`  ✓ Successfully inserted: ${successCount}`));
console.log(chalk.red(`  ✗ Failed: ${errorCount}`));
console.log(chalk.white(`  Total: ${faqsData.length}`));
console.log(chalk.bold('='.repeat(60) + '\n'));

if (successCount > 0) {
  console.log(chalk.cyan('💡 Next steps:'));
  console.log(chalk.white('  1. Verify FAQs: npm run verify:embeddings'));
  console.log(chalk.white('  2. Generate embeddings: npm run generate:embeddings\n'));
}
