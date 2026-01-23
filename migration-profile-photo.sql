-- Ajouter la photo de profil aux utilisateurs
-- Exécutez ce script dans Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- Commentaire
COMMENT ON COLUMN users.profile_photo IS 'URL de la photo de profil utilisateur';
