import chalk from 'chalk';

// ============================================
// API TESTING SCRIPT
// ============================================
// This script tests the Express API independently
// Run: node test-api.js

const API_URL = process.env.API_URL || 'http://localhost:3001';

console.log(chalk.blue.bold('\n🧪 CHATBOT API TEST SUITE\n'));
console.log(chalk.gray('='.repeat(60)));
console.log(chalk.cyan(`Testing API at: ${API_URL}`));
console.log(chalk.gray('='.repeat(60) + '\n'));

// ============================================
// TEST 1: Health Check
// ============================================
async function testHealthCheck() {
  console.log(chalk.yellow('📋 Test 1: Health Check'));
  console.log(chalk.gray('GET /health\n'));

  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();

    if (response.ok && data.status === 'healthy') {
      console.log(chalk.green('✅ PASSED'));
      console.log(chalk.gray('Response:'), JSON.stringify(data, null, 2));
    } else {
      console.log(chalk.red('❌ FAILED'));
      console.log(chalk.gray('Response:'), JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(chalk.red('❌ FAILED - Connection Error'));
    console.log(chalk.red(`Error: ${error.message}`));
    console.log(chalk.yellow('\n💡 Make sure the server is running: npm start'));
  }

  console.log('\n');
}

// ============================================
// TEST 2: Chat Endpoint - Valid Request
// ============================================
async function testChatValid() {
  console.log(chalk.yellow('📋 Test 2: Chat Endpoint - Valid Request'));
  console.log(chalk.gray('POST /api/chat\n'));

  const requestBody = {
    message: 'What is Module 1 about?',
    userId: 'test-user-123'
  };

  console.log(chalk.cyan('Request Body:'));
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('');

  try {
    const startTime = Date.now();
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    if (response.ok && data.success) {
      console.log(chalk.green('✅ PASSED'));
      console.log(chalk.gray(`Response time: ${duration}ms`));
      console.log(chalk.cyan('\nAnswer:'));
      console.log(chalk.white(data.answer));
      console.log(chalk.cyan(`\nSources found: ${data.sources?.length || 0}`));
      if (data.sources && data.sources.length > 0) {
        data.sources.forEach((source, idx) => {
          console.log(chalk.gray(`  ${idx + 1}. ${source.question} (similarity: ${source.similarity?.toFixed(2)})`));
        });
      }
    } else {
      console.log(chalk.red('❌ FAILED'));
      console.log(chalk.gray('Response:'), JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(chalk.red('❌ FAILED - Connection Error'));
    console.log(chalk.red(`Error: ${error.message}`));
  }

  console.log('\n');
}

// ============================================
// TEST 3: Chat Endpoint - Missing Message
// ============================================
async function testChatMissingMessage() {
  console.log(chalk.yellow('📋 Test 3: Chat Endpoint - Missing Message (Should Fail)'));
  console.log(chalk.gray('POST /api/chat\n'));

  const requestBody = {
    userId: 'test-user-123'
    // message is missing
  };

  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (response.status === 400 && !data.success) {
      console.log(chalk.green('✅ PASSED - Correctly rejected invalid request'));
      console.log(chalk.gray('Error message:'), data.error);
    } else {
      console.log(chalk.red('❌ FAILED - Should have rejected request'));
      console.log(chalk.gray('Response:'), JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(chalk.red('❌ FAILED - Connection Error'));
    console.log(chalk.red(`Error: ${error.message}`));
  }

  console.log('\n');
}

// ============================================
// TEST 4: Chat Endpoint - Missing UserId
// ============================================
async function testChatMissingUserId() {
  console.log(chalk.yellow('📋 Test 4: Chat Endpoint - Missing UserId (Should Fail)'));
  console.log(chalk.gray('POST /api/chat\n'));

  const requestBody = {
    message: 'What is AI?'
    // userId is missing
  };

  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (response.status === 400 && !data.success) {
      console.log(chalk.green('✅ PASSED - Correctly rejected invalid request'));
      console.log(chalk.gray('Error message:'), data.error);
    } else {
      console.log(chalk.red('❌ FAILED - Should have rejected request'));
      console.log(chalk.gray('Response:'), JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(chalk.red('❌ FAILED - Connection Error'));
    console.log(chalk.red(`Error: ${error.message}`));
  }

  console.log('\n');
}

// ============================================
// TEST 5: 404 Error
// ============================================
async function test404() {
  console.log(chalk.yellow('📋 Test 5: 404 Error'));
  console.log(chalk.gray('GET /nonexistent\n'));

  try {
    const response = await fetch(`${API_URL}/nonexistent`);
    const data = await response.json();

    if (response.status === 404) {
      console.log(chalk.green('✅ PASSED - Correctly returned 404'));
      console.log(chalk.gray('Response:'), JSON.stringify(data, null, 2));
    } else {
      console.log(chalk.red('❌ FAILED'));
      console.log(chalk.gray('Response:'), JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(chalk.red('❌ FAILED - Connection Error'));
    console.log(chalk.red(`Error: ${error.message}`));
  }

  console.log('\n');
}

// ============================================
// RUN ALL TESTS
// ============================================
async function runAllTests() {
  await testHealthCheck();
  await testChatValid();
  await testChatMissingMessage();
  await testChatMissingUserId();
  await test404();

  console.log(chalk.blue.bold('🎉 Test suite completed!\n'));
}

// Run tests
runAllTests().catch(error => {
  console.error(chalk.red('Fatal error running tests:'), error);
  process.exit(1);
});
