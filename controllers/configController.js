/**
 * Get system configuration
 */
const getConfig = (req, res) => {
    res.json({
        config: {
            path: {
                stream1: "akamai",
                stream2: "fastify",
                stream3: "jio_hotstar",
                stream4: "dead",
                source: "dynamic",
                "update-url": "update source url",
                "stream-debug": "debug",
            }
        }
    });
};

/**
 * Update lunar status URL
 */
const updateLunarStatus = async (req, res) => {
    const { new_url, auth_key } = req.body;

    // Get the valid auth key from config
    const config = require('../config');
    const validAuthKey = config.auth.secret;

    if (auth_key !== validAuthKey) {
        return res.status(403).send('Invalid auth_key.');
    }

    if (!new_url) {
        return res.status(400).send('Please provide a new URL.');
    }

    try {
        // Update the environment variable
        process.env.CONFIG_URL = new_url;
        
        // Update the config in memory
        config.streams.lunarStatus = new_url;

        console.log(`Lunar status URL updated to: ${new_url}`, config.streams.lunarStatus);

        // Force reload of the configuration in other modules
        Object.keys(require.cache).forEach(key => {
            if (key.includes('config/index.js') || key.includes('services/streamService')) {
                delete require.cache[key];
            }
        });

        res.send(`Lunar status URL successfully updated to: ${new_url}`);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error updating the lunar status URL.');
    }
};

module.exports = {
    getConfig,
    updateLunarStatus
};