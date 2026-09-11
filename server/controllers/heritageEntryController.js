const heritageEntryService = require('../services/heritageEntryService');
const heritageEntryModel = require('../models/heritageEntryModel');
const timelineService = require('../services/timelineService');

async function submitEntry(req, res, next) {
  try {
    const { title, rawContent, sourceType, sourceDescription, historicalPeriod } = req.body;
    const { entry, possibleDuplicates } = await heritageEntryService.submitEntry({
      userId: req.user.id,
      title,
      rawContent,
      sourceType,
      sourceDescription,
      historicalPeriod,
    });
    res.status(201).json({
      entry,
      possibleDuplicates: possibleDuplicates.map((d) => ({ id: d.id, title: d.title, score: d.score })),
    });
  } catch (err) {
    next(err);
  }
}


async function listPublished(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const offset = parseInt(req.query.offset, 10) || 0;
    const entries = await heritageEntryModel.findPublished({ limit, offset });
    res.json({ entries });
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const entries = await heritageEntryModel.findByUser(req.user.id);
    res.json({ entries });
  } catch (err) {
    next(err);
  }
}

async function getEntryById(req, res, next) {
  try {
    const entry = await heritageEntryModel.findById(req.params.id);
    if (!entry || (entry.status !== 'published' && entry.user_id !== req.user?.id)) {
      return res.status(404).json({ entry: null });
    }
    res.json({ entry });
  } catch (err) {
    next(err);
  }
}

async function searchEntries(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const offset = parseInt(req.query.offset, 10) || 0;
    const entries = await heritageEntryModel.search({
      keyword: req.query.keyword,
      category: req.query.category,
      region: req.query.region,
      verificationStatus: req.query.verificationStatus,
      historicalPeriod: req.query.historicalPeriod,
      limit,
      offset,
    });
    res.json({ entries });
  } catch (err) {
    next(err);
  }
}

async function getTimeline(req, res, next) {
  try {
    const entries = await heritageEntryModel.findAllPublishedForTimeline();
    const timeline = timelineService.buildTimeline(entries);
    res.json({ timeline });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitEntry, listPublished, listMine, getEntryById, searchEntries, getTimeline };
