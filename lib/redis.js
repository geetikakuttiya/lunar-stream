const { createClient } = require('redis');

// For development, we'll use a connection status variable
let isConnected = false;
let memoryStore = new Map(); // Simple in-memory store for fallback

// Create the client
const client = createClient({
    // url: process.env.REDIS_URL || 'redis://localhost:6379',
    url: process.env.REDIS_URL, 
    socket: {
        reconnectStrategy: (retries) => {
            // Exponential backoff: wait 2^retries * 100ms (max 10s)
            const delay = Math.min(Math.pow(2, retries) * 100, 10000);
            console.log(`Redis reconnecting in ${delay}ms...`);
            return delay;
        }
    }
});

// Listen for errors to prevent uncaught exceptions
client.on('error', (err) => {
    console.error('Redis connection error:', err);
});

// Connect to Redis
async function connectToRedis() {
    if (!isConnected) {
        try {
            await client.connect();
            isConnected = true;
            console.log('Connected to Redis');
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            console.log('Using in-memory fallback for Redis');
        }
    }
    return client;
}

// Close Redis connection
async function disconnectFromRedis() {
    if (isConnected) {
        await client.disconnect();
        isConnected = false;
        console.log('Disconnected from Redis');
    }
}

// Safe wrapper for get - falls back to memory if Redis fails
async function safeGet(key) {
    try {
        if (isConnected) {
            return await client.get(key);
        }
        return memoryStore.get(key);
    } catch (error) {
        console.error('Redis get error:', error);
        return memoryStore.get(key);
    }
}

// Safe wrapper for set - falls back to memory if Redis fails
async function safeSet(key, value, options = {}) {
    try {
        if (isConnected) {
            if (options.expiry) {
                return await client.setEx(key, options.expiry, value);
            }
            return await client.set(key, value);
        }
        memoryStore.set(key, value);
        return 'OK';
    } catch (error) {
        console.error('Redis set error:', error);
        memoryStore.set(key, value);
        return 'OK';
    }
}

// Simple wrapper to delete a key
async function safeDel(key) {
    try {
        if (isConnected) {
            await client.del(key);
        }
        memoryStore.delete(key);
        return true;
    } catch (error) {
        console.error('Redis del error:', error);
        memoryStore.delete(key);
        return true;
    }
}

// Safe wrapper for mget - falls back to memory if Redis fails
async function safeMget(keys) {
    try {
        if (isConnected) {
            return await client.mGet(keys);
        }
        // In-memory fallback implementation for mget
        return keys.map(key => memoryStore.get(key));
    } catch (error) {
        console.error('Redis mget error:', error);
        // In-memory fallback on error
        return keys.map(key => memoryStore.get(key));
    }
}

module.exports = {
    client,
    connectToRedis,
    disconnectFromRedis,
    get: safeGet,
    set: safeSet,
    del: safeDel,
    mget: safeMget
};
