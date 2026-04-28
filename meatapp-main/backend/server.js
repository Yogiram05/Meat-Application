const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { connectToDatabase, isDatabaseReady, getDatabaseError } = require('./config/db');
const Admin = require('./models/Admin');

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
app.use(express.json());
app.use((req, res, next) => {
    console.log('📡 API HIT:', req.method, req.url);
    next();
});

function requireDatabase(req, res, next) {
    if (req.path === '/' || req.path === '/health') {
        return next();
    }

    if (isDatabaseReady()) {
        return next();
    }

    const errorMessage = getDatabaseError()?.message || 'Database connection is not ready yet.';
    return res.status(503).json({
        success: false,
        error: errorMessage,
    });
}

function normalizeEmail(value) {
    return String(value ?? '').trim().toLowerCase();
}

function getConfiguredAdminCredentials() {
    const email = normalizeEmail(process.env.ADMIN_EMAIL);
    const displayName = String(process.env.ADMIN_DISPLAY_NAME || 'Admin').trim() || 'Admin';
    const password = String(process.env.ADMIN_PASSWORD || '').trim();
    const passwordHash = String(process.env.ADMIN_PASSWORD_HASH || '').trim();

    if (!email) {
        return null;
    }

    return { email, displayName, password, passwordHash };
}

async function compareAdminPassword(password, adminRecord, configuredAdmin) {
    if (adminRecord?.passwordHash) {
        return bcrypt.compare(password, adminRecord.passwordHash);
    }

    if (!configuredAdmin) {
        return false;
    }

    if (configuredAdmin.passwordHash) {
        return bcrypt.compare(password, configuredAdmin.passwordHash);
    }

    return password === configuredAdmin.password;
}

async function upsertConfiguredAdmin(configuredAdmin, password) {
    if (!configuredAdmin) {
        return null;
    }

    const passwordHash = configuredAdmin.passwordHash || await bcrypt.hash(password || configuredAdmin.password, 10);

    return Admin.findOneAndUpdate(
        { email: configuredAdmin.email },
        {
            email: configuredAdmin.email,
            displayName: configuredAdmin.displayName,
            passwordHash,
            role: 'admin',
            isActive: true,
        },
        { upsert: true, setDefaultsOnInsert: true, returnDocument: 'after' }
    );
}

app.post('/api/admin/login', requireDatabase, async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email || req.body.gmail);
        const password = String(req.body.password || '').trim();

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required.' });
        }

        const configuredAdmin = getConfiguredAdminCredentials();
        const adminRecord = await Admin.findOne({ email, isActive: true });

        if (adminRecord) {
            const isValid = await compareAdminPassword(password, adminRecord, configuredAdmin);
            if (!isValid) {
                return res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
            }

            adminRecord.lastLoginAt = new Date();
            await adminRecord.save();

            return res.json({
                success: true,
                admin: {
                    id: adminRecord._id,
                    email: adminRecord.email,
                    displayName: adminRecord.displayName,
                    role: adminRecord.role,
                },
            });
        }

        if (configuredAdmin && email === configuredAdmin.email) {
            const isValid = configuredAdmin.passwordHash
                ? await bcrypt.compare(password, configuredAdmin.passwordHash)
                : password === configuredAdmin.password;

            if (!isValid) {
                return res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
            }

            const createdAdmin = await upsertConfiguredAdmin(configuredAdmin, password);
            if (!createdAdmin) {
                return res.status(500).json({ success: false, error: 'Admin account is not configured.' });
            }

            createdAdmin.lastLoginAt = new Date();
            await createdAdmin.save();

            return res.json({
                success: true,
                admin: {
                    id: createdAdmin._id,
                    email: createdAdmin.email,
                    displayName: createdAdmin.displayName,
                    role: createdAdmin.role,
                },
            });
        }

        return res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', requireDatabase, apiRoutes);
app.use('/api/auth', requireDatabase, apiRoutes);
const paymentRoutes = require('./routes/payment.routes');
app.use('/api/payment', paymentRoutes);

app.get('/', (req, res) => {
    res.send('Meat Booking API is Running!');
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
});

// Start Server
async function startServer() {
    connectToDatabase().catch((error) => {
        console.error('Database connection is unavailable:', error.message);
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

startServer().catch((error) => {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
});
