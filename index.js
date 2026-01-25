import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Configuration
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer configuration for file uploads - using memory storage for Supabase upload
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Email Transporter Configuration
// Dynamic SMTP Transporter Helper
const createTransporter = async () => {
    // defaults
    let config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        from: process.env.SMTP_FROM || '"Plateforme Formation" <noreply@pm13-formation.com>'
    };

    // Try to load overrides from DB settings
    try {
        const { data: settings } = await supabase.from('settings').select('*');
        if (settings) {
            const map = {};
            settings.forEach(s => map[s.key] = s.value);

            if (map.smtp_host) config.host = map.smtp_host;
            if (map.smtp_port) config.port = parseInt(map.smtp_port);
            if (map.smtp_user) config.auth.user = map.smtp_user;
            if (map.smtp_pass) config.auth.pass = map.smtp_pass;
            if (map.smtp_from) config.from = map.smtp_from;
        }
    } catch (e) {
        console.warn('Failed to load SMTP settings from DB, using env', e);
    }

    return {
        transporter: nodemailer.createTransport(config),
        from: config.from
    };
};

// Serve uploaded files (fallback for old local files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== AUTH ====================

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Get user from Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check verification
        if (user.email_verified === false) { // Explicit false check, allows null to pass until migration runs, or strict check?
            // Let's be strict but handle existing logic.
            // If users are not migrated, email_verified might be null.
            // If I created migration, they are true.
            // If migration didn't run, they are null.
            // Safest is `if (user.email_verified === false)`. 
            // New users are strictly false.
            return res.status(403).json({ error: 'Veuillez confirmer votre email avant de vous connecter.' });
        }

        // Remove password from response
        delete user.password_hash;

        res.json({ user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== USERS ====================

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, job_title, organization, city, role, registered_at')
            .order('registered_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, job_title, organization, city, role, registered_at, profile_photo')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'User not found' });
    }
});

