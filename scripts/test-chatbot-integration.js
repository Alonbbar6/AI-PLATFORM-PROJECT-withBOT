#!/usr/bin/env node

/**
 * Comprehensive Chatbot Integration Test
 * 
 * Tests all components of the chatbot system:
 * - Database connectivity
 * - API server
 * - n8n webhook
 * - End-to-end flow
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';

dotenv.config();

// Test configuration
const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  n8nWebhook: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_KEY,
  testUserId: 'test-user-' + Date.now()
};

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper functions
function logTest(name, status, message = '') {
  const icon = status === 'pass' ? '✅' : '❌';
  const color = status === 'pass' ? chalk.green : chalk.red;
  console.log(`${icon} ${color(name)}`);
  if (message) console.log(`   ${chalk.gray(message)}`);
  
  results.tests.push({ name, status, message });
  if (status === 'pass') results.passed++;
  else results.failed++;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test functions
async function testDatabaseConnection() {
  console.log('\n' + chalk.bold('1. Testing Database Connection...'));
  
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    logTest('Database connection', 'pass', 'Connected to Supabase');
  } catch (error) {
    logTest('Database connection', 'fail', error.message);
  }
}

async function testDatabaseTables() {
  console.log('\n' + chalk.bold('2. Testing Database Tables...'));
  
  const tables = ['conversations', 'messages', 'user_sessions', 'conversation_analytics'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) throw error;
      logTest(`Table: ${table}`, 'pass', 'Table exists and accessible');
    } catch (error) {
      logTest(`Table: ${table}`, 'fail', error.message);
    }
  }
}

async function testCourseMaterialsEmbeddings() {
  console.log('\n' + chalk.bold('3. Testing Course Materials Embeddings...'));
  
  try {
    const { data, error } = await supabase
      .from('course_materials')
      .select('count')
      .not('embedding', 'is', null);
    
    if (error) throw error;
    
    const count = data?.[0]?.count || 0;
    if (count > 0) {
      logTest('Course embeddings', 'pass', `${count} course materials with embeddings`);
    } else {
      logTest('Course embeddings', 'fail', 'No course embeddings found. Run: npm run generate:course-embeddings');
    }
  } catch (error) {
    logTest('Course embeddings', 'fail', error.message);
  }
}

async function testAPIHealth() {
  console.log('\n' + chalk.bold('4. Testing API Server...'));
  
  try {
    const response = await fetch(`${config.apiUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    logTest('API health check', 'pass', `Server version: ${data.version || 'unknown'}`);
  } catch (error) {
    logTest('API health check', 'fail', `${error.message}. Is the server running? (npm run chatbot:dev)`);
  }
}

async function testAPIChatEndpoint() {
  console.log('\n' + chalk.bold('5. Testing API Chat Endpoint...'));
  
  try {
    const response = await fetch(`${config.apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is Module 1 about?',
        userId: config.testUserId
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.answer) {
      logTest('API chat endpoint', 'pass', `Response received (${data.responseTime})`);
      
      // Verify conversation was created
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', config.testUserId);
      
      if (!error && conversations?.length > 0) {
        logTest('Conversation creation', 'pass', `Conversation ID: ${conversations[0].id.substring(0, 8)}...`);
      } else {
        logTest('Conversation creation', 'fail', 'Conversation not saved to database');
      }
    } else {
      logTest('API chat endpoint', 'fail', 'Invalid response format');
    }
  } catch (error) {
    logTest('API chat endpoint', 'fail', error.message);
  }
}

async function testN8NWebhook() {
  console.log('\n' + chalk.bold('6. Testing n8n Webhook...'));
  
  try {
    const response = await fetch(config.n8nWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello from integration test!',
        userId: config.testUserId
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success || data.answer) {
      logTest('n8n webhook', 'pass', 'Webhook responding correctly');
    } else {
      logTest('n8n webhook', 'fail', 'Unexpected response format');
    }
  } catch (error) {
    logTest('n8n webhook', 'fail', `${error.message}. Is the workflow activated?`);
  }
}

async function testConversationHistory() {
  console.log('\n' + chalk.bold('7. Testing Conversation History...'));
  
  try {
    // Get conversation for test user
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', config.testUserId)
      .limit(1);
    
    if (convError) throw convError;
    
    if (conversations && conversations.length > 0) {
      const conversationId = conversations[0].id;
      
      // Get messages for this conversation
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId);
      
      if (msgError) throw msgError;
      
      if (messages && messages.length > 0) {
        logTest('Conversation history', 'pass', `${messages.length} messages stored`);
      } else {
        logTest('Conversation history', 'fail', 'No messages found in conversation');
      }
    } else {
      logTest('Conversation history', 'fail', 'No conversation found for test user');
    }
  } catch (error) {
    logTest('Conversation history', 'fail', error.message);
  }
}

async function testRAGFunctionality() {
  console.log('\n' + chalk.bold('8. Testing RAG (Retrieval Augmented Generation)...'));
  
  try {
    const response = await fetch(`${config.apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tell me about AI tools for business',
        userId: config.testUserId
      })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    if (data.sources && data.sources.length > 0) {
      logTest('RAG functionality', 'pass', `${data.sources.length} sources retrieved`);
      
      // Check if sources have similarity scores
      const hasScores = data.sources.every(s => typeof s.similarity === 'number');
      if (hasScores) {
        logTest('Source similarity scores', 'pass', 'All sources have similarity scores');
      } else {
        logTest('Source similarity scores', 'fail', 'Missing similarity scores');
      }
    } else {
      logTest('RAG functionality', 'fail', 'No sources returned');
    }
  } catch (error) {
    logTest('RAG functionality', 'fail', error.message);
  }
}

async function cleanup() {
  console.log('\n' + chalk.bold('9. Cleaning Up Test Data...'));
  
  try {
    // Delete test conversations
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('user_id', config.testUserId);
    
    if (error) throw error;
    logTest('Cleanup', 'pass', 'Test data removed');
  } catch (error) {
    logTest('Cleanup', 'fail', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log(chalk.bold.cyan('🧪 CHATBOT INTEGRATION TEST SUITE'));
  console.log('='.repeat(60));
  
  await testDatabaseConnection();
  await sleep(500);
  
  await testDatabaseTables();
  await sleep(500);
  
  await testCourseMaterialsEmbeddings();
  await sleep(500);
  
  await testAPIHealth();
  await sleep(500);
  
  await testAPIChatEndpoint();
  await sleep(1000);
  
  await testN8NWebhook();
  await sleep(1000);
  
  await testConversationHistory();
  await sleep(500);
  
  await testRAGFunctionality();
  await sleep(1000);
  
  await cleanup();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log(chalk.bold('📊 TEST SUMMARY'));
  console.log('='.repeat(60));
  console.log(`${chalk.green('Passed:')} ${results.passed}`);
  console.log(`${chalk.red('Failed:')} ${results.failed}`);
  console.log(`${chalk.blue('Total:')} ${results.passed + results.failed}`);
  console.log('='.repeat(60));
  
  if (results.failed === 0) {
    console.log('\n' + chalk.green.bold('✅ ALL TESTS PASSED!'));
    console.log(chalk.green('Your chatbot integration is working correctly.\n'));
    process.exit(0);
  } else {
    console.log('\n' + chalk.red.bold('❌ SOME TESTS FAILED'));
    console.log(chalk.yellow('Please review the errors above and fix the issues.\n'));
    
    // Print helpful tips
    console.log(chalk.bold('Common fixes:'));
    console.log('  • Database: Run migration: psql $DATABASE_URL -f migrations/003_create_chat_tables.sql');
    console.log('  • Embeddings: Run: npm run generate:course-embeddings');
    console.log('  • API Server: Start with: npm run chatbot:dev');
    console.log('  • n8n: Activate workflow in n8n dashboard\n');
    
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error(chalk.red('\n💥 Fatal error:'), error);
  process.exit(1);
});
