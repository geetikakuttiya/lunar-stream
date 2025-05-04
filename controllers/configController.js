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

module.exports = {
    getConfig
};