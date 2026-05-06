const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

function normalizeEmail(value) {
    return String(value ?? '').trim().toLowerCase();
}

function getAdminSettings() {
    const email = normalizeEmail(process.env.ADMIN_EMAIL);
    const displayName = String(process.env.ADMIN_DISPLAY_NAME || 'Admin').trim() || 'Admin';
    const password = String(process.env.ADMIN_PASSWORD || '').trim();
    const passwordHash = String(process.env.ADMIN_PASSWORD_HASH || '').trim();
    const jwtSecret = String(process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET || 'meatapp-admin-dev-secret').trim();
    const tokenExpiresIn = String(process.env.ADMIN_JWT_EXPIRES_IN || '7d').trim();

    return {
        email,
        displayName,
        password,
        passwordHash,
        jwtSecret,
        tokenExpiresIn,
    };
}

function toAdminResponse(admin) {
    if (!admin) {
        return null;
    }

    return {
        id: admin._id,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt || null,
    };
}

async function resolvePasswordHash(settings) {
    if (settings.passwordHash) {
        return settings.passwordHash;
    }

    if (!settings.password) {
        return '';
    }

    return bcrypt.hash(settings.password, 10);
}

async function ensureDefaultAdmin() {
    const settings = getAdminSettings();

    if (!settings.email) {
        console.warn('⚠️  ADMIN_EMAIL is missing. Default admin seed skipped.');
        return null;
    }

    if (!settings.password && !settings.passwordHash) {
        console.warn('⚠️  ADMIN_PASSWORD or ADMIN_PASSWORD_HASH is missing. Default admin seed skipped.');
        return null;
    }

    const passwordHash = await resolvePasswordHash(settings);

    const admin = await Admin.findOneAndUpdate(
        { email: settings.email },
        {
            $set: {
                email: settings.email,
                displayName: settings.displayName,
                passwordHash,
                role: 'admin',
                isActive: true,
            },
        },
        {
            returnDocument: 'after',
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
        }
    );

    console.log(`✅ Default admin ensured for ${admin.email}`);
    return admin;
}

function signAdminToken(admin, settings = getAdminSettings()) {
    return jwt.sign(
        {
            sub: admin._id.toString(),
            email: admin.email,
            role: admin.role,
            displayName: admin.displayName,
        },
        settings.jwtSecret,
        { expiresIn: settings.tokenExpiresIn }
    );
}

async function loginAdmin(req, res) {
    try {
        const settings = getAdminSettings();
        const email = normalizeEmail(req.body?.email || req.body?.gmail);
        const password = String(req.body?.password || '').trim();

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required.' });
        }

        let admin = await Admin.findOne({ email, isActive: true });

        if (!admin && settings.email && email === settings.email) {
            admin = await ensureDefaultAdmin();
        }

        if (!admin) {
            return res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }

        if (!admin.passwordHash || !admin.passwordHash.startsWith('$2')) {
            if (settings.email && email === settings.email && settings.password) {
                admin.passwordHash = await bcrypt.hash(settings.password, 10);
                await admin.save();
            } else {
                return res.status(401).json({ success: false, error: 'Invalid credentials.' });
            }
        }

        const isValid = await bcrypt.compare(password, admin.passwordHash);

        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }

        admin.lastLoginAt = new Date();
        await admin.save();

        const token = signAdminToken(admin, settings);

        return res.json({
            success: true,
            token,
            admin: toAdminResponse(admin),
        });
    } catch (error) {
        console.error('ADMIN LOGIN ERROR:', error);
        return res.status(500).json({ success: false, error: 'Unable to process admin login.' });
    }
}

module.exports = {
    ensureDefaultAdmin,
    loginAdmin,
    normalizeEmail,
    signAdminToken,
    toAdminResponse,
};