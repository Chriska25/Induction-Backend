-- Mettre à jour la table users pour inclure les champs de vérification d'email
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_token text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_token_expires timestamp with time zone;

-- S'assurer que les nouveaux utilisateurs ont l'email vérifié à false par défaut
ALTER TABLE public.users ALTER COLUMN email_verified SET DEFAULT false;
