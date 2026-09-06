const heritageEntryModel = require('../models/heritageEntryModel');

async function submitEntry({ userId, title, rawContent, sourceType, sourceDescription, historicalPeriod }) {
  const entry = await heritageEntryModel.create({
    userId,
    title: title.trim(),
    rawContent: rawContent.trim(),
    sourceType,
    sourceDescription,
    historicalPeriod,
  });

  return entry;
}

module.exports = { submitEntry };
