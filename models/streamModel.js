const redis = require('../config/redis');
const config = require('../config');
const streamService = require('../services/streamService');

/**
 * Get all streams including main streams and iframe streams
 * @returns {Object} All available streams
 */
const getAllStreams = async () => {
    const streamUrl1 = await streamService.getStreamUrl(0);
    const streamUrl2 = await streamService.getStreamUrl(1);
    const engStream = config.streams.jioEngStream;
    const hinStream = config.streams.jioHinStream;
    
    // Get all iframe-related keys
    const [sourceUrl, m3u8SourceUrl, iframeUrl, iframeM3u8Url, iframeOrigin, iframeReferer] = 
        await redis.mget(['url', 'm3u8_url', 'iframe_url', 'iframe_m3u8_url', 'iframe_origin', 'iframe_referer']);
    
    // Get all available m3u8 URLs if they exist
    let iframeM3u8Urls = [];
    try {
        const urlsJson = await redis.get('iframe_m3u8_urls');
        if (urlsJson) {
            iframeM3u8Urls = JSON.parse(urlsJson);
        }
    } catch (error) {
        console.error('Error parsing iframe_m3u8_urls from Redis:', error);
    }
    
    return { 
        stream_url1: streamUrl1, 
        stream_url2: streamUrl2, 
        eng_jio: engStream, 
        hin_jio: hinStream, 
        source_url: sourceUrl, 
        m3u8_source_url: m3u8SourceUrl,
        iframe: {
            url: iframeUrl || config.defaultIframeUrl,
            m3u8_url: iframeM3u8Url,
            origin: iframeOrigin,
            referer: iframeReferer,
            available_streams: iframeM3u8Urls
        }
    };
};

/**
 * Get the source URL for streaming
 * @returns {String} The source URL for streaming
 */
const getSourceUrl = async () => {
    // Fetch URL from Redis
    const url = await redis.get('url');
    
    if (!url) {
        throw new Error('No URL found in Redis.');
    }
    
    return url;
};

/**
 * Update the streaming source URL
 * @param {String} newUrl - The new URL to set
 * @returns {Boolean} Whether the update was successful
 */
const updateSourceUrl = async (newUrl) => {
    try {
        await redis.set('url', newUrl);
        return true;
    } catch (error) {
        console.error('Error updating source URL:', error);
        return false;
    }
};

module.exports = {
    getAllStreams,
    getSourceUrl,
    updateSourceUrl
};