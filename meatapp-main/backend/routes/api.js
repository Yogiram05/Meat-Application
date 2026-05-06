const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const Product = require('../models/Product');
const Order   = require('../models/Order');
const Config  = require('../models/Config');
const User    = require('../models/User');
const {
    createOrder,
    listOrders,
    listUserOrders,
    updateOrderStatus,
} = require('../controllers/orderController');

// ==========================================
// AUTH API
// ==========================================

// REGISTER a new user
router.post('/register', async (req, res) => {
    try {
        const { username, gmail, password } = req.body;

        if (!username || !gmail || !password) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const existingUser = await User.findOne({ gmail });
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this Gmail already exists.' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new User({ username, gmail, password: passwordHash });
        const savedUser = await newUser.save();

        res.json({
            message: 'Account created successfully!',
            user: { id: savedUser._id, username: savedUser.username, gmail: savedUser.gmail }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LOGIN user
router.post('/login', async (req, res) => {
    try {
        const { gmail, password } = req.body;

        if (!gmail || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findOne({ gmail });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        res.json({
            message: 'Login successful',
            user: { id: user._id, username: user.username, gmail: user.gmail }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// PRODUCTS API
// ==========================================

// GET all products
router.get('/products', async (req, res) => {
    try {
        console.log('➡️ /products hit');
        const products = await Product.find();
        console.log('✅ Products fetched:', products.length);
        res.json(products);
    } catch (err) {
        console.error('❌ /products error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ADD a new product
router.post('/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.json(savedProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE a product
router.put('/products/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, req.body, { new: true }
        );
        if (!updatedProduct) return res.status(404).json({ error: 'Product not found' });
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE a product
router.delete('/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// ORDERS API
// ==========================================

// GET all orders (admin)
router.get('/orders', listOrders);

// GET orders for a specific user
router.get('/orders/user/:userId', listUserOrders);

// PLACE a new order
router.post('/orders', createOrder);

// UPDATE order status (admin)
router.put('/orders/:id/status', updateOrderStatus);

// ==========================================
// CONFIG API (Shop Status & Rates)
// ==========================================

// GET Config
router.get('/config', async (req, res) => {
    try {
        console.log('➡️ /config hit');
        let config = await Config.findOne();
        if (!config) {
            config = new Config();
            await config.save();
        }
        console.log('✅ Config fetched');
        res.json(config);
    } catch (err) {
        console.error('❌ /config error:', err);
        res.status(500).json({ error: err.message });
    }
});

// UPDATE Config
router.post('/config', async (req, res) => {
    try {
        let config = await Config.findOne();
        if (!config) {
            config = new Config(req.body);
        } else {
            if (req.body.shopStatus !== undefined) config.shopStatus = req.body.shopStatus;
            if (req.body.chickenRate !== undefined) config.chickenRate = req.body.chickenRate;
            if (req.body.muttonRate !== undefined)  config.muttonRate  = req.body.muttonRate;
            config.updatedAt = Date.now();
        }
        await config.save();
        res.json(config);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
