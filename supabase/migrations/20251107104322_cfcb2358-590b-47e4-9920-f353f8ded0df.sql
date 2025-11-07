-- Create logos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
);

-- Create RLS policies for logos bucket
CREATE POLICY "Anyone can upload logos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Anyone can view logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'logos');

CREATE POLICY "Anyone can update logos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'logos');

CREATE POLICY "Anyone can delete logos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'logos');