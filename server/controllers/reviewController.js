const heritageEntryModel = require('../models/heritageEntryModel');
const editorialActionModel = require('../models/editorialActionModel');
const reviewService = require('../services/reviewService');

async function listPending(req, res, next) {
  try {
    const entries = await heritageEntryModel.findPending();
    res.json({ entries });
  } catch (err) { next(err); }
}

async function reviewEntry(req, res, next) {
  try {
    const { decision, comment } = req.body;
    const { entry, action } = await reviewService.reviewEntry({
      entryId: req.params.id, validatorId: req.user.id, decision, comment,
    });
    res.json({ entry, action });
  } catch (err) {
    if (err instanceof reviewService.ReviewError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

async function getEntryHistory(req, res, next) {
  try {
    const history = await editorialActionModel.findByEntry(req.params.id);
    res.json({ history });
  } catch (err) { next(err); }
}

module.exports = { listPending, reviewEntry, getEntryHistory };
