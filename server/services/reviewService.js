const heritageEntryModel = require('../models/heritageEntryModel');
const editorialActionModel = require('../models/editorialActionModel');
const verificationStatusService = require('./verificationStatusService');

class ReviewError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function reviewEntry({ entryId, validatorId, decision, comment }) {
  const entry = await heritageEntryModel.findById(entryId);
  if (!entry) throw new ReviewError('Entry not found.', 404);
  if (!verificationStatusService.canReview(entry)) {
    throw new ReviewError('This entry is not awaiting review.', 409);
  }

  const { verificationStatus, entryStatus } = verificationStatusService.resolveOutcome(decision);
  const updatedEntry = await heritageEntryModel.updateVerification(entryId, { status: entryStatus, verificationStatus });
  const action = await editorialActionModel.create({ heritageEntryId: entryId, validatorId, actionType: decision, comment });

  return { entry: updatedEntry, action };
}

module.exports = { reviewEntry, ReviewError };
