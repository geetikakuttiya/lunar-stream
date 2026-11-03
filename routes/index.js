const express = require('express');
const router = express.Router();
const streamRoutes = require('./streamRoutes');
const iframeRoutes = require('./iframeRoutes');
const configRoutes = require('./configRoutes');
const vlcRoutes = require('./vlcRoutes');
const playlistRoutes = require('./playlistRoutes');
const { checkRequest } = require('../middlewares/authMiddleware');

// Home route
router.get('/', (req, res) => {
    res.send('Hello World');
});

// Apply request check middleware to all routes
router.use(checkRequest);

// Mount route modules
router.use('/', streamRoutes);
router.use('/', iframeRoutes);
router.use('/', configRoutes);
router.use('/', vlcRoutes);
router.use('/', playlistRoutes);

module.exports = router;