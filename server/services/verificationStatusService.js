const DECISION_RULES = {
  approved: { verificationStatus: 'verified', entryStatus: 'published' },
  disputed: { verificationStatus: 'disputed', entryStatus: 'published' }, 
  rejected: { verificationStatus: 'unverified', entryStatus: 'rejected' },
};

function isValidDecision(decision) {
  return decision in DECISION_RULES;
}

function canReview(entry) {
  return entry.status === 'pending';
}

function resolveOutcome(decision) {
  if (!isValidDecision(decision)) throw new Error(`Unknown review decision: ${decision}`);
  return DECISION_RULES[decision];
}

module.exports = { isValidDecision, canReview, resolveOutcome, DECISION_RULES };
