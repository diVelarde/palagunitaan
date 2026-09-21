const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateRoleRequest, validateReview } = require('../validators/roleRequestValidators');
const controller = require('../controllers/roleRequestController');

const selfServeRouter = express.Router();
selfServeRouter.post('/', requireAuth, validateRoleRequest, controller.createRequest);

const adminRouter = express.Router();
adminRouter.get('/', controller.listPending);
adminRouter.patch('/:id', validateReview, controller.reviewRequest);

module.exports = { selfServeRouter, adminRouter };