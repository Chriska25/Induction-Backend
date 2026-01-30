-- Drop existing constraints if necessary (be careful in prod)
-- We need to change the 'id' column type from UUID to TEXT to support custom IDs like 'hygiene-base'
-- CAUTION: This might fail if there are foreign keys relying on it being UUID
-- However, existing foreign keys (trainings.module_id) also need to change to TEXT or we must stick to UUIDs.

-- OPTION A: If we want textual IDs for modules (e.g. 'hygiene-base')
-- We must alter modules.id to TEXT and trainings.module_id to TEXT.

-- 1. Remove FK constraint
ALTER TABLE trainings DROP CONSTRAINT IF EXISTS trainings_module_id_fkey;

-- 2. Alter modules.id to TEXT
ALTER TABLE modules ALTER COLUMN id DROP DEFAULT;
ALTER TABLE modules ALTER COLUMN id TYPE TEXT;

-- 3. Alter trainings.module_id to TEXT
ALTER TABLE trainings ALTER COLUMN module_id TYPE TEXT;

-- 4. Re-add FK constraint
ALTER TABLE trainings ADD CONSTRAINT trainings_module_id_fkey FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;

-- 5. Fix users table if needed (users.id is fine as UUID, usually)
