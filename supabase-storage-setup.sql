-- Configuration Supabase Storage pour les images
-- Exécutez ces commandes dans Supabase SQL Editor

-- 1. Créer un bucket 'images' (si pas fait via l'interface)
-- Allez dans Storage > Créer un nouveau bucket > Nom: "images" > Public: Oui

-- 2. Politique pour permettre l'upload public
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'images');

-- 3. Politique pour permettre la lecture publique
CREATE POLICY "Allow public reads" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'images');

-- 4. Politique pour permettre les mises à jour
CREATE POLICY "Allow public updates" ON storage.objects
FOR UPDATE TO public
USING (bucket_id = 'images');

-- 5. Politique pour permettre les suppressions
CREATE POLICY "Allow public deletes" ON storage.objects
FOR DELETE TO public
USING (bucket_id = 'images');
