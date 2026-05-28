-- Run this SQL in your Supabase project's SQL Editor to create the necessary tables.

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  mobile text UNIQUE,
  name text,
  role text,
  pm_kisan_id text,
  village text,
  district text,
  aadhaar_last4 text
);

CREATE TABLE IF NOT EXISTS public.farms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid REFERENCES public.users(id),
  survey_no text,
  area numeric,
  area_unit text,
  primary_crop text,
  noc_url text,
  document_712_url text,
  gps_location text
);

CREATE TABLE IF NOT EXISTS public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  batch_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES public.users(id),
  farmer text,
  kiln text,
  feedstock text,
  status text,
  step text,
  age text,
  steps_completed text[],
  tco2e text,
  flag boolean DEFAULT false
);

-- Turn on Row Level Security (RLS) but allow public access for this prototyping phase
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update users" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read farms" ON public.farms FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert farms" ON public.farms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update farms" ON public.farms FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read batches" ON public.batches FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert batches" ON public.batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update batches" ON public.batches FOR UPDATE USING (true);

-- Ensure correct storage bucket 'documents' and 'evidence' exist
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence', 'evidence', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read upload documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Allow public insert documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow public read upload evidence" ON storage.objects FOR SELECT USING (bucket_id = 'evidence');
CREATE POLICY "Allow public insert evidence" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'evidence');
