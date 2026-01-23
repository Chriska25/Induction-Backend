import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// Serve uploaded files
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
            .select('id, full_name, email, job_title, organization, city, role, registered_at')
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

        // Insert user
        const { data, error } = await supabase
            .from('users')
            .insert([{
                full_name: fullName,
                email,
                job_title: jobTitle,
                organization,
                city,
                password_hash
            }])
            .select()
            .single();

        if (error) throw error;

        // Remove password from response
        delete data.password_hash;

        res.status(201).json(data);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
    try {
        const { fullName, jobTitle, organization, city } = req.body;

        const { data, error } = await supabase
            .from('users')
            .update({
                full_name: fullName,
                job_title: jobTitle,
                organization,
                city
            })
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
        const { user_id, module_id, status, progress } = req.body;

        const { data, error } = await supabase
            .from('trainings')
            .upsert([{ user_id, module_id, status, progress }], {
                onConflict: 'user_id,module_id'
            })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Create training error:', error);
        res.status(500).json({ error: 'Failed to create training' });
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
        const filename = req.file.filename;
        const filePath = `/uploads/${filename}`;

        // Save to database
        if (userId) {
            const { data, error } = await supabase
                .from('images')
                .insert([{ user_id: userId, filename, path: filePath }])
                .select()
                .single();

            if (error) throw error;
            res.json({ path: filePath, id: data.id });
        } else {
            res.json({ path: filePath });
        }
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
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
