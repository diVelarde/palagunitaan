const notificationModel = require('./notificationModel');

const DECISION_MESSAGES = {
  approved: (title) => `Your entry "${title}" was reviewed and published.`,
  disputed: (title) => `Your entry "${title}" was published, but a validator flagged it as disputed. Check the notes on the entry.`,
  rejected: (title) => `Your entry "${title}" was reviewed and was not published. See the validator's notes for why.`,
};

async function notifyReviewDecision({ entry, decision }) {
  const buildMessage = DECISION_MESSAGES[decision];
  if (!buildMessage) return null;

  return notificationModel.create({
    userId: entry.user_id,
    heritageEntryId: entry.id,
    type: 'entry_reviewed',
    message: buildMessage(entry.title),
  });
}

module.exports = { notifyReviewDecision };
