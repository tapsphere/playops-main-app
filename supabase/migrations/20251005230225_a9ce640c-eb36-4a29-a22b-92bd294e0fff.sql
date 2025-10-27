-- Create storage bucket for custom game uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'custom-games',
  'custom-games',
  true,
  52428800, -- 50MB limit
  ARRAY['text/html', 'application/zip', 'application/x-zip-compressed']
);

-- Create storage policies for custom game uploads
CREATE POLICY "Creators can upload their own games"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'custom-games' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Custom games are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'custom-games');

CREATE POLICY "Creators can update their own games"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'custom-games' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Creators can delete their own games"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'custom-games' AND
  auth.uid()::text = (storage.foldername(name))[1]
);