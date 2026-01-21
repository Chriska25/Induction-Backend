-- Schema Supabase pour Plateforme PM13
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  job_title TEXT,
  organization TEXT,
  city TEXT,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: modules (formations)
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB,
  order_index INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: trainings (progression utilisateurs)
CREATE TABLE IF NOT EXISTS trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'en_cours',
  progress INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- Table: images
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  path TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: logs
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_trainings_user_id ON trainings(user_id);
CREATE INDEX IF NOT EXISTS idx_trainings_module_id ON trainings(module_id);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Policies pour users
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Policies pour modules (lecture publique)
CREATE POLICY "Anyone can view active modules" ON modules
  FOR SELECT USING (is_active = true);

-- Policies pour trainings
CREATE POLICY "Users can view their own trainings" ON trainings
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own trainings" ON trainings
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own trainings" ON trainings
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Policies pour settings (lecture publique)
CREATE POLICY "Anyone can view settings" ON settings
  FOR SELECT USING (true);

-- Function pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainings_updated_at BEFORE UPDATE ON trainings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Données initiales: Admin user
-- Note: Le mot de passe sera haché côté backend
-- Ceci est juste un placeholder

-- Données initiales: Settings
INSERT INTO settings (key, value) VALUES
  ('site_name', 'Plateforme de Formation TUDIENZELE'),
  ('org_name', 'ADRA'),
  ('copyright', '© 2026 ADRA TUDIENZELE. Tous droits réservés.'),
  ('site_description', 'Plateforme de formation en ligne')
ON CONFLICT (key) DO NOTHING;

-- Commentaires
COMMENT ON TABLE users IS 'Utilisateurs de la plateforme';
COMMENT ON TABLE modules IS 'Modules de formation';
COMMENT ON TABLE trainings IS 'Progression des utilisateurs dans les modules';
COMMENT ON TABLE images IS 'Images uploadées';
COMMENT ON TABLE settings IS 'Paramètres du site';
COMMENT ON TABLE logs IS 'Logs système';
