
-- Add columns to medical_records table for OCR functionality
ALTER TABLE public.medical_records 
ADD COLUMN IF NOT EXISTS ocr_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS ocr_provider TEXT DEFAULT 'ocr_space';

-- Add columns to symptoms table for AI analysis
ALTER TABLE public.symptoms 
ADD COLUMN IF NOT EXISTS infermedica_analysis JSONB,
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);

-- Create a table to store API usage and logs
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  api_provider TEXT NOT NULL,
  endpoint TEXT,
  request_data JSONB,
  response_data JSONB,
  status_code INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for API usage logs
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API logs" 
  ON public.api_usage_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API logs" 
  ON public.api_usage_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
