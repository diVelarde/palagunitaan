const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODEL_NAME = 'gemini-2.5-flash';

const CATEGORY_LIST = [
  'Creation Myth', 'Deity or Spirit', 'Folk Belief', 'Ritual or Practice',
  'Legend', 'Folk Tale', 'Proverb or Saying', 'Historical Account', 'Other',
];

class AiNotConfiguredError extends Error {
  constructor() {
    super('GEMINI_API_KEY is not set on this server, so AI features are disabled.');
    this.name = 'AiNotConfiguredError';
    this.code = 'AI_NOT_CONFIGURED';
  }
}

function isConfigured() {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
}

let _client = null;
function getClient() {
  // Fail loudly instead of constructing a client with an undefined key, which
  // produced an opaque SDK error on every call.
  if (!isConfigured()) throw new AiNotConfiguredError();
  if (!_client) _client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  return _client;
}

function getModel(generationConfig) {
  return getClient().getGenerativeModel({ model: MODEL_NAME, generationConfig });
}

/** Pulls the first JSON object out of a reply, tolerating code fences/prose. */
function parseJsonReply(text) {
  const cleaned = String(text).replace(/```json|```/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw err;
  }
}

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
    const parsed = parseJsonReply(result.response.text());
    return {
      category: CATEGORY_LIST.includes(parsed.category) ? parsed.category : 'Other',
      flaggedWords: Array.isArray(parsed.flaggedWords) ? parsed.flaggedWords : [],
    };
  } catch (err) {
    return { category: 'Other', flaggedWords: [] };
  }
}

async function generateEuphemisticVersion(rawContent) {
  const model = getModel();
  const prompt =
    'Rewrite the following Philippine folklore submission in plain, accessible ' +
    'language for a general public audience unfamiliar with regional terms or ' +
    'context. Preserve every factual claim and cultural detail exactly — add ' +
    'brief clarifications in parentheses where helpful, but do not remove or ' +
    'soften content. Respond with the rewritten text only, no preamble.\n\n' +
    'Submission:\n' + rawContent;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  if (!text) throw new Error('The AI returned an empty rewrite.');
  return text;
}

async function translateContent(rawContent, targetLanguage) {
  const model = getModel();
  const prompt =
    `Translate the following Philippine folklore submission into ${targetLanguage}. ` +
    'Preserve every factual claim, name, and cultural term exactly — where a term has ' +
    'no direct translation, keep the original term and add a brief gloss in brackets. ' +
    'Respond with the translation only, no preamble.\n\nSubmission:\n' + rawContent;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

async function checkHealth() {
  const model = getModel();
  const result = await model.generateContent('Reply with the single word: ok');
  return result.response.text().trim();
}

module.exports = {
  categorizeContent,
  generateEuphemisticVersion,
  translateContent,
  checkHealth,
  isConfigured,
  AiNotConfiguredError,
  CATEGORY_LIST,
  MODEL_NAME,
};
