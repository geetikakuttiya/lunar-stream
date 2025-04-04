const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;

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

// For completeness, also create a debug endpoint that shows the stream URL
app.get('/stream-debug', async (req, res) => {
    const ak_stream_url1 = await stream_url(0);
    const ak_stream_url2 = await stream_url(1);
    const eng_stream = jio_eng_stream;
    const hin_stream = jio_hin_stream;
    res.json({ stream_url1: ak_stream_url1, stream_url2: ak_stream_url2, eng_jio: eng_stream, hin_jio: hin_stream });
});

app.use((req, res) => {
    res.json({ value: "What are you searching for buddy?" });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



