#!/usr/bin/env node

/**
 * API Key Verification Script
 * 
 * This script tests your API keys to ensure they're valid
 */

import dotenv from 'dotenv';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';

dotenv.config();

console.log('\n' + '='.repeat(60));
console.log(chalk.bold.cyan('🔑 API KEY VERIFICATION'));
console.log('='.repeat(60) + '\n');

const results = {
  passed: 0,
  failed: 0
};

// Check environment variables are set
console.log(chalk.bold('1. Checking Environment Variables\n'));

const envVars = {
  'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'SUPABASE_SERVICE_KEY': process.env.SUPABASE_SERVICE_KEY
};

for (const [key, value] of Object.entries(envVars)) {
  if (!value) {
    console.log(`❌ ${chalk.red(key)}: Not set`);
    results.failed++;
  } else if (value.includes('your-') || value.includes('sk-your-')) {
    console.log(`❌ ${chalk.red(key)}: Still has placeholder value`);
    console.log(`   ${chalk.gray('Current value:')} ${value.substring(0, 30)}...`);
    results.failed++;
  } else {
    console.log(`✅ ${chalk.green(key)}: Set`);
    console.log(`   ${chalk.gray('Value:')} ${value.substring(0, 20)}...${value.substring(value.length - 10)}`);
    results.passed++;
  }
}

console.log('\n' + chalk.bold('2. Testing API Keys\n'));

// Test OpenAI API Key
async function testOpenAI() {
  try {
    console.log('🔄 Testing OpenAI API key...');
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not set');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Try to list models (lightweight test)
    const models = await openai.models.list();
    
    console.log(`✅ ${chalk.green('OpenAI API key is VALID')}`);
    console.log(`   ${chalk.gray('Available models:')} ${models.data.length} models found`);
    results.passed++;
    return true;
  } catch (error) {
    console.log(`❌ ${chalk.red('OpenAI API key is INVALID')}`);
    console.log(`   ${chalk.gray('Error:')} ${error.message}`);
    
    if (error.message.includes('Incorrect API key')) {
      console.log(`   ${chalk.yellow('Fix:')} Get a new API key from https://platform.openai.com/api-keys`);
    } else if (error.message.includes('Missing credentials')) {
      console.log(`   ${chalk.yellow('Fix:')} Set OPENAI_API_KEY in your .env file`);
    }
    
    results.failed++;
    return false;
  }
}

// Test Supabase API Key
async function testSupabase() {
  try {
    console.log('\n🔄 Testing Supabase API keys...');
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL not set');
    }
    
    if (!process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('SUPABASE_SERVICE_KEY not set');
    }

    // Debug: Show key details
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    console.log(`   ${chalk.gray('Key length:')} ${serviceKey.length} characters`);
    console.log(`   ${chalk.gray('Key starts with:')} ${serviceKey.substring(0, 10)}...`);
    console.log(`   ${chalk.gray('Key ends with:')} ...${serviceKey.substring(serviceKey.length - 10)}`);
    
    // Decode JWT to check project ref
    try {
      const parts = serviceKey.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log(`   ${chalk.gray('JWT project ref:')} ${payload.ref || 'N/A'}`);
        console.log(`   ${chalk.gray('JWT role:')} ${payload.role || 'N/A'}`);
        
        // Check if project ref matches
        if (payload.ref && payload.ref !== 'vwmkyxamkhgpvmlpkzbr') {
          console.log(`   ${chalk.yellow('⚠️  WARNING:')} Key is for project "${payload.ref}" but URL is for "vwmkyxamkhgpvmlpkzbr"`);
          console.log(`   ${chalk.yellow('This is likely the problem! You need the key for project "vwmkyxamkhgpvmlpkzbr"')}`);
        }
        
        if (payload.role !== 'service_role') {
          console.log(`   ${chalk.yellow('⚠️  WARNING:')} This is a "${payload.role}" key, not a "service_role" key`);
        }
      }
    } catch (e) {
      console.log(`   ${chalk.yellow('⚠️  Could not decode JWT')}`);
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Try to query a table (any table)
    const { data, error } = await supabase
      .from('faqs')
      .select('count')
      .limit(1);

    if (error) {
      // Check if it's an auth error or just table doesn't exist
      if (error.message.includes('JWT') || error.message.includes('Invalid API key')) {
        throw new Error('Invalid Supabase service key');
      }
      // Table might not exist, but connection works
      console.log(`✅ ${chalk.green('Supabase connection is VALID')}`);
      console.log(`   ${chalk.gray('Note:')} Some tables might not exist yet (this is OK)`);
    } else {
      console.log(`✅ ${chalk.green('Supabase API keys are VALID')}`);
      console.log(`   ${chalk.gray('Connection:')} Successfully connected to database`);
    }
    
    results.passed++;
    return true;
  } catch (error) {
    console.log(`❌ ${chalk.red('Supabase API keys are INVALID')}`);
    console.log(`   ${chalk.gray('Error:')} ${error.message}`);
    
    if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
      console.log(`   ${chalk.yellow('Fix:')} Get your service_role key from:`);
      console.log(`   ${chalk.cyan('https://supabase.com/dashboard/project/vwmkyxamkhgpvmlpkzbr/settings/api')}`);
      console.log(`   ${chalk.yellow('Look for:')} "service_role" key (NOT "anon" key)`);
    }
    
    results.failed++;
    return false;
  }
}

