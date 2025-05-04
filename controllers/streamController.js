const streamService = require('../services/streamService');
const streamModel = require('../models/streamModel');
const iframeModel = require('../models/iframeModel'); // Add this import
const config = require('../config');
const axios = require('axios');
const cheerio = require('cheerio');
const redis = require('../config/redis');
const { getBaseUrl } = require('../utils/helpers');
const { streamsView } = require('../views/streams');
const { updateFormView } = require('../views/forms');

/**
 * Handle the main streams page
 */
const getStreamsPage = async (req, res) => {
    try {
        const baseUrl = getBaseUrl(req);
        // Use iframeModel instead of streamModel for these iframe-specific functions
        const iframeM3u8Urls = await iframeModel.getIframeM3u8Urls();
        const iframeM3u8Url = await iframeModel.getIframeM3u8Url();
        
        // Render the streams view
        const html = streamsView(baseUrl, iframeM3u8Urls, iframeM3u8Url);
        res.send(html);
    } catch (error) {
        console.error('Error getting streams page:', error);
        res.status(500).send('Error getting streams page');
    }
};

/**
 * Get stream 1 (Akamai)
 */
const getStream1 = async (req, res) => {
    try {
        const streamUrl = await streamService.getStreamUrl(0);
        console.log("Stream URL:", streamUrl);

        if (!streamUrl) {
            return res.status(500).json({ error: 'Failed to fetch stream URL inside stream1' });
        }

        // Redirect VLC directly to the source stream
        res.redirect(streamUrl);
    } catch (error) {
        console.error('Error getting stream 1:', error);
        res.status(500).json({ error: 'Failed to fetch stream URL' });
    }
};

/**
 * Get stream 2 (Fastly)
 */
const getStream2 = async (req, res) => {
    try {
        const streamUrl = await streamService.getStreamUrl(1);
        console.log("Stream URL:", streamUrl);

        if (!streamUrl) {
            return res.status(500).json({ error: 'Failed to fetch stream URL inside stream2' });
        }

        // Redirect VLC directly to the source stream
        res.redirect(streamUrl);
    } catch (error) {
        console.error('Error getting stream 2:', error);
        res.status(500).json({ error: 'Failed to fetch stream URL' });
    }
};

/**
 * Get stream 3 (Jio Hindi)
 */
const getStream3 = async (req, res) => {
    try {
        const hinStream = config.streams.jioHinStream;
    
        if (!hinStream) {
            throw new Error('Failed to fetch stream URL in stream3 route');
        }
    
        // Redirect VLC directly to the source stream
        res.redirect(hinStream);
    } catch (err) {
        console.error('Error getting stream 3:', err);
        res.redirect(config.streams.soon);
    }
};

/**
 * Get stream 4 (Jio English)
 */
const getStream4 = async (req, res) => {
    try {
        const engStream = config.streams.jioEngStream;

        if (!engStream) {
            res.redirect(config.streams.soon);
            return res.status(500).json({ error: 'Failed to fetch stream URL' });
        }

        // Redirect VLC directly to the source stream
        res.redirect(engStream);
    } catch (error) {
        console.error('Error getting stream 4:', error);
        res.status(500).json({ error: 'Failed to fetch stream URL' });
    }
};

/**
 * Get source stream
 */
const getSource = async (req, res) => {
    try {
        // Fetch URL from Redis
        const url = await streamModel.getSourceUrl();

        // Fetch the HTML content of the website using Axios
        const response = await axios.get(url);
        const html = response.data;

        // Load the HTML into Cheerio
        const $ = cheerio.load(html);

        // Extract the m3u8 URL using a regular expression
        const m3u8Regex = /sources: \[\s*{[^}]*file:\s*"([^"]+)"[^}]*}/;
        const match = html.match(m3u8Regex);

        if (match && match[1]) {
            const m3u8Url = match[1]; // Extracted m3u8 link
            console.log('Extracted m3u8 link:', m3u8Url);
            await redis.set('m3u8_url', m3u8Url); // Store the m3u8 URL in Redis
            res.redirect(m3u8Url); // Redirect to the m3u8 URL
        } else {
            throw new Error('m3u8 link not found in the HTML.');
        }
    } catch (error) {
        const headers = req.headers;
        console.error('Error:', error);
        if (headers['user-agent'] && headers['user-agent'].includes("VLC")) {
            res.redirect(config.streams.soon);
        }
        else {
            res.status(500).send('Error fetching the website source code.');
        }
    }
};

/**
 * Update source URL
 */
const updateUrl = async (req, res) => {
    const { new_url, auth_key } = req.body;

    // Replace with your actual authentication logic
    const validAuthKey = config.auth.secret;

    if (auth_key !== validAuthKey) {
        return res.status(403).send('Invalid auth_key.');
    }

    if (!new_url) {
        return res.status(400).send('Please provide a new URL.');
    }

    try {
        // Update the URL in Redis
        const updated = await streamModel.updateSourceUrl(new_url);
        if (updated) {
            res.send(`URL successfully updated to: ${new_url}`);
        } else {
            throw new Error('Failed to update URL');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error updating the URL.');
    }
};

/**
 * Get stream debug info
 */
const getStreamDebug = async (req, res) => {
    try {
        const streams = await streamModel.getAllStreams();
        res.json(streams);
    } catch (error) {
        console.error('Error getting stream debug:', error);
        res.status(500).json({ error: 'Failed to get stream debug info' });
    }
};

/**
 * Get update form
 */
const getUpdateForm = (req, res) => {
    res.send(updateFormView());
};

module.exports = {
    getStreamsPage,
    getStream1,
    getStream2,
    getStream3,
    getStream4,
    getSource,
    updateUrl,
    getStreamDebug,
    getUpdateForm
};