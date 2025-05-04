const axios = require('axios');
const https = require('https');

// Create custom https agent that doesn't require valid certificates
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Common headers to mimic a browser
const COMMON_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': "https://userrr4591.ifrem.net",
    'Origin': "https://userrr4591.ifrem.net"
};

/**
 * Create a modified playlist that routes all segments through our proxy
 * @param {String} url - The m3u8 URL to proxy
 * @param {String} baseUrl - The base URL of our application
 * @returns {String} Modified playlist content
 */
const getProxiedPlaylist = async (url, baseUrl) => {
    try {
        const response = await axios.get(url, {
            headers: COMMON_HEADERS,
            httpsAgent
        });

        let playlist = response.data;

        // Rewrite all segment URLs to pass through /segment
        playlist = playlist.replace(/https?:\/\/[^ \n]*/g, segmentUrl => {
            return `${baseUrl}/vlc-segment?url=${encodeURIComponent(segmentUrl)}`;
        });

        return playlist;
    } catch (error) {
        console.error('Error proxying playlist:', error.message);
        throw error;
    }
};

/**
 * Stream a segment through our proxy with proper headers
 * @param {String} url - The segment URL
 * @returns {Object} Axios response object with the segment data
 */
const getProxiedSegment = async (url) => {
    try {
        return await axios.get(url, {
            responseType: 'arraybuffer',
            headers: COMMON_HEADERS,
            httpsAgent
        });
    } catch (error) {
        console.error('Error fetching segment:', error.message);
        throw error;
    }
};

module.exports = {
    getProxiedPlaylist,
    getProxiedSegment
};