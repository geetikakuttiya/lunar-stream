/**
 * Gets the base URL for the application
 * @param {Object} req - Express request object
 * @returns {String} The base URL
 */
function getBaseUrl(req) {
    // First try to use PUBLIC_URL env variable
    if (process.env.PUBLIC_URL) {
        return process.env.PUBLIC_URL.replace(/\/$/, ''); // Remove trailing slash if present
    }
    
    // Fallback to request protocol and host in development
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    return `${protocol}://${req.headers.host}`;
}

module.exports = {
    getBaseUrl
};