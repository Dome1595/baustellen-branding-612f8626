-- Update mockup-templates bucket to ensure it's fully public and accessible
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
WHERE id = 'mockup-templates';

-- Ensure all objects in the bucket are publicly readable
UPDATE storage.objects
SET owner = NULL
WHERE bucket_id = 'mockup-templates';