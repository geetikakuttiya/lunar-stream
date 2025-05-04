const express = require('express');
const router = express.Router();
const iframeController = require('../controllers/iframeController');

// Iframe routes
router.get('/iframe-stream', iframeController.getIframeStream);
router.get('/iframe-proxy', iframeController.proxyIframeContent);
router.get('/iframe-vlc', iframeController.getIframeVlc);
router.get('/iframe-refresh', iframeController.refreshIframe);
router.post('/update-iframe-url', iframeController.updateIframeUrl);
router.get('/update-iframe-url', iframeController.updateIframeUrlGet);
router.get('/iframe-form', iframeController.getIframeForm);

module.exports = router;