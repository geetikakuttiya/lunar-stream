const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const cheerio = require('cheerio');
const redis = require('./lib/redis.js');
const app = express();
const PORT = process.env.PORT || 5000;

const AUTH_SECRET = process.env.AUTH_SECRET || "";
const lunar_status = process.env.CONFIG_URL || '';
const jio_hin_stream = process.env.JIO_STREAM_HIN || '';
const jio_eng_stream = process.env.JIO_STREAM_ENG || '';
const stream_server = ["akamai_live", "fastly_live"]

const lunar_dynamic_url = async () => {
    try {
        const response = await axios.get(lunar_status);
        return response.data;
    } catch (error) {
        console.error('Error fetching stream status:', error);
        return null;
    }
}

const get_stream_object = async (url) => {
    try {
        const response = await axios.get(url);
        const stream_url = response.data;
        return stream_url;
    } catch (error) {
        console.error('Error fetching stream URL:', error);
        return null;
    }
}

const stream_url = async (server_no) => {
    const streamStatus = await lunar_dynamic_url();
    if (!streamStatus) {
        return null;
    }
    try {
        const stream_path = streamStatus["next_live_clip"]["config"]
        const stream_object = await get_stream_object(stream_path);
        const stream_url = stream_object["request"]["files"]["hls"]["cdns"][stream_server[server_no]]["url"];
        return stream_url;

    } catch (error) {
        console.error('Error fetching stream URL:', error);
        return null;
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

app.get('/xyzstream', (req, res) => {
    res.json({
        config: {
            path: {
                stream1: "akamai",
                stream2: "fastify",
                "stream-debug": "debug"
            }
        }
    });
})

app.get('/stream1', async (req, res) => {
    const ak_stream_url = await stream_url(0);
    console.log("Stream URL:", ak_stream_url);

    if (!ak_stream_url) {
        return res.status(500).json({ error: 'Failed to fetch stream URL' });
    }

    // Redirect VLC directly to the source stream
    // This simple approach often works better for VLC
    res.redirect(ak_stream_url);
});
app.get('/stream2', async (req, res) => {
    const ak_stream_url = await stream_url(1);
    console.log("Stream URL:", ak_stream_url);

    if (!ak_stream_url) {
        return res.status(500).json({ error: 'Failed to fetch stream URL' });
    }

    // Redirect VLC directly to the source stream
    // This simple approach often works better for VLC
    res.redirect(ak_stream_url);
});

app.get('/stream3', async (req, res) => {
    // const ak_stream_url = await stream_url(1);
    // console.log("Stream URL:", ak_stream_url);
    const hin_stream = jio_hin_stream;

    if (!hin_stream) {
        return res.status(500).json({ error: 'Failed to fetch stream URL' });
    }

    // Redirect VLC directly to the source stream
    // This simple approach often works better for VLC
    res.redirect(hin_stream);
});

app.get('/stream4', async (req, res) => {
    // const ak_stream_url = await stream_url(1);
    // console.log("Stream URL:", ak_stream_url);
    const eng_stream = jio_eng_stream;

    if (!eng_stream) {
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
            return res.status(400).send('No URL found in Redis.');
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
            res.status(404).send('m3u8 link not found.');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error fetching the website source code.');
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
        console.error('Error:', error);
        res.status(500).send('Error updating the URL.');
    }
});


// For completeness, also create a debug endpoint that shows the stream URL
app.get('/stream-debug', async (req, res) => {
    const ak_stream_url1 = await stream_url(0);
    const ak_stream_url2 = await stream_url(1);
    const eng_stream = jio_eng_stream;
    const hin_stream = jio_hin_stream;
    const source_url = await redis.get('url');
    const m3u8_source_url = await redis.get('m3u8_url');  // Fetching the m3u8 URL stored with the key 'm3u8_url'

    res.json({ stream_url1: ak_stream_url1, stream_url2: ak_stream_url2, eng_jio: eng_stream, hin_jio: hin_stream, source_url, m3u8_source_url });
});

app.use((req, res) => {
    res.json({ value: "What are you searching for buddy?" });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



