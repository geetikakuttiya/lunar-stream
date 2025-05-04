const axios = require('axios');
const config = require('../config');
const { streams } = config;

/**
 * Fetch the lunar status information
 * @returns {Object|null} The lunar status data or null if error
 */
const getLunarStatus = async () => {
    try {
        const response = await axios.get(streams.lunarStatus);
        return response.data;
    } catch (error) {
        return null;
    }
};

/**
 * Fetch stream object from the given URL
 * @param {String} url - The URL to fetch the stream object from
 * @returns {Object|null} The stream object or null if error
 */
const getStreamObject = async (url) => {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        return null;
    }
};

/**
 * Get stream URL for the given server number
 * @param {Number} serverNo - The server number to use
 * @returns {String} The stream URL
 */
const getStreamUrl = async (serverNo) => {
    const streamStatus = await getLunarStatus();
    if (!streamStatus) {
        return streams.soon;
    }
    
    try {
        const streamPath = streamStatus["next_live_clip"]["config"];
        const streamObject = await getStreamObject(streamPath);
        const streamUrlJson = streamObject["request"]["files"]["hls"]["cdns"][streams.streamServers[serverNo]]["json_url"];
        const streamUrlResponse = await axios.get(streamUrlJson);
        const hlsUrl = streamUrlResponse.data['url'];

        return hlsUrl;
    } catch (error) {
        return streams.soon;
    }
};

module.exports = {
    getLunarStatus,
    getStreamObject,
    getStreamUrl
};