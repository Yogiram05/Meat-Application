const mongoose = require('mongoose');
const User = require('./models/User');
const { connectToDatabase } = require('./config/db');

async function resetDB() {
    try {
        await connectToDatabase();

        // Drop existing database entirely to wipe Orders, Config, Products
        console.log('🗑️ Dropping existing database...');
        await mongoose.connection.db.dropDatabase();
        console.log('✅ Database dropped successfully');

        // Force create User collection by inserting a dummy user then removing it
        console.log('🏗️ Creating new User collection...');
        await User.createCollection();
        console.log('✅ New User collection is ready');

        console.log('🎉 Reset Complete!');
    } catch (err) {
        console.error('❌ Error during reset:', err);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected.');
    }
}

resetDB();
