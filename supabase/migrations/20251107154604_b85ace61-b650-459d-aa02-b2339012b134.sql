-- Fix CORS and public access for mockup-templates bucket
-- First, ensure the bucket is public
UPDATE storage.buckets 
SET public = true
WHERE id = 'mockup-templates';

-- Remove all RLS policies that might block access
DROP POLICY IF EXISTS "Public read access for mockup templates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload mockup templates" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage mockup templates" ON storage.objects;

-- Create a simple public read policy
CREATE POLICY "Allow public read access to mockup templates"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'mockup-templates');