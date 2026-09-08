
-- avatars & shop images: any signed-in user may read; only uploader folder may write
CREATE POLICY "read avatars and shop images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('avatars','shops'));
CREATE POLICY "write own avatars" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('avatars','shops') AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "update own avatars" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('avatars','shops') AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "delete own avatars" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('avatars','shops') AND (storage.foldername(name))[1] = auth.uid()::text);

-- receipts: path is <shop_id>/<file>
CREATE POLICY "read shop receipts" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND (
    public.is_admin()
    OR public.owns_shop(((storage.foldername(name))[1])::uuid)
    OR public.member_of_shop(((storage.foldername(name))[1])::uuid)
  ));
CREATE POLICY "write shop receipts" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND (
    public.owns_shop(((storage.foldername(name))[1])::uuid)
    OR public.member_of_shop(((storage.foldername(name))[1])::uuid)
  ));

-- documents: path is <user_id>/<file>
CREATE POLICY "read own documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));
CREATE POLICY "write own documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
