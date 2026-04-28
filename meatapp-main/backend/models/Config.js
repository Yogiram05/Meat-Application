const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
    shopStatus: { type: Boolean, default: true }, // true = Open, false = Closed
    chickenRate: { type: String, default: '₹220' },
    muttonRate: { type: String, default: '₹750' },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Config', ConfigSchema);
