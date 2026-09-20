const heritageEntryService = require('../services/heritageEntryService');
const heritageEntryModel = require('../models/heritageEntryModel');
const timelineService = require('../services/timelineService');
const geminiService = require('../services/geminiService');

async function submitEntry(req, res, next) {
  try {
    const { title, rawContent, sourceType, sourceDescription, historicalPeriod } = req.body;
    const { entry, possibleDuplicates } = await heritageEntryService.submitEntry({
      userId: req.user.id, title, rawContent, sourceType, sourceDescription, historicalPeriod,
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
    res.json({ entries: await heritageEntryModel.findPublished({ limit, offset }) });
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    res.json({ entries: await heritageEntryModel.findByUser(req.user.id) });
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
    res.json({ timeline: timelineService.buildTimeline(entries) });
  } catch (err) {
    next(err);
  }
}

async function translateEntry(req, res, next) {
  try {
    const { targetLanguage } = req.body;
    if (!targetLanguage || !targetLanguage.trim()) {
      return res.status(400).json({ message: 'targetLanguage is required.' });
    }
    const entry = await heritageEntryModel.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found.' });

    const translatedContent = await geminiService.translateContent(entry.raw_content, targetLanguage.trim());
    const updated = await heritageEntryModel.updateTranslation(entry.id, {
      translatedContent,
      translatedLanguage: targetLanguage.trim(),
    });
    res.json({ entry: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { 
  submitEntry, 
  listPublished, 
  listMine, 
  getEntryById, 
  searchEntries, 
  getTimeline, 
  translateEntry 
};
