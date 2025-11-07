-- Create mockups storage bucket for generated images
INSERT INTO storage.buckets (id, name, public)
VALUES ('mockups', 'mockups', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to mockups bucket
CREATE POLICY "Public Access for mockups"
ON storage.objects FOR SELECT
USING (bucket_id = 'mockups');

-- Allow service role to upload mockups
CREATE POLICY "Service role can upload mockups"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'mockups');