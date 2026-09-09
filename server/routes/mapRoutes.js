const express = require('express');
const controller = require('../controllers/mapController');

const router = express.Router();

router.get('/data', controller.getMapData);

module.exports = router;
