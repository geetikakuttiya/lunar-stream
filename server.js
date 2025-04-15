const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const cheerio = require('cheerio');
const redis = require('./lib/redis.js');
const app = express();
const PORT = process.env.PORT || 5000;

const stream_soon = "https://static.vecteezy.com/system/resources/previews/048/479/658/mp4/text-with-coming-soon-effect-glitch-on-black-background-free-video.mp4"
const AUTH_SECRET = process.env.AUTH_SECRET || "";
const lunar_status = process.env.CONFIG_URL || '';
const jio_hin_stream = process.env.JIO_STREAM_HIN || stream_soon;
const jio_eng_stream = process.env.JIO_STREAM_ENG || stream_soon;
const stream_server = ["akamai_live", "fastly_live"]


function getBaseUrl(req) {
    // First try to use PUBLIC_URL env variable
    if (process.env.PUBLIC_URL) {
        return process.env.PUBLIC_URL.replace(/\/$/, ''); // Remove trailing slash if present
    }
    
    // Fallback to request protocol and host in development
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    return `${protocol}://${req.headers.host}`;
}

const check_request = (req, res, next) => {
    // Always allow in development mode
    if (process.env.NODE_ENV !== "production") {
        return next();
    }
    
    // In production, check for specific paths or VLC user-agent
    const headers = req.headers;
    const allowedPaths = [
        "/update-url", 
        "/update-form", 
        "/iframe-form",
        "/xyzstream", 
        "/stream-debug",
        "/streams",
        "/iframe-refresh",
        "/update-iframe-url"
    ];
    
    // Check if it's a VLC request or one of the allowed paths
    if (headers['user-agent'] && headers['user-agent'].includes("VLC") || 
        allowedPaths.includes(req.path)) {
        return next();
    }
    
    // Block other requests in production
    res.status(403).send('You are not allowed to access this stream directly. Please use VLC or another media player.');
}

const lunar_dynamic_url = async () => {
    try {
        const response = await axios.get(lunar_status);
        return response.data;
    } catch (error) {
        // console.error('Error fetching stream status:', error);
        return null;
        
    }
}

const get_stream_object = async (url) => {
    try {
        const response = await axios.get(url);
        const stream_url = response.data;
        return stream_url;
    } catch (error) {
        // console.error('Error fetching stream URL:', error);
        return null;
    }
}

const stream_url = async (server_no) => {
    const streamStatus = await lunar_dynamic_url();
    if (!streamStatus) {
        // console.error('Error fetching stream status: Stream status is null');
        return stream_soon;
    }
    try {
        const stream_path = streamStatus["next_live_clip"]["config"]
        const stream_object = await get_stream_object(stream_path);
        const stream_url_json = stream_object["request"]["files"]["hls"]["cdns"][stream_server[server_no]]["json_url"];
        const stream_url = await axios.get(stream_url_json)
        const hsl_url = stream_url.data['url'];

        return hsl_url;

    } catch (error) {
        // console.error('Error fetching stream URL:', error);
        return "https://static.vecteezy.com/system/resources/previews/048/479/658/mp4/text-with-coming-soon-effect-glitch-on-black-background-free-video.mp4";
    }



}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // To serve static files like the HTML form

// Serve the form on a specific route
app.get('/update-form', (req, res) => {
    res.sendFile(__dirname + '/public/update-form.html');
});

app.get('/', (req, res) => {
    res.send('Hello World');
})

app.use(check_request); // Apply the middleware to all routes

app.get('/xyzstream', (req, res) => {
    res.json({
        config: {
            path: {
                stream1: "akamai",
                stream2: "fastify",
                stream3: "jio_hotstar",
                stream4: "dead",
                source: "dynamic",
                "update-url": "update source url",
                "stream-debug": "debug",
            }
        }
    });
})

app.get('/stream1', async (req, res) => {
    const ak_stream_url = await stream_url(0);
    console.log("Stream URL:", ak_stream_url);

    if (!ak_stream_url) {
        return res.status(500).json({ error: 'Failed to fetch stream URL inside stream1' });
    }

    // Redirect VLC directly to the source stream
    // This simple approach often works better for VLC
    res.redirect(ak_stream_url);
    return null;
});

