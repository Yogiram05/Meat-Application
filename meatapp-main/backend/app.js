const express = require('express');
const cors = require('cors');

const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
    console.log('📡 API HIT:', req.method, req.url);
    next();
});

app.get('/', (req, res) => {
    res.send('Meat Booking API is Running!');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', adminRoutes);
app.use('/api/payment', paymentRoutes);

module.exports = app;