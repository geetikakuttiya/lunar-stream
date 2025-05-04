const express = require('express');
const router = express.Router();
const streamController = require('../controllers/streamController');

// Stream routes
router.get('/streams', streamController.getStreamsPage);
router.get('/stream1', streamController.getStream1);
router.get('/stream2', streamController.getStream2);
router.get('/stream3', streamController.getStream3);
router.get('/stream4', streamController.getStream4);
router.get('/source', streamController.getSource);
router.post('/update-url', streamController.updateUrl);
router.get('/stream-debug', streamController.getStreamDebug);
router.get('/update-form', streamController.getUpdateForm);

module.exports = router;