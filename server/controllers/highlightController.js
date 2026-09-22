const highlightModel = require('../models/highlightModel');
const heritageEntryModel = require('../models/heritageEntryModel');

async function getCurrent(req, res, next) {
  try {
    const [week, month] = await Promise.all([highlightModel.findActive('week'), highlightModel.findActive('month')]);
    res.json({ week, month });
  } catch (err) { next(err); }
}

async function getHistory(req, res, next) {
  try { res.json({ highlights: await highlightModel.findHistory() }); } catch (err) { next(err); }
}

async function createHighlight(req, res, next) {
  try {
    const { heritageEntryId, periodType, startsOn, endsOn } = req.body;
    const entry = await heritageEntryModel.findById(heritageEntryId);
    if (!entry) return res.status(404).json({ message: 'Entry not found.' });
    if (entry.status !== 'published') return res.status(400).json({ message: 'Only published entries can be highlighted.' });

    const highlight = await highlightModel.create({ heritageEntryId, periodType, startsOn, endsOn, createdBy: req.user.id });
    res.status(201).json({ highlight });
  } catch (err) { next(err); }
}

module.exports = { getCurrent, getHistory, createHighlight };