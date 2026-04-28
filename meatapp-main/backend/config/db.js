const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({
    path: path.join(__dirname, '..', '.env')
});

let databaseReady = false;
let databaseError = null;

async function connectToDatabase() {
    databaseReady = false;
    databaseError = null;

    if (!process.env.MONGODB_URI) {
        databaseError = new Error('MONGODB_URI missing');
        throw databaseError;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
        });

        databaseReady = true;
        databaseError = null;
        console.log('✅ MongoDB Connected');
        return process.env.MONGODB_URI;
    } catch (error) {
        databaseReady = false;
        databaseError = error;
        console.error('MongoDB Error:', error);
        throw error;
    }
}

function isDatabaseReady() {
    return databaseReady;
}

function getDatabaseError() {
    return databaseError;
}

module.exports = {
    connectToDatabase,
    isDatabaseReady,
    getDatabaseError,
};