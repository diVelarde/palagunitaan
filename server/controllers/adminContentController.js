const geographicTagModel = require('../models/geographicTagModel');
const categoryModel = require('../models/categoryModel');

async function listRegions(req, res, next) {
  try { res.json({ regions: await geographicTagModel.findAllRegions() }); } catch (err) { next(err); }
}
async function createRegion(req, res, next) {
  try { res.status(201).json({ region: await geographicTagModel.createRegion(req.body) }); } catch (err) { next(err); }
}
async function updateRegion(req, res, next) {
  try {
    const existing = await geographicTagModel.findRegionById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Region not found.' });
    res.json({ region: await geographicTagModel.updateRegion(req.params.id, req.body) });
  } catch (err) { next(err); }
}
async function deleteRegion(req, res, next) {
  try {
    const existing = await geographicTagModel.findRegionById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Region not found.' });
    await geographicTagModel.deleteRegion(req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ message: 'This region is still in use by one or more entries.' });
    next(err);
  }
}

async function listCategories(req, res, next) {
  try {
    const categories = await categoryModel.findAllCategories();
    const withFields = await Promise.all(categories.map(async (c) => ({ ...c, fields: await categoryModel.findFieldsByCategory(c.id) })));
    res.json({ categories: withFields });
  } catch (err) { next(err); }
}
async function createCategory(req, res, next) {
  try {
    const existing = await categoryModel.findCategoryByName(req.body.name);
    if (existing) return res.status(409).json({ message: 'A category with this name already exists.' });
    res.status(201).json({ category: await categoryModel.createCategory(req.body) });
  } catch (err) { next(err); }
}
async function updateCategory(req, res, next) {
  try {
    const existing = await categoryModel.findCategoryById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Category not found.' });
    res.json({ category: await categoryModel.updateCategory(req.params.id, req.body) });
  } catch (err) { next(err); }
}
async function deleteCategory(req, res, next) {
  try {
    const existing = await categoryModel.findCategoryById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Category not found.' });
    await categoryModel.deleteCategory(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

async function createField(req, res, next) {
  try {
    const category = await categoryModel.findCategoryById(req.params.categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    res.status(201).json({ field: await categoryModel.createField({ categoryId: req.params.categoryId, ...req.body }) });
  } catch (err) { next(err); }
}
async function updateField(req, res, next) {
  try { res.json({ field: await categoryModel.updateField(req.params.fieldId, req.body) }); } catch (err) { next(err); }
}
async function deleteField(req, res, next) {
  try { await categoryModel.deleteField(req.params.fieldId); res.status(204).send(); } catch (err) { next(err); }
}

module.exports = { 
    listRegions, 
    createRegion, 
    updateRegion, 
    deleteRegion, 
    listCategories, 
    createCategory, 
    updateCategory, 
    deleteCategory, 
    createField, 
    updateField, 
    deleteField 
};
