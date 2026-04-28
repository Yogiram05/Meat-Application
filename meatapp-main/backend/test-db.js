const mongoose = require('mongoose');
const { connectToDatabase } = require('./config/db');

console.log('Testing MongoDB Connection...');

connectToDatabase()
    .then(() => {
        console.log('✅ Success! Connected to MongoDB.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Connection Failed:', err.message);
        process.exit(1);
    });
