const heritageEntryModel = require('../models/heritageEntryModel');
const editorialActionModel = require('../models/editorialActionModel');
const claimAssessmentModel = require('../models/claimAssessmentModel');
const verificationStatusService = require('./verificationStatusService');
const notificationService = require('./notificationService');

class ReviewError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

function validateAssessments(entry, decision, assessments) {
  if (assessments !== undefined && !Array.isArray(assessments)) {
    throw new ReviewError('Assessments must be an array.', 400);
  }
  const submittedAssessments = assessments || [];
  const historyClaims = entry.history_claims || [];
  const isApproval = decision === 'approved' || decision === 'approved_unverified';

  if (isApproval && historyClaims.length && submittedAssessments.length !== historyClaims.length) {
    throw new ReviewError('An assessment is required for every historical claim when approving.', 400);
  }

  const claimIds = new Set(historyClaims.map((claim) => String(claim.id)));
  const assessmentClaimIds = submittedAssessments.map((assessment) => String(assessment?.historyClaimId));
  if (
    assessmentClaimIds.some((id) => !claimIds.has(id))
    || new Set(assessmentClaimIds).size !== assessmentClaimIds.length
  ) {
    throw new ReviewError('Each assessment must reference a different historical claim on this entry.', 400);
  }
  return submittedAssessments;
}

async function reviewEntry({ entryId, validatorId, decision, comment, assessments }) {
  const entry = await heritageEntryModel.findById(entryId);
  if (!entry) throw new ReviewError('Entry not found.', 404);
  if (Number(entry.user_id) === Number(validatorId)) {
    throw new ReviewError('You cannot review your own submission.', 403);
  }
  if (!verificationStatusService.canReview(entry)) {
    throw new ReviewError('This entry is not awaiting review.', 409);
  }
  const entryAssessments = validateAssessments(entry, decision, assessments);

  const { verificationStatus, entryStatus } = verificationStatusService.resolveOutcome(decision);
  const updatedEntry = await heritageEntryModel.updateVerification(entryId, { status: entryStatus, verificationStatus });
  const action = await editorialActionModel.create({ heritageEntryId: entryId, validatorId, actionType: decision, comment });
  if (entryAssessments.length > 0) {
    await claimAssessmentModel.createMany(entryAssessments.map((assessment) => ({
      ...assessment,
      heritageEntryId: entryId,
      validatorId,
      editorialActionId: action.id,
    })));
  }

  try {
    await notificationService.notifyReviewDecision({ entry: updatedEntry, decision });
  } catch (err) {
    console.error('Failed to notify contributor for entry', entryId, err.message);
  }

  return { entry: updatedEntry, action };
}

module.exports = { reviewEntry, ReviewError };
