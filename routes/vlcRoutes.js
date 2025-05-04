const express = require('express');
const router = express.Router();
const vlcController = require('../controllers/vlcController');

// VLC-optimized routes
router.get('/vlc-iframe', vlcController.getVlcIframeStream);
router.get('/vlc-playlist', vlcController.getVlcPlaylist);
router.get('/vlc-segment', vlcController.getVlcSegment);

module.exports = router;