const iframeService = require('../services/iframeService');
const iframeModel = require('../models/iframeModel');
const vlcStreamService = require('../services/vlcStreamService');
const { getBaseUrl } = require('../utils/helpers');

/**
 * Handle VLC-optimized iframe streaming
 */
const getVlcIframeStream = async (req, res) => {
    try {
        // Get iframe URL from Redis or use default
        const iframeUrl = await iframeModel.getIframeUrl();
        console.log("Using iframe URL for VLC:", iframeUrl);
        
        // Get m3u8 URLs from the iframe
        const { urls: m3u8Urls } = await iframeService.extractM3u8FromIframe(iframeUrl);
        
        if (!m3u8Urls || m3u8Urls.length === 0) {
            return res.status(404).send('No M3U8 URLs found in iframe');
        }
        
        // Select URL by index if provided, otherwise use first one
        const selectUrlByIndex = parseInt(req.query.index) || 0;
        const selectedIndex = (selectUrlByIndex >= 0 && selectUrlByIndex < m3u8Urls.length) 
            ? selectUrlByIndex : 0;
        
        const m3u8Url = m3u8Urls[selectedIndex];
        console.log(`Selected m3u8 URL for VLC (index ${selectedIndex}):`, m3u8Url);
        
        // Store this URL for future use
        await iframeModel.storeIframeM3u8Url(m3u8Url);
        
        // Redirect to the VLC playlist endpoint
        res.redirect(`/vlc-playlist?url=${encodeURIComponent(m3u8Url)}`);
    } catch (error) {
        console.error('VLC iframe stream error:', error.message);
        res.status(500).send(`Error: ${error.message}`);
    }
};

/**
 * Provide a VLC-friendly playlist with proxied segment URLs
 */
const getVlcPlaylist = async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) {
            // Try to get URL from Redis if not provided
            const cachedUrl = await iframeModel.getIframeM3u8Url();
            if (!cachedUrl) {
                return res.status(400).send('No URL provided and none found in cache');
            }
            return res.redirect(`/vlc-playlist?url=${encodeURIComponent(cachedUrl)}`);
        }
        
        // Get the base URL for our server
        const baseUrl = getBaseUrl(req);
        
        // Get proxied playlist
        const playlist = await vlcStreamService.getProxiedPlaylist(url, baseUrl);
        
        // Set appropriate headers
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        
        // Send the modified playlist
        res.send(playlist);
    } catch (error) {
        console.error('VLC playlist error:', error.message);
        res.status(500).send(`Error: ${error.message}`);
    }
};

/**
 * Proxy video segments for VLC
 */
const getVlcSegment = async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) {
            return res.status(400).send('Missing URL parameter');
        }
        
        // Proxy the segment
        const response = await vlcStreamService.getProxiedSegment(url);
        
        // Set response headers based on the proxied response
        Object.entries(response.headers).forEach(([key, value]) => {
            // Exclude problematic headers
            if (!['content-length', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
                res.setHeader(key, value);
            }
        });
        
        // Ensure proper content type based on URL extension
        if (url.endsWith('.ts')) {
            res.setHeader('Content-Type', 'video/MP2T');
        } else if (url.endsWith('.m3u8')) {
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        } else {
            res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
        }
        
        // Send the segment data
        res.send(Buffer.from(response.data));
    } catch (error) {
        console.error('VLC segment error:', error.message);
        res.status(500).send(`Error: ${error.message}`);
    }
};

module.exports = {
    getVlcIframeStream,
    getVlcPlaylist,
    getVlcSegment
};