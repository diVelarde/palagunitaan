const heritageEntryModel = require('../models/heritageEntryModel');
const geminiService = require('./geminiService');
const duplicateDetectionService = require('./duplicateDetectionService');

function resolveCategory(requestedCategory, categories = geminiService.CATEGORY_LIST) {
  if (!requestedCategory) return null;
  const wanted = String(requestedCategory).trim().toLowerCase();
  return categories.find((categoryName) => categoryName.toLowerCase() === wanted) || null;
}

async function enrichEntry(entry, { skipCategory = false } = {}) {
  const ai = { category: null, euphemistic: false, euphemisticSkipped: false, errors: [] };

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

  if (entry.ai_educational_excluded) {
    if (entry.euphemistic_content) {
      try {
        await heritageEntryModel.updateEuphemisticContent(entry.id, null);
      } catch (err) {
        console.error('Could not clear excluded educational rewrite for entry', entry.id, '-', err.message);
        ai.errors.push('euphemistic');
      }
    }
    ai.euphemisticSkipped = true;
  } else {
    try {
      const euphemisticContent = await geminiService.generateEuphemisticVersion(entry.raw_content);
      await heritageEntryModel.updateEuphemisticContent(entry.id, euphemisticContent);
      ai.euphemistic = true;
    } catch (err) {
      console.error('Euphemistic generation failed for entry', entry.id, '-', err.message);
      ai.errors.push('euphemistic');
    }
  }

  ai.aiConfigured = geminiService.isConfigured();
  return ai;
}

async function submitEntry({
  userId, title, rawContent, sourceType, sourceDescription, historicalPeriod,
  category, regionId, historyClaims, aiEducationalExcluded = false,
}) {
  const possibleDuplicates = await duplicateDetectionService.findPossibleDuplicates(title);

  const categoryOptions = await geminiService.getCategories();
  const chosenCategory = resolveCategory(category, categoryOptions.length ? categoryOptions : geminiService.CATEGORY_LIST);

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
    aiEducationalExcluded,
  });

  const ai = await enrichEntry(entry, { skipCategory: Boolean(chosenCategory) });
  ai.requestedCategory = chosenCategory;

  const fresh = await heritageEntryModel.findById(entry.id);

  return { entry: fresh, possibleDuplicates, ai };
}

module.exports = { submitEntry, enrichEntry, resolveCategory };
