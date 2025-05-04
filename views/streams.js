/**
 * Generate HTML for streams page
 * @param {String} baseUrl - Base URL of the application
 * @param {Array} iframeM3u8Urls - Array of available iframe m3u8 URLs
 * @param {String} iframeM3u8Url - Currently active iframe m3u8 URL
 * @returns {String} HTML content for streams page
 */
const streamsView = (baseUrl, iframeM3u8Urls, iframeM3u8Url) => {
    return `
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
            
            ${iframeM3u8Urls.length > 0 ? `
                <p>Choose a stream to open in VLC:</p>
                <div class="url-container">
                    ${iframeM3u8Urls.map((url, index) => `
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
                
                ${iframeM3u8Urls.map((url, index) => `
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
            <h2>VLC-Optimized iFrame Streams</h2>
            
            <p>For reliable playback in VLC, use these optimized links:</p>
            <div class="url-container">
                <a class="btn" href="/vlc-iframe">Direct VLC Stream</a>
                <button class="copy-btn" onclick="copyToClipboard('${baseUrl}/vlc-iframe')">Copy URL</button>
            </div>
            
            ${iframeM3u8Urls.length > 0 ? `
                <p>Choose a specific stream for VLC:</p>
                <div class="url-container">
                    ${iframeM3u8Urls.map((url, index) => `
                        <a class="vlc-btn" href="/vlc-iframe?index=${index}">VLC Stream ${index + 1}</a>
                    `).join('')}
                </div>
            ` : ''}
            
            <p>For best results with VLC:</p>
            <ol>
                <li>Open VLC</li>
                <li>Media > Open Network Stream</li>
                <li>Enter: <code>${baseUrl}/vlc-iframe</code></li>
                <li>Click "Play"</li>
            </ol>
        </div>
        
        <div class="card">
            <h2>Current Active Stream</h2>
            ${iframeM3u8Url ? `
                <p>Currently active: Stream ${iframeM3u8Urls.indexOf(iframeM3u8Url) + 1}</p>
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
    `;
};

module.exports = {
    streamsView
};