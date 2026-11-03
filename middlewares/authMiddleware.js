const config = require('../config');

const checkRequest = (req, res, next) => {
    // Always allow in development mode
    if (process.env.NODE_ENV !== "production") {
        return next();
    }

    const headers = req.headers;
    const isVlcRequest = headers['user-agent'] && headers['user-agent'].includes('VLC');
    const isAllowedPath = config.allowedPaths.some((allowedPath) => {
        if (req.path === allowedPath) {
            return true;
        }

        return req.path.startsWith(`${allowedPath}/`);
    });

    // Check if it's a VLC request or one of the allowed paths
    if (isVlcRequest || isAllowedPath) {
        return next();
    }

    // Block other requests in production
    res.status(403).send('You are not allowed to access this stream directly. Please use VLC or another media player.');
};

module.exports = {
    checkRequest
};