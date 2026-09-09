const heritageSiteModel = require('../models/heritageSiteModel');

async function list(req, res, next) {
  try {
    const sites = await heritageSiteModel.findAll();
    res.json({ sites });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const site = await heritageSiteModel.create({ createdBy: req.user.id, ...req.body });
    res.status(201).json({ site });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const existing = await heritageSiteModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Heritage site not found.' });
    const site = await heritageSiteModel.update(req.params.id, req.body);
    res.json({ site });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await heritageSiteModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Heritage site not found.' });
    await heritageSiteModel.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
