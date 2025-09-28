const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

// Config routes
router.get('/xyzstream', configController.getConfig);
router.post('/update-lunar-status', configController.updateLunarStatus);
router.get('/update-lunar-status', (req, res) => res.sendFile(process.cwd() + '/public/update-lunar-form.html'));

module.exports = router;