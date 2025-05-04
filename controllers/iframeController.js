const iframeService = require('../services/iframeService');
const iframeModel = require('../models/iframeModel');
const config = require('../config');
const { updateFormView, iframeFormView } = require('../views/forms');

/**
 * Handle iframe stream extraction and redirection
 */


const getIframeStream = async (req, res) => {
    try {
        // Get iframe URL from Redis or use default
        const iframeUrl = await iframeModel.getIframeUrl();
        console.log("Using iframe URL:", iframeUrl);
        
        let selectUrlByIndex = parseInt(req.query.index) || 0;
        
        if (isNaN(selectUrlByIndex)) {
            selectUrlByIndex = 0;
        }
        
        // Extract m3u8 URLs from the iframe
        const { urls: m3u8Urls } = await iframeService.extractM3u8FromIframe(iframeUrl);
        
        if (m3u8Urls && m3u8Urls.length > 0) {
            // Use the selected index if valid, otherwise use the first URL
            const selectedIndex = (selectUrlByIndex >= 0 && selectUrlByIndex < m3u8Urls.length) 
                ? selectUrlByIndex : 0;
            
            const m3u8Url = m3u8Urls[selectedIndex];
            console.log(`Selected m3u8 URL (index ${selectedIndex + 1}):`, m3u8Url);
            
            // Store in Redis for future use
            await iframeModel.storeIframeM3u8Url(m3u8Url);
            
            // Redirect to the proxy endpoint
            res.redirect(`/iframe-proxy?url=${encodeURIComponent(m3u8Url)}`);
        } else {
            throw new Error('Could not extract m3u8 URL from iframe');
        }
    } catch (error) {
        console.error('Error extracting m3u8 from iframe:', error);
        res.status(500).json({ error: 'Failed to extract m3u8 from iframe', message: error.message });
    }
};

/**
 * Proxy m3u8 content with proper headers
 */
const proxyIframeContent = async (req, res) => {
    try {
        // Get URL from query or Redis
        let url = req.query.url;
        if (!url) {
            url = await iframeModel.getIframeM3u8Url();
            if (!url) {
                return res.status(400).send('No URL specified and none found in Redis');
            }
        }
        
        // Proxy the m3u8 content
        const { data, headers } = await iframeService.proxyM3u8Content(url);
        
        // Set appropriate headers for the response
        for (const [key, value] of Object.entries(headers)) {
            // Skip headers that might cause issues
            if (!['content-length', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
                res.setHeader(key, value);
            }
        }
        
        // Ensure content type is correct
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        
        // Send the m3u8 content
        res.send(data);
    } catch (error) {
        console.error('Error proxying m3u8 content:', error);
        res.status(500).send('Error proxying m3u8 content');
    }
};

/**
 * Get VLC-friendly stream
 */
const getIframeVlc = async (req, res) => {
    try {
        // Get URL from Redis or fetch a new one
        let url = await iframeModel.getIframeM3u8Url();
        
        // If no URL in Redis, redirect to the scraper endpoint
        if (!url) {
            return res.redirect('/iframe-stream');
        }
        
        // Redirect to the proxy with the URL
        res.redirect(`/iframe-proxy?url=${encodeURIComponent(url)}`);
    } catch (error) {
        console.error('Error getting iframe VLC stream:', error);
        res.status(500).send('Error getting iframe VLC stream');
    }
};

/**
 * Refresh iframe stream
 */
const refreshIframe = async (req, res) => {
    try {
        // Delete the cached URL
        await iframeModel.storeIframeM3u8Url('');
        
        // Redirect to the scraper endpoint
        res.redirect('/iframe-stream');
    } catch (error) {
        console.error('Error refreshing iframe:', error);
        res.status(500).send('Error refreshing iframe');
    }
};

/**
 * Update iframe URL
 */
const updateIframeUrl = async (req, res) => {
    const { new_url, auth_key } = req.body;

    // Validate the auth key
    const validAuthKey = config.auth.secret;
    if (auth_key !== validAuthKey) {
        return res.status(403).send('Invalid auth_key.');
    }

    if (!new_url) {
        return res.status(400).send('Please provide a new URL.');
    }

    try {
        // Update the iframe URL in Redis
        const updated = await iframeModel.updateIframeUrl(new_url);
        if (updated) {
            console.log(`iframe URL updated to: ${new_url}`);
            res.send(`iframe URL successfully updated to: ${new_url}`);
        } else {
            throw new Error('Failed to update iframe URL');
        }
    } catch (error) {
        console.error('Error updating iframe URL:', error);
        res.status(500).send('Error updating the iframe URL.');
    }
};

/**
 * Update iframe URL via GET (for testing)
 */
const updateIframeUrlGet = async (req, res) => {
    const new_url = req.query.url;
    
    if (!new_url) {
        return res.status(400).send('Please provide a URL parameter, e.g., ?url=https://example.com');
    }
    
    try {
        // Update the iframe URL in Redis
        const updated = await iframeModel.updateIframeUrl(new_url);
        if (updated) {
            console.log(`iframe URL updated to: ${new_url}`);
            res.send(`iframe URL successfully updated to: ${new_url}`);
        } else {
            throw new Error('Failed to update iframe URL');
        }
    } catch (error) {
        console.error('Error updating iframe URL:', error);
        res.status(500).send('Error updating the iframe URL.');
    }
};

/**
 * Get iframe update form
 */
const getIframeForm = (req, res) => {
    res.send(iframeFormView());
};

/**
 * Get source update form
 */
const getUpdateForm = (req, res) => {
    res.sendFile(process.cwd() + '/public/update-form.html');
};

module.exports = {
    getIframeStream,
    proxyIframeContent,
    getIframeVlc,
    refreshIframe,
    updateIframeUrl,
    updateIframeUrlGet,
    getIframeForm,
    getUpdateForm
};