-- Migration: Ajouter colonnes icon et data à la table modules
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Ajouter la colonne icon
ALTER TABLE modules ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '📘';

-- Renommer content en data (ou ajouter data si vous voulez garder content)
-- Option 1: Renommer content en data
ALTER TABLE modules RENAME COLUMN content TO data;

-- Si vous avez déjà exécuté la ligne ci-dessus et voulez revenir en arrière:
-- ALTER TABLE modules RENAME COLUMN data TO content;

-- Option 2: Ajouter data et copier content (si vous voulez garder les deux)
-- ALTER TABLE modules ADD COLUMN IF NOT EXISTS data JSONB;
-- UPDATE modules SET data = content WHERE data IS NULL;

-- Mettre à jour le module existant pour avoir une structure par défaut
UPDATE modules 
SET data = jsonb_build_object(
  'appTitle', title,
  'sections', '[]'::jsonb,
  'quiz', jsonb_build_object(
    'title', 'Quiz de validation',
    'instructions', 'Répondez aux questions suivantes pour valider vos connaissances.',
    'timeLimit', 0,
    'questions', '[]'::jsonb
  ),
  'certificate', jsonb_build_object(
    'title', 'Certificat de Réussite',
    'subtitle', title,
    'successMessage', 'Félicitations ! Vous avez réussi cette formation.',
    'logoText', 'PM13',
    'leftLogoUrl', '',
    'rightLogoUrl', '',
    'signatureName', '',
    'signatureTitle', '',
    'signatureImage', '',
    'partnerLogos', '[]'::jsonb
  )
)
WHERE data IS NULL OR data::text = 'null';

-- Mettre à jour l'icône par défaut si elle n'existe pas
UPDATE modules SET icon = '📘' WHERE icon IS NULL OR icon = '';
