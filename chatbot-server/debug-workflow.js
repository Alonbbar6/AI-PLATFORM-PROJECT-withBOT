import chalk from 'chalk';

// ============================================
// N8N WORKFLOW DEBUGGING SCRIPT
// ============================================
// This script helps diagnose common n8n issues
// Run: node debug-workflow.js

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook';
const API_URL = process.env.API_URL || 'http://localhost:3001';

console.log(chalk.blue.bold('\n🔍 N8N WORKFLOW DEBUGGER\n'));
console.log(chalk.gray('='.repeat(60)));

// ============================================
// CHECK 1: API Server Status
// ============================================
async function checkAPIServer() {
  console.log(chalk.yellow('\n📋 Check 1: API Server Status'));
  console.log(chalk.gray(`Checking: ${API_URL}/health\n`));

  try {
    const response = await fetch(`${API_URL}/health`, {
      signal: AbortSignal.timeout(5000)
    });
    const data = await response.json();

    if (response.ok && data.status === 'healthy') {
      console.log(chalk.green('✅ API Server is running'));
      console.log(chalk.gray(`   Status: ${data.status}`));
      console.log(chalk.gray(`   Service: ${data.service}`));
      return true;
    } else {
      console.log(chalk.red('❌ API Server returned unexpected response'));
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
      return false;
    }
  } catch (error) {
    console.log(chalk.red('❌ Cannot connect to API Server'));
    console.log(chalk.red(`   Error: ${error.message}`));
    console.log(chalk.yellow('\n💡 Solution:'));
    console.log(chalk.white('   1. Make sure the server is running: npm start'));
    console.log(chalk.white('   2. Check if port 3001 is available'));
    console.log(chalk.white('   3. Verify .env configuration'));
    return false;
  }
}

// ============================================
// CHECK 2: n8n Webhook Accessibility
// ============================================
async function checkN8NWebhook() {
  console.log(chalk.yellow('\n📋 Check 2: n8n Webhook Accessibility'));
  console.log(chalk.gray(`Checking: ${N8N_WEBHOOK_URL}\n`));

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Debug test',
        userId: 'debug-user'
      }),
      signal: AbortSignal.timeout(10000)
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (response.status === 404) {
      console.log(chalk.red('❌ Webhook not registered'));
      console.log(chalk.gray(`   HTTP Status: ${response.status}`));
      console.log(chalk.gray(`   Message: ${data.message || 'Not found'}`));
      console.log(chalk.yellow('\n💡 Solution:'));
      console.log(chalk.white('   1. Open your n8n workflow'));
      console.log(chalk.white('   2. Click "Execute Workflow" button'));
      console.log(chalk.white('   3. Try again within 2 minutes'));
      console.log(chalk.white('   4. Or activate the workflow for production'));
      return false;
    } else if (response.ok) {
      console.log(chalk.green('✅ Webhook is accessible'));
      console.log(chalk.gray(`   HTTP Status: ${response.status}`));
      if (data.success !== undefined) {
        console.log(chalk.gray(`   Response: ${JSON.stringify(data, null, 2)}`));
      }
      return true;
    } else {
      console.log(chalk.yellow('⚠️  Webhook returned non-200 status'));
      console.log(chalk.gray(`   HTTP Status: ${response.status}`));
      console.log(chalk.gray(`   Response: ${JSON.stringify(data, null, 2)}`));
      return false;
    }
  } catch (error) {
    console.log(chalk.red('❌ Cannot connect to n8n webhook'));
    console.log(chalk.red(`   Error: ${error.message}`));
    console.log(chalk.yellow('\n💡 Solution:'));
    console.log(chalk.white('   1. Check your internet connection'));
    console.log(chalk.white('   2. Verify the webhook URL is correct'));
    console.log(chalk.white('   3. Check n8n cloud status'));
    return false;
  }
}

// ============================================
// CHECK 3: Environment Variables
// ============================================
function checkEnvironmentVariables() {
  console.log(chalk.yellow('\n📋 Check 3: Environment Variables'));
  console.log(chalk.gray('Checking required variables...\n'));

  const requiredVars = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  let allPresent = true;

  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(chalk.green(`✅ ${varName}`));
      const value = process.env[varName];
      const masked = value.substring(0, 10) + '...' + value.substring(value.length - 4);
      console.log(chalk.gray(`   Value: ${masked}`));
    } else {
      console.log(chalk.red(`❌ ${varName} - NOT SET`));
      allPresent = false;
    }
  });

  if (!allPresent) {
    console.log(chalk.yellow('\n💡 Solution:'));
    console.log(chalk.white('   1. Copy .env.example to .env'));
    console.log(chalk.white('   2. Fill in all required values'));
    console.log(chalk.white('   3. Restart the server'));
  }

  return allPresent;
}

