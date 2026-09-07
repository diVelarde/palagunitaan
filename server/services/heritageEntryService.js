const heritageEntryModel = require('../models/heritageEntryModel');
const geminiService = require('./geminiService');

async function submitEntry({ userId, title, rawContent, sourceType, sourceDescription, historicalPeriod }) {
  const entry = await heritageEntryModel.create({
    userId,
    title: title.trim(),
    rawContent: rawContent.trim(),
    sourceType,
    sourceDescription,
    historicalPeriod,
  });

  try {
    const { category } = await geminiService.categorizeContent(entry.raw_content);
    await heritageEntryModel.updateCategoryAuto(entry.id, category);
    entry.category_auto = category;
  } catch (err) {
    console.error('AI categorization failed for entry', entry.id, err.message);
  }

  try {
    const euphemisticContent = await geminiService.generateEuphemisticVersion(entry.raw_content);
    await heritageEntryModel.updateEuphemisticContent(entry.id, euphemisticContent);
    entry.euphemistic_content = euphemisticContent;
  } catch (err) {
    console.error('Dual-version generation failed for entry', entry.id, err.message);
  }

  return entry;
}

module.exports = { submitEntry };
