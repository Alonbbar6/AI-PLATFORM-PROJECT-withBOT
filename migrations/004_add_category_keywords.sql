-- Add missing category and keywords columns to faqs table

ALTER TABLE public.faqs
ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE public.faqs
ADD COLUMN IF NOT EXISTS keywords TEXT[];

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs (category);

-- Create index for keywords (GIN index for array searching)
CREATE INDEX IF NOT EXISTS idx_faqs_keywords ON public.faqs USING GIN (keywords);

-- Verify the changes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'faqs';