// ============================================
// CHECK 4: Network Connectivity
// ============================================
async function checkNetworkConnectivity() {
  console.log(chalk.yellow('\n📋 Check 4: Network Connectivity'));
  console.log(chalk.gray('Testing external connections...\n'));

  const endpoints = [
    { name: 'OpenAI API', url: 'https://api.openai.com' },
    { name: 'Supabase', url: process.env.NEXT_PUBLIC_SUPABASE_URL },
    { name: 'n8n Cloud', url: 'https://aiforepic.app.n8n.cloud' }
  ];

  let allReachable = true;

  for (const endpoint of endpoints) {
    if (!endpoint.url) {
      console.log(chalk.yellow(`⚠️  ${endpoint.name} - URL not configured`));
      continue;
    }

    try {
      const response = await fetch(endpoint.url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      console.log(chalk.green(`✅ ${endpoint.name} - Reachable`));
    } catch (error) {
      console.log(chalk.red(`❌ ${endpoint.name} - Not reachable`));
      console.log(chalk.gray(`   Error: ${error.message}`));
      allReachable = false;
    }
  }

  if (!allReachable) {
    console.log(chalk.yellow('\n💡 Solution:'));
    console.log(chalk.white('   1. Check your internet connection'));
    console.log(chalk.white('   2. Verify firewall settings'));
    console.log(chalk.white('   3. Check if services are down'));
  }

  return allReachable;
}

// ============================================
// CHECK 5: Supabase Function
// ============================================
async function checkSupabaseFunction() {
  console.log(chalk.yellow('\n📋 Check 5: Supabase match_faqs Function'));
  console.log(chalk.gray('Testing database function...\n'));

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(chalk.yellow('⚠️  Skipping - Supabase credentials not configured'));
    return false;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test with a dummy embedding
    const dummyEmbedding = new Array(1536).fill(0);
    
    const { data, error } = await supabase.rpc('match_faqs', {
      query_embedding: dummyEmbedding,
      match_count: 1,
      match_threshold: 0.5
    });

    if (error) {
      console.log(chalk.red('❌ Supabase function error'));
      console.log(chalk.gray(`   Error: ${error.message}`));
      console.log(chalk.yellow('\n💡 Solution:'));
      console.log(chalk.white('   1. Run database migrations'));
      console.log(chalk.white('   2. Verify match_faqs function exists'));
      console.log(chalk.white('   3. Check function permissions'));
      return false;
    }

    console.log(chalk.green('✅ Supabase function is working'));
    console.log(chalk.gray(`   Results returned: ${data?.length || 0}`));
    return true;
  } catch (error) {
    console.log(chalk.red('❌ Failed to test Supabase function'));
    console.log(chalk.gray(`   Error: ${error.message}`));
    return false;
  }
}

// ============================================
// GENERATE REPORT
// ============================================
async function generateReport() {
  console.log(chalk.gray('='.repeat(60)));
  
  const results = {
    apiServer: await checkAPIServer(),
    n8nWebhook: await checkN8NWebhook(),
    envVars: checkEnvironmentVariables(),
    network: await checkNetworkConnectivity(),
    supabase: await checkSupabaseFunction()
  };

  console.log(chalk.blue.bold('\n📊 DIAGNOSTIC SUMMARY\n'));
  console.log(chalk.gray('='.repeat(60)));

  const passed = Object.values(results).filter(v => v === true).length;
  const total = Object.values(results).length;

  console.log(chalk.cyan(`\nChecks Passed: ${passed}/${total}\n`));

  Object.entries(results).forEach(([key, value]) => {
    const label = key.replace(/([A-Z])/g, ' $1').trim();
    const status = value ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
    console.log(`${status} - ${label}`);
  });

  console.log(chalk.gray('\n' + '='.repeat(60)));

  if (passed === total) {
    console.log(chalk.green.bold('\n🎉 All checks passed! Your setup looks good.\n'));
  } else {
    console.log(chalk.yellow.bold('\n⚠️  Some checks failed. Review the solutions above.\n'));
  }

  console.log(chalk.cyan('📝 NEXT STEPS:'));
  console.log(chalk.white('   1. Fix any failed checks'));
  console.log(chalk.white('   2. Run this script again to verify'));
  console.log(chalk.white('   3. Test the full workflow with test-api.js'));
  console.log(chalk.white('   4. Test n8n webhook with test-n8n-webhook.sh\n'));
}

// Run diagnostics
generateReport().catch(error => {
  console.error(chalk.red('Fatal error running diagnostics:'), error);
  process.exit(1);
});
