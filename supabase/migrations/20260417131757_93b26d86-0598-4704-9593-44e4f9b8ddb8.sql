
DROP POLICY "Public read post images" ON storage.objects;
CREATE POLICY "Public read post images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'post-images' AND owner IS NOT NULL
  );
