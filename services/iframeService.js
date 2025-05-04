const axios = require('axios');
const cheerio = require('cheerio');
const redis = require('../config/redis');
const config = require('../config');

/**
 * Extracts m3u8 URLs from iframe content
 * @param {String} iframeUrl - The iframe URL to fetch
 * @returns {Object} Object containing extracted m3u8 URLs and metadata
 */
const extractM3u8FromIframe = async (iframeUrl) => {
    // Extract domain for referer and origin headers
    const urlObj = new URL(iframeUrl);
    const origin = `${urlObj.protocol}//${urlObj.hostname}`;
    const referer = iframeUrl;
    
    // Store these for proxy use
    await redis.set('iframe_origin', origin);
    await redis.set('iframe_referer', referer);
    
    // Fetch the iframe content
    const response = await axios.get(iframeUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': referer,
            'Origin': origin
        }
    });
    
    const html = response.data;

    // Load the HTML into Cheerio
    const $ = cheerio.load(html);
    
    // Extract m3u8 URL using regex
    const m3u8Regex = /https:\/\/[a-zA-Z0-9.-]+\/[a-zA-Z0-9\/.-]+\.m3u8(?:\?[a-zA-Z0-9=&~_-]*)?/g;
    const m3u8Match = html.match(m3u8Regex);
    
    if (m3u8Match && m3u8Match.length > 0) {
        // Extract URLs from the matches
        const m3u8Urls = m3u8Match.map(match => match);

        // Store all available streams
        await redis.set('iframe_m3u8_urls', JSON.stringify(m3u8Urls));
        
        return {
            urls: m3u8Urls,
            origin,
            referer
        };
    }
    
    throw new Error('Could not extract m3u8 URL from iframe');
};

/**
 * Proxy m3u8 content with proper headers
 * @param {String} url - The URL to proxy
 * @returns {Object} Object containing response data and headers
 */
const proxyM3u8Content = async (url) => {
    // Get origin and referer from Redis or use defaults
    const origin = await redis.get('iframe_origin') || 'https://user4580.ifrem.net';
    const referer = await redis.get('iframe_referer') || 'https://user4580.ifrem.net/iframe/frame.php';
    
    console.log('Proxying m3u8 content from:', url);
    console.log('Using origin:', origin);
    console.log('Using referer:', referer);
    
    // Fetch the m3u8 content with proper headers
    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'arraybuffer',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': origin,
            'Referer': referer
        }
    });
    
    return {
        data: response.data,
        headers: response.headers
    };
};

module.exports = {
    extractM3u8FromIframe,
    proxyM3u8Content
};