// Create user
app.post('/api/users', async (req, res) => {
    try {
        const { fullName, email, jobTitle, organization, city, password } = req.body;

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Generate Verification Token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date();
        tokenExpires.setHours(tokenExpires.getHours() + 24); // 24h expiration

        // Insert user
        const { data, error } = await supabase
            .from('users')
            .insert([{
                full_name: fullName,
                email,
                job_title: jobTitle,
                organization,
                city,
                password_hash,
                email_verified: false,
                verification_token: verificationToken,
                verification_token_expires: tokenExpires.toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        // Send Verification Email
        try {
            const { transporter, from } = await createTransporter();
            const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

            await transporter.sendMail({
                from: from,
                to: email,
                subject: 'Confirmez votre inscription',
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>Bienvenue ${fullName} !</h2>
                        <p>Merci de vous être inscrit sur la plateforme de formation.</p>
                        <p>Veuillez cliquer sur le lien ci-dessous pour activer votre compte :</p>
                        <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Confirmer mon email</a>
                        <p>Ce lien est valide pendant 24 heures.</p>
                        <p>Si vous n'avez pas demandé cette inscription, ignorez cet email.</p>
                    </div>
                `
            });
            console.log(`Verification email sent to ${email}`);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // We don't fail the request, but user might need to request resend
        }

        if (error) throw error;

        // Remove password from response
        delete data.password_hash;

        res.status(201).json(data);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Verify Email
app.post('/api/verify-email', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token manquant' });
        }

        // Find user with this token
        // Note: verification_token_expires might need to be cast if stored as string, but Supabase handles formatting usually
        const { data: user, error: findError } = await supabase
            .from('users')
            .select('id, verification_token_expires')
            .eq('verification_token', token)
            .single();

        if (findError || !user) {
            return res.status(400).json({ error: 'Lien de validation invalide.' });
        }

        // Check expiration
        if (new Date(user.verification_token_expires) < new Date()) {
            return res.status(400).json({ error: 'Le lien a expiré.' });
        }

        // Verify user
        const { error: updateError } = await supabase
            .from('users')
            .update({
                email_verified: true,
                verification_token: null,
                verification_token_expires: null
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

        res.json({ success: true, message: 'Email vérifié avec succès !' });

    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ error: 'Échec de la vérification' });
    }
});

app.post('/api/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        const { data: user } = await supabase
            .from('users')
            .select('full_name')
            .eq('email', email)
            .single();

        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date();
        tokenExpires.setHours(tokenExpires.getHours() + 24);

        await supabase
            .from('users')
            .update({
                verification_token: verificationToken,
                verification_token_expires: tokenExpires.toISOString()
            })
            .eq('email', email);

        // Resend logic
        const { transporter, from } = await createTransporter();
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

        await transporter.sendMail({
            from: from,
            to: email,
            subject: 'Nouveau lien de confirmation',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Bonjour ${user.full_name},</h2>
                    <p>Voici votre nouveau lien de confirmation :</p>
                    <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Confirmer mon email</a>
                </div>
            `
        });

        res.json({ message: 'Email renvoyé' });
    } catch (e) {
        res.status(500).json({ error: 'Erreur technique' });
    }
});

// Update user profile
app.put('/api/users/:id', async (req, res) => {
    try {
        const { fullName, jobTitle, organization, city, profilePhoto, password } = req.body;

        const updateData = {};
        if (fullName !== undefined) updateData.full_name = fullName;
        if (jobTitle !== undefined) updateData.job_title = jobTitle;
        if (organization !== undefined) updateData.organization = organization;
        if (city !== undefined) updateData.city = city;
        if (profilePhoto !== undefined) updateData.profile_photo = profilePhoto;

        if (password && password.trim() !== '') {
            updateData.password_hash = await bcrypt.hash(password, 10);
        }

        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        delete data.password_hash;
        res.json(data);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// ==================== MODULES ====================

// Get all modules
app.get('/api/modules', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('modules')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Get modules error:', error);
        res.status(500).json({ error: 'Failed to fetch modules' });
    }
});

// Create module
app.post('/api/modules', async (req, res) => {
    try {
        const { id, title, description, icon, data } = req.body;

        // Create default content structure if no data provided
        const defaultData = {
            appTitle: title || 'Nouvelle Formation',
            sections: [],
            quiz: {
                title: 'Quiz de validation',
                instructions: 'Répondez aux questions suivantes pour valider vos connaissances.',
                timeLimit: 0,
                questions: []
            },
            certificate: {
                title: 'Certificat de Réussite',
                subtitle: title || 'Formation',
                successMessage: 'Félicitations ! Vous avez réussi cette formation.',
                logoText: 'PM13',
                leftLogoUrl: '',
                rightLogoUrl: '',
                signatureName: '',
                signatureTitle: '',
                signatureImage: '',
                partnerLogos: []
            }
        };

        const moduleData = {
            id: id || title.toLowerCase().replace(/\s+/g, '-'),
            title,
            description: description || '',
            icon: icon || '📘',
            data: data ? JSON.stringify(data) : JSON.stringify(defaultData),
            is_active: true,
            order_index: 0
        };

        const { data: result, error } = await supabase
            .from('modules')
            .insert([moduleData])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(result);
    } catch (error) {
        console.error('Create module error:', error);
        res.status(500).json({ error: 'Failed to create module', details: error.message });
    }
});

// Update module
app.put('/api/modules/:id', async (req, res) => {
    try {
        const { title, description, icon, data, is_active } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (icon !== undefined) updateData.icon = icon;
        if (data !== undefined) updateData.data = typeof data === 'string' ? data : JSON.stringify(data);
        if (is_active !== undefined) updateData.is_active = is_active;

        const { data: result, error } = await supabase
            .from('modules')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(result);
    } catch (error) {
        console.error('Update module error:', error);
        res.status(500).json({ error: 'Failed to update module', details: error.message });
    }
});

// Delete module
app.delete('/api/modules/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('modules')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Module deleted' });
    } catch (error) {
        console.error('Delete module error:', error);
        res.status(500).json({ error: 'Failed to delete module' });
    }
});

// ==================== TRAININGS ====================

// Get user trainings
app.get('/api/trainings/user/:userId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('trainings')
            .select('*, modules(*)')
            .eq('user_id', req.params.userId);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Get trainings error:', error);
        res.status(500).json({ error: 'Failed to fetch trainings', details: error });
    }
});

