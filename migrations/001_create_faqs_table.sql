-- Enable the pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the faqs table
CREATE TABLE IF NOT EXISTS public.faqs (
    id BIGSERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    embedding VECTOR(1536),  -- For OpenAI embeddings (1536 dimensions)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraints
    CONSTRAINT faqs_question_key UNIQUE (question)
);

-- Create index for faster similarity search
CREATE INDEX IF NOT EXISTS faqs_embedding_idx ON public.faqs 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comment for the table
COMMENT ON TABLE public.faqs IS 'Stores FAQ entries with vector embeddings for semantic search';

-- Add comments for columns
COMMENT ON COLUMN public.faqs.embedding IS 'Vector embedding of the question for semantic search';
COMMENT ON COLUMN public.faqs.keywords IS 'Array of keywords for filtering and search';

-- Create function to find similar FAQs
CREATE OR REPLACE FUNCTION match_faqs(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id BIGINT,
  question TEXT,
  answer TEXT,
  category TEXT,
  similarity FLOAT
) 
LANGUAGE SQL STABLE
AS $$
  SELECT
    id,
    question,
    answer,
    category,
    1 - (faqs.embedding <=> query_embedding) AS similarity
  FROM faqs
  WHERE 1 - (faqs.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
