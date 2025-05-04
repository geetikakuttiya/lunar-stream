const redis = require('../config/redis');
const config = require('../config');

/**
 * Get the current iframe URL
 * @returns {String} The current iframe URL
 */
const getIframeUrl = async () => {
    const iframeUrl = await redis.get('iframe_url');
    return iframeUrl || config.defaultIframeUrl;
};

/**
 * Get the current m3u8 URL from the iframe
 * @returns {String} The current m3u8 URL
 */
const getIframeM3u8Url = async () => {
    return await redis.get('iframe_m3u8_url');
};

/**
 * Get all available m3u8 URLs from the iframe
 * @returns {Array} Array of available m3u8 URLs
 */
const getIframeM3u8Urls = async () => {
    try {
        const urlsJson = await redis.get('iframe_m3u8_urls');
        if (urlsJson) {
            return JSON.parse(urlsJson);
        }
    } catch (error) {
        console.error('Error parsing iframe_m3u8_urls from Redis:', error);
    }
    return [];
};

/**
 * Update the iframe URL
 * @param {String} newUrl - The new iframe URL
 * @returns {Boolean} Whether the update was successful
 */
const updateIframeUrl = async (newUrl) => {
    try {
        await redis.set('iframe_url', newUrl);
        return true;
    } catch (error) {
        console.error('Error updating iframe URL:', error);
        return false;
    }
};

/**
 * Store the m3u8 URL from the iframe
 * @param {String} m3u8Url - The m3u8 URL to store
 * @returns {Boolean} Whether the storage was successful
 */
const storeIframeM3u8Url = async (m3u8Url) => {
    try {
        await redis.set('iframe_m3u8_url', m3u8Url);
        return true;
    } catch (error) {
        console.error('Error storing iframe m3u8 URL:', error);
        return false;
    }
};

module.exports = {
    getIframeUrl,
    getIframeM3u8Url,
    getIframeM3u8Urls,
    updateIframeUrl,
    storeIframeM3u8Url
};