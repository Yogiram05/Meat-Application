const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    userId:      { type: String, default: null },   // links to User._id
    userName:    { type: String, default: 'Guest' },
    items:       { type: Array, required: true },
    total:       { type: Number, required: true },
    status:      { type: String, default: 'Pending' },
    declineReason: { type: String, default: '' },
    isPreBooking: { type: Boolean, default: false },
    advancePaid: { type: Number, default: 0 },
    description: { type: String, default: '' },
    date:        { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', OrderSchema);