// Test Supabase URL format
function testSupabaseURL() {
  console.log('\n🔄 Checking Supabase URL format...');
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!url) {
    console.log(`❌ ${chalk.red('Supabase URL not set')}`);
    results.failed++;
    return false;
  }
  
  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    console.log(`❌ ${chalk.red('Supabase URL format is incorrect')}`);
    console.log(`   ${chalk.gray('Current:')} ${url}`);
    console.log(`   ${chalk.yellow('Expected format:')} https://YOUR-PROJECT.supabase.co`);
    results.failed++;
    return false;
  }
  
  console.log(`✅ ${chalk.green('Supabase URL format is correct')}`);
  console.log(`   ${chalk.gray('URL:')} ${url}`);
  results.passed++;
  return true;
}

// Main execution
async function main() {
  testSupabaseURL();
  await testOpenAI();
  await testSupabase();
  
  console.log('\n' + '='.repeat(60));
  console.log(chalk.bold('📊 VERIFICATION SUMMARY'));
  console.log('='.repeat(60));
  console.log(`${chalk.green('Passed:')} ${results.passed}`);
  console.log(`${chalk.red('Failed:')} ${results.failed}`);
  console.log('='.repeat(60));
  
  if (results.failed === 0) {
    console.log('\n' + chalk.green.bold('✅ ALL API KEYS ARE VALID!'));
    console.log(chalk.green('You can now run: npm run setup:chatbot\n'));
    process.exit(0);
  } else {
    console.log('\n' + chalk.red.bold('❌ SOME API KEYS ARE INVALID'));
    console.log(chalk.yellow('\nHow to fix:\n'));
    console.log(chalk.bold('1. OpenAI API Key:'));
    console.log('   • Go to: https://platform.openai.com/api-keys');
    console.log('   • Create a new API key');
    console.log('   • Copy it to your .env file as OPENAI_API_KEY=sk-...\n');
    
    console.log(chalk.bold('2. Supabase Service Key:'));
    console.log('   • Go to: https://supabase.com/dashboard/project/vwmkyxamkhgpvmlpkzbr/settings/api');
    console.log('   • Scroll to "Project API keys"');
    console.log('   • Copy the "service_role" key (NOT the "anon" key)');
    console.log('   • Paste it in your .env file as SUPABASE_SERVICE_KEY=eyJ...\n');
    
    console.log(chalk.bold('3. After updating .env:'));
    console.log('   • Run this script again: npm run verify:api-keys');
    console.log('   • Once all pass, run: npm run setup:chatbot\n');
    
    process.exit(1);
  }
}

main().catch(error => {
  console.error(chalk.red('\n💥 Fatal error:'), error);
  process.exit(1);
});
