// Script de migration des images locales vers Supabase Storage
// Usage: node migrate-images.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const UPLOADS_DIR = path.join(__dirname, 'uploads');

async function migrateImages() {
    console.log('🚀 Démarrage de la migration des images vers Supabase Storage...\n');

    // 1. Vérifier que le dossier uploads existe
    if (!fs.existsSync(UPLOADS_DIR)) {
        console.log('❌ Dossier uploads non trouvé');
        return;
    }

    // 2. Lire toutes les images du dossier
    const files = fs.readdirSync(UPLOADS_DIR).filter(f =>
        f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.gif') || f.endsWith('.webp')
    );

    console.log(`📁 ${files.length} images trouvées dans le dossier uploads\n`);

    // 3. Créer un mapping des anciens chemins vers les nouvelles URLs
    const urlMapping = {};

    for (const file of files) {
        const filePath = path.join(UPLOADS_DIR, file);
        const fileContent = fs.readFileSync(filePath);
        const contentType = file.endsWith('.png') ? 'image/png' :
            file.endsWith('.jpg') || file.endsWith('.jpeg') ? 'image/jpeg' :
                file.endsWith('.gif') ? 'image/gif' : 'image/webp';

        console.log(`📤 Upload de ${file}...`);

        // Upload vers Supabase Storage
        const { data, error } = await supabase.storage
            .from('images')
            .upload(file, fileContent, {
                contentType,
                upsert: true
            });

        if (error) {
            console.log(`   ❌ Erreur: ${error.message}`);
            continue;
        }

        // Obtenir l'URL publique
        const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(file);

        const publicUrl = urlData.publicUrl;

        // Mapper les différents formats d'anciens chemins
        urlMapping[`/uploads/${file}`] = publicUrl;
        urlMapping[`http://localhost:3001/uploads/${file}`] = publicUrl;

        console.log(`   ✅ Uploadé: ${publicUrl}`);
    }

    console.log('\n📊 Mapping des URLs créé:\n');
    console.log(urlMapping);

    // 4. Mettre à jour les modules dans la base de données
    console.log('\n🔄 Mise à jour des modules...\n');

    const { data: modules, error: fetchError } = await supabase
        .from('modules')
        .select('*');

    if (fetchError) {
        console.log('❌ Erreur lors de la récupération des modules:', fetchError);
        return;
    }

    for (const module of modules) {
        if (!module.data) continue;

        let dataStr = typeof module.data === 'string' ? module.data : JSON.stringify(module.data);
        let updated = false;

        // Remplacer tous les anciens chemins par les nouvelles URLs
        for (const [oldPath, newUrl] of Object.entries(urlMapping)) {
            if (dataStr.includes(oldPath)) {
                dataStr = dataStr.split(oldPath).join(newUrl);
                updated = true;
            }
        }

        // Mettre à jour aussi l'icône du module
        let newIcon = module.icon;
        for (const [oldPath, newUrl] of Object.entries(urlMapping)) {
            if (module.icon && module.icon.includes(oldPath.replace('/uploads/', ''))) {
                newIcon = newUrl;
                updated = true;
            }
        }

        if (updated) {
            console.log(`📝 Mise à jour du module: ${module.title}`);

            const { error: updateError } = await supabase
                .from('modules')
                .update({
                    data: dataStr,
                    icon: newIcon
                })
                .eq('id', module.id);

            if (updateError) {
                console.log(`   ❌ Erreur: ${updateError.message}`);
            } else {
                console.log(`   ✅ Module mis à jour`);
            }
        }
    }

    console.log('\n✨ Migration terminée!\n');
}

migrateImages().catch(console.error);
