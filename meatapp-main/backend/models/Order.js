const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    id: { type: String, default: '' },
    title: { type: String, required: true, trim: true },
    price: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    cut: { type: String, default: '' },
    cleaning: { type: [String], default: [] },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    userId: { type: String, default: null },
    userName: { type: String, default: 'Guest', trim: true },
    customerName: { type: String, default: 'Guest', trim: true },
    customerPhone: { type: String, default: '', trim: true },
    customerEmail: { type: String, default: '', trim: true, lowercase: true },
    customerAddress: { type: String, default: '', trim: true },
    items: {
        type: [OrderItemSchema],
        required: true,
        validate: [(items) => Array.isArray(items) && items.length > 0, 'Order must contain at least one item'],
    },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Cash on Delivery', trim: true },
    paymentStatus: { type: String, default: 'Pending', trim: true },
    status: { type: String, default: 'Pending', trim: true },
    declineReason: { type: String, default: '' },
    isPreBooking: { type: Boolean, default: false },
    advancePaid: { type: Number, default: 0 },
    description: { type: String, default: '' },
    date: { type: Date, default: Date.now },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Order', OrderSchema);
