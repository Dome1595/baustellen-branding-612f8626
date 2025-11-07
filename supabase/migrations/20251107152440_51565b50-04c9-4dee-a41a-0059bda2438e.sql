-- Create mockup-templates storage bucket for template images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mockup-templates',
  'mockup-templates',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy to allow public read access
CREATE POLICY "Public read access for mockup templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'mockup-templates');

-- Create RLS policy to allow authenticated users to upload templates
CREATE POLICY "Authenticated users can upload mockup templates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'mockup-templates' AND auth.role() = 'authenticated');

-- Create RLS policy to allow service role to manage templates
CREATE POLICY "Service role can manage mockup templates"
ON storage.objects FOR ALL
USING (bucket_id = 'mockup-templates' AND auth.role() = 'service_role');