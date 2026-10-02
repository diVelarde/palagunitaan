const express = require('express');
const controller = require('../controllers/mapController');

const router = express.Router();

router.get('/data', controller.getMapData);
router.get('/regions', controller.getRegions);

module.exports = router;
