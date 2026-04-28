const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    gmail:    { type: String, required: true, unique: true },
    password: { type: String, required: true }, // bcrypt hash
    phone:    { type: String, default: '' },
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
