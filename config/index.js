require('dotenv').config();

module.exports = {
    port: process.env.PORT || 5000,
    environment: process.env.NODE_ENV || 'development',
    auth: {
        secret: process.env.AUTH_SECRET || ""
    },
    streams: {
        soon: "https://static.vecteezy.com/system/resources/previews/048/479/658/mp4/text-with-coming-soon-effect-glitch-on-black-background-free-video.mp4",
        lunarStatus: process.env.CONFIG_URL || '',
        jioHinStream: process.env.JIO_STREAM_HIN || "https://static.vecteezy.com/system/resources/previews/048/479/658/mp4/text-with-coming-soon-effect-glitch-on-black-background-free-video.mp4",
        jioEngStream: process.env.JIO_STREAM_ENG || "https://static.vecteezy.com/system/resources/previews/048/479/658/mp4/text-with-coming-soon-effect-glitch-on-black-background-free-video.mp4",
        streamServers: ["akamai_live", "fastly_live"]
    },
    publicUrl: process.env.PUBLIC_URL || '',
    defaultIframeUrl: "https://user4580.ifrem.net/iframe/frame.php",
    allowedPaths: [
        "/update-url", 
        "/update-form", 
        "/iframe-form",
        "/xyzstream", 
        "/stream-debug",
        "/streams",
        "/iframe-refresh",
        "/update-iframe-url",
        "/vlc-iframe",    // Add this
        "/vlc-playlist",  // Add this
        "/vlc-segment"    // Add this
    ]
};