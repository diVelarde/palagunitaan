const heritageEntryModel = require('../models/heritageEntryModel');
const geminiService = require('./geminiService');
const duplicateDetectionService = require('./duplicateDetectionService');

function resolveCategory(requestedCategory) {
  if (!requestedCategory) return null;
  const wanted = String(requestedCategory).trim().toLowerCase();
  return geminiService.CATEGORY_LIST.find((c) => c.toLowerCase() === wanted) || null;
}

async function enrichEntry(entry, { skipCategory = false } = {}) {
  const ai = { category: null, euphemistic: false, errors: [] };

  if (!skipCategory) {
    try {
      const { category } = await geminiService.categorizeContent(entry.raw_content);
      await heritageEntryModel.updateCategoryAuto(entry.id, category);
      ai.category = category;
    } catch (err) {
      console.error('AI categorization failed for entry', entry.id, '-', err.message);
      ai.errors.push('category');
    }
  }

  try {
    const euphemisticContent = await geminiService.generateEuphemisticVersion(entry.raw_content);
    await heritageEntryModel.updateEuphemisticContent(entry.id, euphemisticContent);
    ai.euphemistic = true;
  } catch (err) {
    console.error('Euphemistic generation failed for entry', entry.id, '-', err.message);
    ai.errors.push('euphemistic');
  }

  ai.aiConfigured = geminiService.isConfigured();
  return ai;
}

async function submitEntry({
  userId, title, rawContent, sourceType, sourceDescription, historicalPeriod,
  category, regionId, historyClaims,
}) {
  const possibleDuplicates = await duplicateDetectionService.findPossibleDuplicates(title);

  const chosenCategory = resolveCategory(category);

  const entry = await heritageEntryModel.create({
    userId,
    title: title.trim(),
    rawContent: rawContent.trim(),
    sourceType,
    sourceDescription,
    historicalPeriod,
    categoryAuto: chosenCategory,
    regionId,
    historyClaims,
  });

  const ai = await enrichEntry(entry, { skipCategory: Boolean(chosenCategory) });
  ai.requestedCategory = chosenCategory;

  const fresh = await heritageEntryModel.findById(entry.id);

  return { entry: fresh, possibleDuplicates, ai };
}

module.exports = { submitEntry, enrichEntry, resolveCategory };
