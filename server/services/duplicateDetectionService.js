const db = require('../config/db');

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

const SIMILARITY_THRESHOLD = 0.75;

async function findPossibleDuplicates(title, excludeEntryId = null) {
  const normalizedTitle = normalize(title);
  const firstWord = normalizedTitle.split(' ')[0] || '';

  const [rows] = await db.query(
    `SELECT id, title FROM heritage_entries
     WHERE title LIKE ? AND id != ?
     LIMIT 50`,
    [`%${firstWord}%`, excludeEntryId || 0]
  );

  return rows
    .map((row) => ({ ...row, score: similarity(normalizedTitle, normalize(row.title)) }))
    .filter((row) => row.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score);
}

module.exports = { findPossibleDuplicates, similarity, normalize };