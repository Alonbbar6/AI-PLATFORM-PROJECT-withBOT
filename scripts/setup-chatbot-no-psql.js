#!/usr/bin/env node

/**
 * Chatbot Setup Script (No psql required)
 * 
 * This script sets up the chatbot system by:
 * 1. Creating database tables via Supabase client
 * 2. Generating course embeddings
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('\n' + '='.repeat(60));
console.log(chalk.bold.cyan('🚀 CHATBOT SETUP - NO PSQL REQUIRED'));
console.log('='.repeat(60) + '\n');

// Validate environment variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'OPENAI_API_KEY'
];

console.log('🔍 Checking environment variables...');
const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error(chalk.red('❌ Missing required environment variables:'));
  missingVars.forEach(v => console.error(`   - ${v}`));
  console.error('\n💡 Please update your .env file');
  process.exit(1);
}

console.log(chalk.green('✅ All environment variables present\n'));

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Read migration file
const migrationPath = path.join(__dirname, '../migrations/003_create_chat_tables.sql');
let migrationSQL;

try {
  migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log(chalk.green('✅ Migration file loaded\n'));
} catch (error) {
  console.error(chalk.red('❌ Could not read migration file:'), error.message);
  console.error(chalk.yellow('\n💡 Make sure migrations/003_create_chat_tables.sql exists'));
  process.exit(1);
}

// Split SQL into individual statements
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(chalk.bold('📊 Applying database migration...'));
console.log(chalk.gray(`   Found ${statements.length} SQL statements\n`));

// Execute migration
async function applyMigration() {
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and empty statements
    if (statement.startsWith('--') || statement.trim().length === 0) {
      continue;
    }

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Some errors are expected (e.g., "table already exists")
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist')) {
          console.log(chalk.yellow(`⚠️  Statement ${i + 1}: ${error.message.substring(0, 60)}...`));
        } else {
          console.error(chalk.red(`❌ Statement ${i + 1} failed: ${error.message}`));
          errorCount++;
        }
      } else {
        successCount++;
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error executing statement ${i + 1}:`), error.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(chalk.bold('📊 Migration Summary'));
  console.log('='.repeat(60));
  console.log(`${chalk.green('Successful:')} ${successCount}`);
  console.log(`${chalk.red('Errors:')} ${errorCount}`);
  console.log('='.repeat(60) + '\n');

  if (errorCount > 0) {
    console.log(chalk.yellow('⚠️  Some statements failed, but this might be normal if tables already exist.'));
    console.log(chalk.yellow('   Continuing with setup...\n'));
  }
}

// Alternative: Create tables directly using Supabase client
async function createTablesDirectly() {
  console.log(chalk.bold('📊 Creating database tables directly...\n'));

  const tables = [
    {
      name: 'conversations',
      sql: `
        CREATE TABLE IF NOT EXISTS conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          title TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true,
          metadata JSONB DEFAULT '{}'::jsonb
        );
        CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
        CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
      `
    },
    {
      name: 'messages',
      sql: `
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          sources JSONB DEFAULT '[]'::jsonb,
          embedding vector(1536),
          tokens_used INTEGER,
          response_time_ms INTEGER,
          metadata JSONB DEFAULT '{}'::jsonb
        );
        CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
      `
    },
    {
      name: 'user_sessions',
      sql: `
        CREATE TABLE IF NOT EXISTS user_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL UNIQUE,
          current_conversation_id UUID REFERENCES conversations(id),
          preferences JSONB DEFAULT '{}'::jsonb,
          total_conversations INTEGER DEFAULT 0,
          total_messages INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      `
    },
    {
      name: 'conversation_analytics',
      sql: `
        CREATE TABLE IF NOT EXISTS conversation_analytics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
          total_messages INTEGER DEFAULT 0,
          total_tokens INTEGER DEFAULT 0,
          avg_response_time_ms NUMERIC(10, 2),
          user_satisfaction_score INTEGER CHECK (user_satisfaction_score BETWEEN 1 AND 5),
          topics JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_analytics_conversation_id ON conversation_analytics(conversation_id);
      `
    }
  ];

  for (const table of tables) {
    try {
      console.log(`   Creating ${table.name}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: table.sql });
      
      if (error) {
        if (error.message.includes('already exists')) {
          console.log(chalk.yellow(`   ⚠️  ${table.name} already exists`));
        } else {
          console.error(chalk.red(`   ❌ Failed to create ${table.name}:`), error.message);
        }
      } else {
        console.log(chalk.green(`   ✅ ${table.name} created`));
      }
    } catch (error) {
      console.error(chalk.red(`   ❌ Error creating ${table.name}:`), error.message);
    }
  }

  console.log();
}

// Main execution
async function main() {
  try {
    // Try to create tables directly
    await createTablesDirectly();

    console.log(chalk.bold('🎓 Generating course embeddings...\n'));
    console.log(chalk.gray('   This may take 1-2 minutes...\n'));

    // Import and run course embeddings script
    const { default: generateEmbeddings } = await import('./generate-course-embeddings.js');
    
    console.log('\n' + '='.repeat(60));
    console.log(chalk.bold.green('✅ CHATBOT SETUP COMPLETE!'));
    console.log('='.repeat(60));
    console.log('\n' + chalk.bold('Next steps:'));
    console.log('  1. Start chatbot server: ' + chalk.cyan('npm run chatbot:dev'));
    console.log('  2. Start Next.js app: ' + chalk.cyan('npm run dev'));
    console.log('  3. Test integration: ' + chalk.cyan('npm run test:chatbot'));
    console.log('\n' + chalk.gray('See CHATBOT-QUICKSTART.md for detailed instructions.\n'));

  } catch (error) {
    console.error('\n' + chalk.red('❌ Setup failed:'), error.message);
    console.error('\n' + chalk.yellow('💡 Alternative: Apply migration via Supabase dashboard'));
    console.error(chalk.yellow('   1. Go to https://supabase.com/dashboard'));
    console.error(chalk.yellow('   2. Open SQL Editor'));
    console.error(chalk.yellow('   3. Paste contents of migrations/003_create_chat_tables.sql'));
    console.error(chalk.yellow('   4. Run the query'));
    console.error(chalk.yellow('   5. Then run: npm run generate:course-embeddings\n'));
    process.exit(1);
  }
}

main();
