const CATEGORY_LIST = [
  'Creation Myth', 'Deity or Spirit', 'Folk Belief', 'Ritual or Practice',
  'Legend', 'Folk Tale', 'Proverb or Saying', 'Historical Account', 'Other',
];

async function categorizeContent(rawContent) {
  const model = getModel({ responseMimeType: 'application/json' });
  const prompt =
    'You classify Philippine folklore submissions for an archival system. ' +
    `Respond ONLY with JSON: {"category": one of [${CATEGORY_LIST.join(', ')}], "flaggedWords": string[]}. ` +
    'flaggedWords lists specific words/phrases a human validator should review ' +
    '(sensitive cultural terms, potentially offensive language, unverifiable claims) — ' +
    'return an empty array if none.\n\nSubmission:\n' + rawContent;

  const result = await model.generateContent(prompt);

  try {
    const parsed = JSON.parse(result.response.text());
    return {
      category: CATEGORY_LIST.includes(parsed.category) ? parsed.category : 'Other',
      flaggedWords: Array.isArray(parsed.flaggedWords) ? parsed.flaggedWords : [],
    };
  } catch (err) {
    return { category: 'Other', flaggedWords: [] };
  }
}