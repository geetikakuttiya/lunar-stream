const express = require('express');
const cors = require('cors');
require('dotenv').config();
const redis = require('./config/redis');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.use('/', routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ value: "What are you searching for buddy?" });
});

// Start server
const startServer = async () => {
    try {
        await redis.connectToRedis();
        console.log(`Server is running on port ${PORT}`);
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
        process.exit(1);
    }
};

app.listen(PORT, startServer);

module.exports = app;