// Create/Update training
app.post('/api/trainings', async (req, res) => {
    try {
        const { userId, moduleId, status, progress, score, type } = req.body;

        // Map frontend fields (if present) to backend schema
        const final_userId = userId || req.body.user_id;
        const final_moduleId = moduleId || req.body.module_id;
        const final_status = type || status || 'en_cours';
        const final_progress = score !== undefined ? score : (progress || 0);

        if (!final_userId || !final_moduleId) {
            return res.status(400).json({ error: 'Missing userId or moduleId' });
        }

        const { data, error } = await supabase
            .from('trainings')
            .upsert([{
                user_id: final_userId,
                module_id: final_moduleId,
                status: final_status,
                progress: final_progress
            }], {
                onConflict: 'user_id,module_id'
            })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Create training error:', error);
        res.status(500).json({ error: 'Failed to create training', details: error.message });
    }
});

// ==================== SETTINGS ====================

// Get settings
app.get('/api/settings', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('*');

        if (error) throw error;

        // Convert array to object
        const settings = {};
        data.forEach(item => {
            settings[item.key] = item.value;
        });

        res.json(settings);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update settings
app.put('/api/settings', async (req, res) => {
    try {
        const updates = Object.entries(req.body).map(([key, value]) => ({
            key,
            value: String(value)
        }));

        const { data, error } = await supabase
            .from('settings')
            .upsert(updates, { onConflict: 'key' })
            .select();

        if (error) throw error;

        // Convert array to object
        const settings = {};
        data.forEach(item => {
            settings[item.key] = item.value;
        });

        res.json(settings);
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// ==================== UPLOAD ====================

app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.body.userId || null;
        const filename = `${Date.now()}-${req.file.originalname}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('images')
            .upload(filename, req.file.buffer || fs.readFileSync(req.file.path), {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(filename);

        const publicUrl = urlData.publicUrl;

        // Save to database
        if (userId) {
            const { data, error } = await supabase
                .from('images')
                .insert([{ user_id: userId, filename, path: publicUrl }])
                .select()
                .single();

            if (error) throw error;

            // Delete local file after upload to Supabase
            if (req.file.path) {
                fs.unlinkSync(req.file.path);
            }

            res.json({ path: publicUrl, id: data.id });
        } else {
            // Delete local file after upload to Supabase
            if (req.file.path) {
                fs.unlinkSync(req.file.path);
            }

            res.json({ path: publicUrl });
        }
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed', details: error.message });
    }
});

// ==================== ADMIN ====================

// Get all users (admin)
app.get('/api/admin/users', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('registered_at', { ascending: false });

        if (error) throw error;

        // Remove passwords
        const users = data.map(user => {
            delete user.password_hash;
            return user;
        });

        res.json(users);
    } catch (error) {
        console.error('Get admin users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Update user (admin)
app.put('/api/admin/users/:userId', async (req, res) => {
    try {
        const { role, password } = req.body;
        const updateData = {};

        // Update role if provided
        if (role !== undefined) {
            updateData.role = role;
        }

        // Update password if provided
        if (password !== undefined) {
            updateData.password_hash = await bcrypt.hash(password, 10);
        }

        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', req.params.userId)
            .select()
            .single();

        if (error) throw error;

        // Remove password from response
        delete data.password_hash;
        res.json(data);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Get logs
app.get('/api/admin/logs', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`✅ Backend server running on port ${PORT}`);
    console.log(`✅ Supabase connected: ${process.env.SUPABASE_URL}`);
    console.log(`✅ CORS enabled for: ${process.env.FRONTEND_URL}`);
});
