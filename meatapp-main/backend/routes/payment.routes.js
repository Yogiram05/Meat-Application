const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const razorpay = require('../config/razorpay');

router.post('/create-order', async (req, res) => {
    try {
        const amount = Number(req.body.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount.' });
        }

        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        });

        res.json({ success: true, order });
    } catch (err) {
        console.error('ORDER ERROR:', err && err.stack ? err.stack : err);
        res.status(500).json({
            success: false,
            message: err?.message || 'Unable to create payment order.',
        });
    }
});

router.post('/verify-payment', (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body || {};

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Missing payment verification data.' });
        }

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(body)
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            return res.json({ success: true });
        }

        return res.status(400).json({ success: false });
    } catch (err) {
        console.error('VERIFY ERROR:', err && err.stack ? err.stack : err);
        res.status(500).json({
            success: false,
            message: err?.message || 'Unable to verify payment.',
        });
    }
});

module.exports = router;
