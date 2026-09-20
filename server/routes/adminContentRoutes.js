const express = require('express');
const { validateRegion, validateCategory, validateField } = require('../validators/adminContentValidators');
const controller = require('../controllers/adminContentController');

const router = express.Router();

router.get('/regions', controller.listRegions);
router.post('/regions', validateRegion, controller.createRegion);
router.put('/regions/:id', validateRegion, controller.updateRegion);
router.delete('/regions/:id', controller.deleteRegion);

router.get('/categories', controller.listCategories);
router.post('/categories', validateCategory, controller.createCategory);
router.put('/categories/:id', validateCategory, controller.updateCategory);
router.delete('/categories/:id', controller.deleteCategory);

router.post('/categories/:categoryId/fields', validateField, controller.createField);
router.put('/fields/:fieldId', validateField, controller.updateField);
router.delete('/fields/:fieldId', controller.deleteField);

module.exports = router;