app.get('/stream2', async (req, res) => {
    const ak_stream_url = await stream_url(1);
    console.log("Stream URL:", ak_stream_url);

    if (!ak_stream_url) {
        return res.status(500).json({ error: 'Failed to fetch stream URL inside stream2' });
    }

    // Redirect VLC directly to the source stream
    // This simple approach often works better for VLC
    res.redirect(ak_stream_url);
    return null;
});

app.get('/stream3', async (req, res) => {
    // const ak_stream_url = await stream_url(1);
    // console.log("Stream URL:", ak_stream_url);
    try{
        // const demo = await axios.get(jio_hin_stream);
        // console.log("sahdva:", demo)

        const hin_stream = jio_hin_stream;
    
        if (!hin_stream) {
            throw new Error('Failed to fetch stream URL in stream3 route');
            // return res.status(500).json({ error: 'Failed to fetch stream URL' });
        }
    
        // Redirect VLC directly to the source stream
        // This simple approach often works better for VLC
        res.redirect(hin_stream);
    }catch(err){
        res.redirect(stream_soon)
        return null;
    }
});

app.get('/stream4', async (req, res) => {
    // const ak_stream_url = await stream_url(1);
    // console.log("Stream URL:", ak_stream_url);
    const eng_stream = jio_eng_stream;

    if (!eng_stream) {
        res.redirect(stream_soon)
        return res.status(500).json({ error: 'Failed to fetch stream URL' });
    }

    // Redirect VLC directly to the source stream
    // This simple approach often works better for VLC
    res.redirect(eng_stream);
});

app.get('/source', async (req, res) => {
    try {
        // Fetch URL from Redis
        const url = await redis.get('url');  // Fetching the URL stored with the key 'url'

        if (!url) {
            throw new Error('No URL found in Redis. inside /source route');
            // return res.status(400).send('No URL found in Redis.');
        }

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
            // res.status(404).send('m3u8 link not found.');
        }
    } catch (error) {
        const headers = req.headers;
        // console.error('Error:', error);
        if (headers['user-agent'].includes("VLC")) {
            res.redirect(stream_soon);
        }
        else {
            res.status(500).send('Error fetching the website source code.');
        }
    }
});

// Route to update the URL in Redis
app.post('/update-url', async (req, res) => {
    const { new_url, auth_key } = req.body;

    // Replace with your actual authentication logic
    const validAuthKey = AUTH_SECRET;  // Example auth_key for validation

    if (auth_key !== validAuthKey) {
        return res.status(403).send('Invalid auth_key.');
    }

    if (!new_url) {
        return res.status(400).send('Please provide a new URL.');
    }

    try {
        // Update the URL in Redis
        await redis.set('url', new_url);
        res.send(`URL successfully updated to: ${new_url}`);
    } catch (error) {
        // console.error('Error:', error);
        res.status(500).send('Error updating the URL.');
    }
});

// Scrape and stream from iframe
app.get('/iframe-stream', async (req, res) => {
    // Get iframe URL from Redis or use default
    const iframeUrl = await redis.get('iframe_url') || "https://user4580.ifrem.net/iframe/frame.php";
    console.log("Using iframe URL:", iframeUrl);
    
    let select_url_by_index = parseInt(req.query.index) || 0; // Default to 1 if not provided
    
    if (isNaN(select_url_by_index)) {
        select_url_by_index = 0;
    }
    
    try {
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
        // const m3u8Match = html.match(/source\s+src=['"]([^'"]+\.m3u8[^'"]*)['"]/ig);
        const m3u8Match = html.match(m3u8Regex);
        // console.log("m3u8Match:", m3u8Match);   
        
        if (m3u8Match && m3u8Match.length > 0) {
            // Extract URLs from the matches
            const m3u8Urls = m3u8Match.map((match) => {
                const url = match; // Use the match directly
                // console.log("m3u8Urls:", url);
                return url;
            });

            // Store all available streams
            await redis.set('iframe_m3u8_urls', JSON.stringify(m3u8Urls));
            
            // Use the selected index if valid, otherwise use the first URL
            const selectedIndex = (select_url_by_index >= 0 && select_url_by_index < m3u8Urls.length) 
                ? select_url_by_index : 0;
            
            const m3u8Url = m3u8Urls[selectedIndex];
            // console.log('Available m3u8 URLs:', m3u8Urls);
            console.log(`Selected m3u8 URL (index ${selectedIndex + 1}):`, m3u8Url);
            
            // Store in Redis for future use
            await redis.set('iframe_m3u8_url', m3u8Url);
            
            // Redirect to the proxy endpoint
            res.redirect(`/iframe-proxy?url=${encodeURIComponent(m3u8Url)}`);
        } else {
            throw new Error('Could not extract m3u8 URL from iframe');
        }
    } catch (error) {
        console.error('Error extracting m3u8 from iframe:', error);
        res.status(500).json({ error: 'Failed to extract m3u8 from iframe', message: error.message });
    }
});

