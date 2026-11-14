const notificationModel = require('../models/notificationModel');

const DECISION_MESSAGES = {
  approved: (title) => `Your entry "${title}" was reviewed and published as Verified.`,
  approved_unverified: (title) => `Your entry "${title}" was reviewed and published as Unverified.`,
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

async function notifyRoleRequestDecision({ userId, message }) {
  return notificationModel.create({ userId, heritageEntryId: null, type: 'role_request_reviewed', message });
}

async function notifyBlogDecision({ userId, postTitle, decision, reason }) {
  const message = decision === 'approved'
    ? `Your blog post "${postTitle}" was approved and published.`
    : `Your blog post "${postTitle}" was not approved. Reason: ${reason}`;
  return notificationModel.create({
    userId,
    heritageEntryId: null,
    type: 'blog_post_reviewed',
    message,
  });
}

module.exports = { notifyReviewDecision, notifyRoleRequestDecision, notifyBlogDecision };
