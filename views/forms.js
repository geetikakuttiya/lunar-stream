/**
 * Generate HTML for iframe form
 * @returns {String} HTML content for iframe form
 */
const iframeFormView = () => {
    return `
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
    `;
};

/**
 * Generate HTML for update form (if needed - currently using static file)
 * @returns {String} HTML content for update form
 */
const updateFormView = () => {
    // This is a placeholder. In the original code, this uses a static HTML file
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Update Source URL</title>
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
        <h1>Update Source URL</h1>
        <div class="card">
            <form action="/update-url" method="post">
                <div class="form-group">
                    <label for="new_url">New Source URL:</label>
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
            <p><a href="/stream-debug">View Current Configuration</a></p>
        </div>
    </body>
    </html>
    `;
};

module.exports = {
    iframeFormView,
    updateFormView
};