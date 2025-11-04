#!/usr/bin/env node

/**
 * Generate Course Material Embeddings
 * 
 * This script generates embeddings for course materials to enable
 * the chatbot to understand and explain course content.
 */

import dotenv from 'dotenv';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// COURSE MATERIALS STRUCTURE
// ============================================

const courseMaterials = [
  {
    module: 'Module 1',
    title: 'Introduction to AI',
    topics: [
      {
        topic: 'What is Artificial Intelligence?',
        content: `Artificial Intelligence (AI) is the simulation of human intelligence processes by machines, especially computer systems. These processes include learning (acquiring information and rules for using it), reasoning (using rules to reach approximate or definite conclusions), and self-correction.

Key concepts:
- Machine Learning: Systems that learn from data
- Deep Learning: Neural networks with multiple layers
- Natural Language Processing: Understanding human language
- Computer Vision: Interpreting visual information

Business applications:
- Customer service automation
- Predictive analytics
- Process optimization
- Personalization`
      },
      {
        topic: 'AI for Business Owners',
        content: `AI can transform small businesses by automating repetitive tasks, providing insights from data, and improving customer experiences. 

Practical applications:
1. Customer Service: Chatbots and virtual assistants
2. Marketing: Personalized recommendations and targeting
3. Operations: Inventory management and demand forecasting
4. Sales: Lead scoring and customer insights

Getting started:
- Identify repetitive tasks that could be automated
- Start with low-risk, high-impact use cases
- Use existing AI tools before building custom solutions
- Focus on data quality and collection`
      },
      {
        topic: 'AI Ethics and Responsible Use',
        content: `Responsible AI use is crucial for businesses. Key principles include:

1. Transparency: Be clear about when AI is being used
2. Fairness: Ensure AI doesn't discriminate
3. Privacy: Protect customer data
4. Accountability: Take responsibility for AI decisions
5. Safety: Ensure AI systems are secure

Best practices:
- Regular audits of AI systems
- Diverse training data
- Human oversight of critical decisions
- Clear privacy policies
- Ongoing monitoring and improvement`
      }
    ]
  },
  {
    module: 'Module 2',
    title: 'AI Tools and Technologies',
    topics: [
      {
        topic: 'Popular AI Tools for Business',
        content: `Essential AI tools for small businesses:

1. ChatGPT & GPT-4: Content creation, customer service, brainstorming
2. Midjourney/DALL-E: Image generation for marketing
3. Jasper: AI writing assistant for marketing copy
4. Grammarly: Writing enhancement and grammar checking
5. Zapier: Workflow automation
6. HubSpot: AI-powered CRM and marketing

Choosing the right tool:
- Define your specific need
- Consider budget and scalability
- Check integration capabilities
- Start with free trials
- Evaluate ease of use`
      },
      {
        topic: 'Implementing AI in Your Workflow',
        content: `Step-by-step guide to AI implementation:

Phase 1: Assessment (Week 1-2)
- Identify pain points and opportunities
- Research available solutions
- Calculate potential ROI

Phase 2: Pilot (Week 3-6)
- Start with one use case
- Train team members
- Collect feedback
- Measure results

Phase 3: Scale (Month 2-3)
- Expand to additional use cases
- Optimize processes
- Document best practices
- Train additional staff

Success metrics:
- Time saved
- Cost reduction
- Quality improvement
- Customer satisfaction`
      }
    ]
  },
  {
    module: 'Module 3',
    title: 'Advanced AI Applications',
    topics: [
      {
        topic: 'AI-Powered Analytics',
        content: `Using AI for business intelligence:

Predictive Analytics:
- Sales forecasting
- Customer churn prediction
- Inventory optimization
- Demand planning

Descriptive Analytics:
- Customer segmentation
- Trend analysis
- Performance dashboards
- Anomaly detection

Tools:
- Google Analytics with AI insights
- Tableau with Einstein Analytics
- Power BI with AI capabilities
- Custom solutions with Python/R

Implementation tips:
- Start with clean, organized data
- Define clear KPIs
- Validate predictions regularly
- Combine AI insights with human expertise`
      },
      {
        topic: 'Building Your AI Strategy',
        content: `Creating a comprehensive AI strategy:

1. Vision & Goals
- Define what success looks like
- Align with business objectives
- Set realistic timelines

2. Data Strategy
- Audit current data assets
- Identify data gaps
- Implement data collection systems
- Ensure data quality

3. Technology Stack
- Choose appropriate tools
- Plan for integration
- Consider scalability
- Budget for ongoing costs

4. Team & Skills
- Identify skill gaps
- Provide training
- Consider hiring or outsourcing
- Build AI literacy across organization

5. Governance & Ethics
- Establish AI policies
- Create review processes
- Monitor for bias
- Ensure compliance`
      }
    ]
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    throw error;
  }
}

async function createCourseMaterialsTable() {
  console.log('📋 Creating course_materials table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS course_materials (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        module TEXT NOT NULL,
        title TEXT NOT NULL,
        topic TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding vector(1536),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_course_materials_module ON course_materials(module);
      CREATE INDEX IF NOT EXISTS idx_course_materials_embedding ON course_materials 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `
  });

  if (error) {
    console.log('⚠️  Table might already exist or RPC not available');
  } else {
    console.log('✅ Table created successfully');
  }
}

async function storeCourseContent(module, title, topic, content, embedding, chunkIndex = 0, totalChunks = 1) {
  const { error } = await supabase
    .from('course_embeddings')
    .insert({
      module_number: parseInt(module.replace('Module ', '')),
      module_name: title,
      filename: `${module.replace(' ', '_')}.txt`,
      title: topic,
      content: content,
      embedding: embedding,
      chunk_index: chunkIndex,
      chunk_type: 'topic',
      part_number: chunkIndex + 1,
      total_parts: totalChunks,
      content_type: 'text',
      topics: [topic],
      full_content_length: content.length
    })
    .select();

  if (error) {
    console.error(`❌ Error storing ${topic}:`, error.message);
    return false;
  }

  return true;
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🎓 COURSE MATERIALS EMBEDDING GENERATOR');
  console.log('='.repeat(60) + '\n');

  try {
    // Create table (if needed)
    await createCourseMaterialsTable();

    let totalProcessed = 0;
    let totalSuccess = 0;

    // Process each module
    for (const module of courseMaterials) {
      console.log(`\n📚 Processing ${module.module}: ${module.title}`);

      for (let topicIndex = 0; topicIndex < module.topics.length; topicIndex++) {
        const topicData = module.topics[topicIndex];
        totalProcessed++;

        console.log(`  🔄 Generating embedding for: ${topicData.topic}`);

        try {
          // Generate embedding
          const embedding = await generateEmbedding(topicData.content);

          // Store in database
          const success = await storeCourseContent(
            module.module,
            module.title,
            topicData.topic,
            topicData.content,
            embedding,
            topicIndex,
            module.topics.length
          );
          
          if (success) {
            totalSuccess++;
            console.log(`  ✅ Stored: ${topicData.topic}`);
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`  ❌ Failed: ${topicData.topic}`, error.message);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total topics processed: ${totalProcessed}`);
    console.log(`Successfully stored: ${totalSuccess}`);
    console.log(`Failed: ${totalProcessed - totalSuccess}`);
    console.log('='.repeat(60) + '\n');

    console.log('✅ Course materials embeddings generated successfully!');
    console.log('💡 Your chatbot can now understand and explain course content.\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();
