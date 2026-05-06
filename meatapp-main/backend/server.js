const os = require('os');
const { connectToDatabase } = require('./config/db');
const app = require('./app');
const { ensureDefaultAdmin } = require('./controllers/adminController');

const PORT = Number(process.env.PORT || 3001);

function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();

    for (const interfaceAddresses of Object.values(interfaces)) {
        if (!interfaceAddresses) {
            continue;
        }

        for (const address of interfaceAddresses) {
            if (address && address.family === 'IPv4' && !address.internal) {
                return address.address;
            }
        }
    }

    return 'localhost';
}

async function startServer() {
    await connectToDatabase();
    await ensureDefaultAdmin();
    const localIpAddress = getLocalIpAddress();

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🌐 Network available at http://${localIpAddress}:${PORT}`);
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

startServer().catch((error) => {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
});
