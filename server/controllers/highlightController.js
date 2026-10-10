const highlightModel = require('../models/highlightModel');
const heritageEntryModel = require('../models/heritageEntryModel');
const heritageSiteModel = require('../models/heritageSiteModel');

async function getCurrent(req, res, next) {
  try {
    const [week, month] = await Promise.all([highlightModel.findActive('week'), highlightModel.findActive('month')]);
    res.json({ week, month });
  } catch (err) { next(err); }
}

async function getHistory(req, res, next) {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    res.json({ highlights: await highlightModel.findHistory({ limit, offset }) });
  } catch (err) { next(err); }
}

async function createHighlight(req, res, next) {
  try {
    const { heritageEntryId, heritageSiteId, periodType, startsOn, endsOn } = req.body;
    if (heritageEntryId) {
      const entry = await heritageEntryModel.findById(heritageEntryId);
      if (!entry) return res.status(404).json({ message: 'Entry not found.' });
      if (entry.status !== 'published') return res.status(400).json({ message: 'Only published entries can be highlighted.' });
    } else {
      const site = await heritageSiteModel.findById(heritageSiteId);
      if (!site) return res.status(404).json({ message: 'Heritage site not found.' });
    }

    const highlight = await highlightModel.create({
      heritageEntryId: heritageEntryId || null,
      heritageSiteId: heritageSiteId || null,
      periodType,
      startsOn,
      endsOn,
      createdBy: req.user.id,
    });
    res.status(201).json({ highlight });
  } catch (err) { next(err); }
}

module.exports = { getCurrent, getHistory, createHighlight };