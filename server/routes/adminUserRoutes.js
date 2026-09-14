const express = require('express');
const { validateRoleUpdate } = require('../validators/adminUserValidators');
const controller = require('../controllers/adminUserController');

const router = express.Router();

router.get('/', controller.listUsers);
router.patch('/:id/role', validateRoleUpdate, controller.updateUserRole);

module.exports = router;