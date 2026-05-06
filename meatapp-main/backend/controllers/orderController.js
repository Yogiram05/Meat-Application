const Order = require('../models/Order');

function parseNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    const parsed = Number.parseFloat(String(value ?? '').replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeString(value, fallback = '') {
    return String(value ?? fallback).trim();
}

function normalizeItems(items) {
    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .map((item) => ({
            id: normalizeString(item?.id || item?._id),
            title: normalizeString(item?.title || item?.name),
            price: normalizeString(item?.price),
            quantity: Math.max(1, Number.parseFloat(String(item?.quantity ?? 1)) || 1),
            cut: normalizeString(item?.cut),
            cleaning: Array.isArray(item?.cleaning) ? item.cleaning.map((entry) => normalizeString(entry)).filter(Boolean) : [],
        }))
        .filter((item) => item.title && item.price);
}

function extractCustomer(body = {}) {
    const customer = body.customer || {};

    return {
        customerName: normalizeString(body.customerName || body.userName || customer.name || 'Guest', 'Guest') || 'Guest',
        customerPhone: normalizeString(body.customerPhone || customer.phone || ''),
        customerEmail: normalizeString(body.customerEmail || customer.email || ''),
        customerAddress: normalizeString(body.customerAddress || customer.address || ''),
    };
}

function calculateTotal(items, fallbackTotal) {
    const normalizedTotal = parseNumber(fallbackTotal);
    if (normalizedTotal > 0) {
        return normalizedTotal;
    }

    return items.reduce((sum, item) => {
        const itemPrice = parseNumber(item.price);
        return sum + itemPrice * item.quantity;
    }, 0);
}

function buildOrderDocument(body = {}) {
    const items = normalizeItems(body.items);
    const subtotal = calculateTotal(items, body.subtotal || body.total);
    const total = calculateTotal(items, body.total || subtotal);
    const customer = extractCustomer(body);

    return {
        userId: body.userId ? String(body.userId) : null,
        userName: normalizeString(body.userName || customer.customerName || 'Guest', 'Guest') || 'Guest',
        ...customer,
        items,
        subtotal,
        total,
        paymentMethod: normalizeString(body.paymentMethod || 'Cash on Delivery', 'Cash on Delivery') || 'Cash on Delivery',
        paymentStatus: normalizeString(body.paymentStatus || 'Pending', 'Pending') || 'Pending',
        status: normalizeString(body.status || 'Pending', 'Pending') || 'Pending',
        declineReason: normalizeString(body.declineReason || ''),
        isPreBooking: Boolean(body.isPreBooking),
        advancePaid: parseNumber(body.advancePaid),
        description: normalizeString(body.description || ''),
        date: body.date ? new Date(body.date) : new Date(),
    };
}

function serializeOrder(order) {
    return {
        id: order._id.toString(),
        _id: order._id,
        userId: order.userId,
        userName: order.userName,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        customerAddress: order.customerAddress,
        items: order.items,
        subtotal: order.subtotal,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: order.status,
        declineReason: order.declineReason,
        isPreBooking: order.isPreBooking,
        advancePaid: order.advancePaid,
        description: order.description,
        date: order.date,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
    };
}

async function createOrder(req, res) {
    try {
        const payload = buildOrderDocument(req.body);

        if (!payload.items.length) {
            return res.status(400).json({ success: false, error: 'Order must include at least one item.' });
        }

        if (!Number.isFinite(payload.total) || payload.total <= 0) {
            return res.status(400).json({ success: false, error: 'Total amount must be greater than zero.' });
        }

        const savedOrder = await new Order(payload).save();

        return res.status(201).json({
            success: true,
            order: serializeOrder(savedOrder),
        });
    } catch (error) {
        console.error('ORDER CREATE ERROR:', error);
        return res.status(500).json({ success: false, error: error.message || 'Unable to create order.' });
    }
}

async function listOrders(req, res) {
    try {
        const orders = await Order.find().sort({ date: -1, createdAt: -1 });
        return res.json(orders.map(serializeOrder));
    } catch (error) {
        console.error('ORDER LIST ERROR:', error);
        return res.status(500).json({ success: false, error: error.message || 'Unable to fetch orders.' });
    }
}

async function listUserOrders(req, res) {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ userId }).sort({ date: -1, createdAt: -1 });
        return res.json(orders.map(serializeOrder));
    } catch (error) {
        console.error('USER ORDER LIST ERROR:', error);
        return res.status(500).json({ success: false, error: error.message || 'Unable to fetch user orders.' });
    }
}

async function updateOrderStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, declineReason } = req.body || {};

        const update = {};
        if (typeof status === 'string' && status.trim()) {
            update.status = status.trim();
        }
        if (typeof declineReason === 'string') {
            update.declineReason = declineReason.trim();
        }

        if (!Object.keys(update).length) {
            return res.status(400).json({ success: false, error: 'No status fields provided.' });
        }

        const updatedOrder = await Order.findByIdAndUpdate(id, update, { new: true, runValidators: true });

        if (!updatedOrder) {
            return res.status(404).json({ success: false, error: 'Order not found.' });
        }

        return res.json({ success: true, order: serializeOrder(updatedOrder) });
    } catch (error) {
        console.error('ORDER STATUS ERROR:', error);
        return res.status(500).json({ success: false, error: error.message || 'Unable to update order status.' });
    }
}

module.exports = {
    buildOrderDocument,
    createOrder,
    listOrders,
    listUserOrders,
    serializeOrder,
    updateOrderStatus,
};