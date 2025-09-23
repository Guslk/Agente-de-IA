// routes/manualRoutes.js

const express = require('express');
const router = express.Router();
const manualController = require('../controllers/manualController');

router.get('/', manualController.showManual);

module.exports = router;