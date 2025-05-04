const config = require('../config');

const checkRequest = (req, res, next) => {
    // Always allow in development mode
    if (process.env.NODE_ENV !== "production") {
        return next();
    }
    
    // In production, check for specific paths or VLC user-agent
    const headers = req.headers;
    
    // Check if it's a VLC request or one of the allowed paths
    if (headers['user-agent'] && headers['user-agent'].includes("VLC") || 
        config.allowedPaths.includes(req.path)) {
        return next();
    }
    
    // Block other requests in production
    res.status(403).send('You are not allowed to access this stream directly. Please use VLC or another media player.');
};

module.exports = {
    checkRequest
};