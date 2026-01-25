-- Migration pour l'ajout de la vérification d'email
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter les colonnes de vérification à la table users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMPTZ;

-- 2. Mettre à jour les utilisateurs existants pour qu'ils soient considérés comme vérifiés
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;

-- 3. (Optionnel) Index pour recherche rapide par token
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
