-- ============================================
-- CHATBOT CONVERSATION MANAGEMENT SCHEMA
-- ============================================
-- This migration creates tables for managing chatbot conversations,
-- messages, and user sessions with full history tracking.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CONVERSATIONS TABLE
-- ============================================
-- Stores conversation sessions between users and the chatbot
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    title TEXT, -- Auto-generated from first message
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store additional context
    
    -- Indexes for performance
    CONSTRAINT conversations_user_id_check CHECK (char_length(user_id) > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_is_active ON conversations(is_active) WHERE is_active = true;

-- ============================================
-- 2. MESSAGES TABLE
-- ============================================
-- Stores individual messages within conversations
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- AI-specific fields
    sources JSONB DEFAULT '[]'::jsonb, -- FAQ sources used for this response
    embedding vector(1536), -- Store message embedding for semantic search
    tokens_used INTEGER, -- Track token usage
    response_time_ms INTEGER, -- Track performance
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT messages_content_check CHECK (char_length(content) > 0),
    CONSTRAINT messages_role_check CHECK (role IN ('user', 'assistant', 'system'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);

-- Vector similarity search index for messages
CREATE INDEX IF NOT EXISTS idx_messages_embedding ON messages 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================
-- 3. USER SESSIONS TABLE
-- ============================================
-- Track user sessions and preferences
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL UNIQUE,
    current_conversation_id UUID REFERENCES conversations(id),
    preferences JSONB DEFAULT '{}'::jsonb,
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT user_sessions_user_id_check CHECK (char_length(user_id) > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON user_sessions(last_active_at DESC);

-- ============================================
-- 4. CONVERSATION ANALYTICS TABLE
-- ============================================
-- Track conversation metrics and analytics
CREATE TABLE IF NOT EXISTS conversation_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    total_messages INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    avg_response_time_ms NUMERIC(10, 2),
    user_satisfaction_score INTEGER CHECK (user_satisfaction_score BETWEEN 1 AND 5),
    topics JSONB DEFAULT '[]'::jsonb, -- Detected topics/categories
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analytics_conversation_id ON conversation_analytics(conversation_id);

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update conversation timestamp when message is added
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
CREATE TRIGGER trigger_update_conversation_timestamp
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Function to get conversation history with context
CREATE OR REPLACE FUNCTION get_conversation_history(
    p_conversation_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    role TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    sources JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.role,
        m.content,
        m.created_at,
        m.sources
    FROM messages m
    WHERE m.conversation_id = p_conversation_id
    ORDER BY m.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to search messages semantically
CREATE OR REPLACE FUNCTION search_conversation_messages(
    query_embedding vector(1536),
    p_user_id TEXT DEFAULT NULL,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    conversation_id UUID,
    content TEXT,
    similarity FLOAT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.conversation_id,
        m.content,
        1 - (m.embedding <=> query_embedding) AS similarity,
        m.created_at
    FROM messages m
    INNER JOIN conversations c ON m.conversation_id = c.id
    WHERE 
        m.embedding IS NOT NULL
        AND (p_user_id IS NULL OR c.user_id = p_user_id)
        AND 1 - (m.embedding <=> query_embedding) > match_threshold
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create or get active conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_user_id TEXT
)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Try to get active conversation
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE user_id = p_user_id 
    AND is_active = true
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- If no active conversation, create one
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (user_id, title)
        VALUES (p_user_id, 'New Conversation')
        RETURNING id INTO v_conversation_id;
        
        -- Update user session
        INSERT INTO user_sessions (user_id, current_conversation_id, total_conversations)
        VALUES (p_user_id, v_conversation_id, 1)
        ON CONFLICT (user_id) DO UPDATE
        SET 
            current_conversation_id = v_conversation_id,
            total_conversations = user_sessions.total_conversations + 1,
            last_active_at = NOW();
    END IF;
    
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS for multi-tenant security

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own conversations
CREATE POLICY conversations_user_policy ON conversations
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true));

-- Policy: Users can only see messages from their conversations
CREATE POLICY messages_user_policy ON messages
    FOR ALL
    USING (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE user_id = current_setting('app.current_user_id', true)
        )
    );

-- Policy: Users can only see their own sessions
CREATE POLICY user_sessions_policy ON user_sessions
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true));

-- ============================================
-- 7. SAMPLE DATA (Optional - for testing)
-- ============================================
-- Uncomment to insert sample data

/*
-- Sample conversation
INSERT INTO conversations (user_id, title) 
VALUES ('test-user-123', 'Getting Started with AI');

-- Sample messages
INSERT INTO messages (conversation_id, role, content) 
VALUES 
    ((SELECT id FROM conversations WHERE user_id = 'test-user-123' LIMIT 1), 
     'user', 
     'What is Module 1 about?'),
    ((SELECT id FROM conversations WHERE user_id = 'test-user-123' LIMIT 1), 
     'assistant', 
     'Module 1 introduces the core concepts of AI and machine learning...');
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Tables created:
--   ✅ conversations - Conversation sessions
--   ✅ messages - Individual messages with embeddings
--   ✅ user_sessions - User preferences and stats
--   ✅ conversation_analytics - Metrics and analytics
--
-- Functions created:
--   ✅ get_conversation_history() - Retrieve conversation messages
--   ✅ search_conversation_messages() - Semantic search in messages
--   ✅ get_or_create_conversation() - Smart conversation management
--
-- Security:
--   ✅ Row Level Security enabled
--   ✅ User-specific policies applied
