const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

// Config routes
router.get('/xyzstream', configController.getConfig);

module.exports = router;