// Proxy endpoint for m3u8 content
app.get('/iframe-proxy', async (req, res) => {
    try {
        // Get URL from query or Redis
        let url = req.query.url;
        if (!url) {
            url = await redis.get('iframe_m3u8_url');
            if (!url) {
                return res.status(400).send('No URL specified and none found in Redis');
            }
        }
        
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
        
        // Set appropriate headers for the response
        for (const [key, value] of Object.entries(response.headers)) {
            // Skip headers that might cause issues
            if (!['content-length', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
                res.setHeader(key, value);
            }
        }
        
        // Ensure content type is correct
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        
        // Send the m3u8 content
        res.send(response.data);
        
    } catch (error) {
        console.error('Error proxying m3u8 content:', error);
        res.status(500).send('Error proxying m3u8 content');
    }
});

// VLC-friendly endpoint for the iframe stream
app.get('/iframe-vlc', async (req, res) => {
    // Get URL from Redis or fetch a new one
    let url = await redis.get('iframe_m3u8_url');
    
    // If no URL in Redis, redirect to the scraper endpoint
    if (!url) {
        return res.redirect('/iframe-stream');
    }
    
    // Redirect to the proxy with the URL
    res.redirect(`/iframe-proxy?url=${encodeURIComponent(url)}`);
});

// Add a refresh endpoint to force a new scrape
app.get('/iframe-refresh', async (req, res) => {
    // Delete the cached URL
    await redis.del('iframe_m3u8_url');
    
    // Redirect to the scraper endpoint
    res.redirect('/iframe-stream');
});

// Update the debug endpoint to include all iframe-related URLs
app.get('/stream-debug', async (req, res) => {
    const ak_stream_url1 = await stream_url(0);
    const ak_stream_url2 = await stream_url(1);
    const eng_stream = jio_eng_stream;
    const hin_stream = jio_hin_stream;
    
    // Get all iframe-related keys
    const [source_url, m3u8_source_url, iframe_url, iframe_m3u8_url, iframe_origin, iframe_referer] = 
        await redis.mget(['url', 'm3u8_url', 'iframe_url', 'iframe_m3u8_url', 'iframe_origin', 'iframe_referer']);
    
    // Get all available m3u8 URLs if they exist
    let iframe_m3u8_urls = [];
    try {
        const urlsJson = await redis.get('iframe_m3u8_urls');
        if (urlsJson) {
            iframe_m3u8_urls = JSON.parse(urlsJson);
        }
    } catch (error) {
        console.error('Error parsing iframe_m3u8_urls from Redis:', error);
    }
    
    res.json({ 
        stream_url1: ak_stream_url1, 
        stream_url2: ak_stream_url2, 
        eng_jio: eng_stream, 
        hin_jio: hin_stream, 
        source_url, 
        m3u8_source_url,
        iframe: {
            url: iframe_url || "https://user4580.ifrem.net/iframe/frame.php",
            m3u8_url: iframe_m3u8_url,
            origin: iframe_origin,
            referer: iframe_referer,
            available_streams: iframe_m3u8_urls
        }
    });
});


app.get('/streams', async (req, res) => {
    // Get the base URL for this request
    const baseUrl = getBaseUrl(req);
    
    // Get iframe m3u8 URLs if available
    let iframe_m3u8_urls = [];
    try {
        const urlsJson = await redis.get('iframe_m3u8_urls');
        if (urlsJson) {
            iframe_m3u8_urls = JSON.parse(urlsJson);
        }
    } catch (error) {
        console.error('Error parsing iframe_m3u8_urls from Redis:', error);
    }
    
    // Get the current iframe m3u8 URL
    const iframe_m3u8_url = await redis.get('iframe_m3u8_url');
    
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Stream Options</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 16px 0; }
            .btn { display: inline-block; background: #4CAF50; color: white; padding: 10px 15px; 
                  text-decoration: none; border-radius: 4px; margin: 5px 0; }
            .btn-small { padding: 5px 10px; font-size: 0.8em; }
            .copy-btn { background: #2196F3; color: white; border: none; padding: 5px 10px; 
                       border-radius: 4px; cursor: pointer; margin-left: 10px; }
            .vlc-btn { background: #FF8800; color: white; padding: 5px 10px; 
                      text-decoration: none; border-radius: 4px; margin-left: 10px; }
            .toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                   background-color: #333; color: white; padding: 10px 20px; border-radius: 4px;
                   display: none; z-index: 100; }
            code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; word-break: break-all; }
            .url-container { display: flex; align-items: center; margin: 10px 0; }
            .url-text { flex-grow: 1; word-break: break-all; }
            .status { color: #4CAF50; margin-left: 10px; }
            .env-info { background: #f8f8f8; padding: 5px; border-radius: 3px; font-size: 0.8em; color: #666; }
        </style>
    </head>
    <body>
        <h1>Available Streams</h1>
        
        <div class="env-info">
            Environment: ${process.env.NODE_ENV || 'development'} | 
            Base URL: ${baseUrl}
        </div>
        
        <div class="card">
            <h2>Main Streams</h2>
            
            <div class="url-container">
                <a class="btn" href="/stream1">Stream 1 (Akamai)</a>
                <button class="copy-btn" onclick="copyToClipboard('${baseUrl}/stream1')">Copy URL</button>
            </div>
            
            <div class="url-container">
                <a class="btn" href="/stream2">Stream 2 (Fastly)</a>
                <button class="copy-btn" onclick="copyToClipboard('${baseUrl}/stream2')">Copy URL</button>
            </div>
            
            <div class="url-container">
                <a class="btn" href="/stream3">Stream 3 (Jio Hindi)</a>
                <button class="copy-btn" onclick="copyToClipboard('${baseUrl}/stream3')">Copy URL</button>
            </div>
            
            <div class="url-container">
                <a class="btn" href="/stream4">Stream 4 (Jio English)</a>
                <button class="copy-btn" onclick="copyToClipboard('${baseUrl}/stream4')">Copy URL</button>
            </div>
            
            <p>For VLC, open Network Stream and enter:<br>
            <code>${baseUrl}/stream1</code> or any other stream number</p>
        </div>
        
        <div class="card">
            <h2>iFrame Stream for VLC</h2>
            
            ${iframe_m3u8_urls.length > 0 ? `
                <p>Choose a stream to open in VLC:</p>
                <div class="url-container">
                    ${iframe_m3u8_urls.map((url, index) => `
                        <a class="vlc-btn" href="/iframe-stream?index=${index}">Stream ${index + 1}</a>
                    `).join('')}
                </div>
                
                <p>Copy VLC links:</p>
                <div class="url-container">
                    <div class="url-text">
                        <code>${baseUrl}/iframe-vlc</code> (Current stream)
                    </div>
                    <button class="copy-btn" onclick="copyToClipboard('${baseUrl}/iframe-vlc')">Copy URL</button>
                </div>
                
                ${iframe_m3u8_urls.map((url, index) => `
                    <div class="url-container">
                        <div class="url-text">
                            <code>${baseUrl}/iframe-stream?index=${index}</code> (Stream ${index + 1})
                        </div>
                        <button class="copy-btn" onclick="copyToClipboard('${baseUrl}/iframe-stream?index=${index}')">Copy URL</button>
                    </div>
                `).join('')}
            ` : `
                <p>No streams available. <a href="/iframe-refresh">Refresh iframe streams</a> first.</p>
            `}
            
            <p><a class="btn" href="/iframe-refresh">Refresh iFrame Streams</a></p>
        </div>
        
        <div class="card">
            <h2>Current Active Stream</h2>
            ${iframe_m3u8_url ? `
                <p>Currently active: Stream ${iframe_m3u8_urls.indexOf(iframe_m3u8_url) + 1}</p>
            ` : `
                <p>No active stream. Please select one from above.</p>
            `}
        </div>
        
        <div class="card">
            <h2>Configuration</h2>
            <p><a class="btn" href="/iframe-form">Update iFrame URL</a></p>
            <p><a class="btn" href="/update-form">Update Source URL</a></p>
        </div>
        
        <div class="card">
            <h2>Debug</h2>
            <p><a href="/stream-debug">View Stream Debug Info</a></p>
        </div>

        <div id="toast" class="toast">URL copied to clipboard!</div>
        
        <script>
            function copyToClipboard(text) {
                // Create a temporary input element
                const input = document.createElement('input');
                input.style.position = 'fixed';
                input.style.opacity = 0;
                input.value = text;
                document.body.appendChild(input);
                
                // Select and copy the text
                input.select();
                document.execCommand('copy');
                
                // Remove the temporary input
                document.body.removeChild(input);
                
                // Show toast notification
                const toast = document.getElementById('toast');
                toast.style.display = 'block';
                
                // Hide toast after 2 seconds
                setTimeout(() => {
                    toast.style.display = 'none';
                }, 2000);
            }
        </script>
    </body>
    </html>
    `);
});

// Add this new endpoint to update the iframe URL
app.post('/update-iframe-url', async (req, res) => {
    const { new_url, auth_key } = req.body;

    // Validate the auth key
    const validAuthKey = AUTH_SECRET;
    if (auth_key !== validAuthKey) {
        return res.status(403).send('Invalid auth_key.');
    }

    if (!new_url) {
        return res.status(400).send('Please provide a new URL.');
    }

    try {
        // Update the iframe URL in Redis
        await redis.set('iframe_url', new_url);
        console.log(`iframe URL updated to: ${new_url}`);
        res.send(`iframe URL successfully updated to: ${new_url}`);
    } catch (error) {
        console.error('Error updating iframe URL:', error);
        res.status(500).send('Error updating the iframe URL.');
    }
});

// Add a GET endpoint to update iframe URL for testing
app.get('/update-iframe-url', async (req, res) => {
    const new_url = req.query.url;
    
    if (!new_url) {
        return res.status(400).send('Please provide a URL parameter, e.g., ?url=https://example.com');
    }
    
    try {
        // Update the iframe URL in Redis
        await redis.set('iframe_url', new_url);
        console.log(`iframe URL updated to: ${new_url}`);
        res.send(`iframe URL successfully updated to: ${new_url}`);
    } catch (error) {
        console.error('Error updating iframe URL:', error);
        res.status(500).send('Error updating the iframe URL.');
    }
});

// Add a form to update the iframe URL
app.get('/iframe-form', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Update iframe URL</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; }
            input[type="text"] { width: 100%; padding: 8px; box-sizing: border-box; }
            input[type="password"] { width: 100%; padding: 8px; box-sizing: border-box; }
            button { background: #4CAF50; color: white; border: none; padding: 10px 15px; 
                   border-radius: 4px; cursor: pointer; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 16px 0; }
        </style>
    </head>
    <body>
        <h1>Update iframe URL</h1>
        <div class="card">
            <form action="/update-iframe-url" method="post">
                <div class="form-group">
                    <label for="new_url">New iframe URL:</label>
                    <input type="text" id="new_url" name="new_url" required>
                </div>
                <div class="form-group">
                    <label for="auth_key">Auth Key:</label>
                    <input type="password" id="auth_key" name="auth_key" required>
                </div>
                <button type="submit">Update URL</button>
            </form>
        </div>

        <div class="card">
            <h2>Current Config</h2>
            <p>Default iframe URL: <code>https://user4580.ifrem.net/iframe/frame.php</code></p>
            <p><a href="/stream-debug">View Current Configuration</a></p>
        </div>
    </body>
    </html>
    `);
});

app.use((req, res) => {
    res.json({ value: "What are you searching for buddy?" });
});


app.listen(PORT, async () => {
    try {
        await redis.connectToRedis().then(() => {
            // console.log('Connected to Redis');
            console.log(`Server is running on port ${PORT}`);
        })
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
        process.exit(1); // Exit the process if Redis connection fails
    }
});


