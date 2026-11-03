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

    const forwardedProto = req.headers['x-forwarded-proto'];
    const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : (forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http'));
    const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;

    return `${protocol}://${host}`;
}

module.exports = {
    getBaseUrl
};