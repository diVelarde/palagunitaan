const { isValidDecision } = require('../services/verificationStatusService');
const heritageEntryModel = require('../models/heritageEntryModel');

const ASSESSMENT_VALUES = ['met', 'partly', 'not_met'];

async function validateReview(req, res, next) {
  const { decision, comment, assessments } = req.body;
  const errors = [];

  if (!decision || !isValidDecision(decision)) {
    errors.push('decision must be one of: approved, approved_unverified, disputed, rejected.');
  }
  if (decision === 'disputed' && (!comment || !comment.trim())) {
    errors.push('comment is required when disputing an entry.');
  }
  if (assessments !== undefined) {
    if (!Array.isArray(assessments)) {
      errors.push('assessments must be an array.');
    } else {
      assessments.forEach((assessment, index) => {
        if (!assessment || typeof assessment !== 'object' || Array.isArray(assessment)) {
          errors.push(`assessments[${index}] must be an object.`);
          return;
        }
        if (!Number.isSafeInteger(Number(assessment.historyClaimId)) || Number(assessment.historyClaimId) < 1) {
          errors.push(`assessments[${index}].historyClaimId must be a positive integer.`);
        }
        ['sourceTypeFit', 'sourceCredibility', 'corroboration', 'claimedYearSupported'].forEach((field) => {
          if (!ASSESSMENT_VALUES.includes(assessment[field])) {
            errors.push(`assessments[${index}].${field} must be met, partly, or not_met.`);
          }
        });
        if (assessment.notes != null && typeof assessment.notes !== 'string') {
          errors.push(`assessments[${index}].notes must be a string.`);
        }
      });
    }
  }

  if (errors.length) return res.status(400).json({ message: 'Invalid review.', errors });

  const isApproval = decision === 'approved' || decision === 'approved_unverified';
  if (isApproval || assessments !== undefined) {
    try {
      const entry = await heritageEntryModel.findById(req.params.id);
      const historyClaims = entry?.history_claims || [];
      const submittedAssessments = assessments || [];
      if (isApproval && historyClaims.length && submittedAssessments.length !== historyClaims.length) {
        errors.push('An assessment is required for every historical claim when approving.');
      }

      const claimIds = new Set(historyClaims.map((claim) => String(claim.id)));
      const assessmentClaimIds = submittedAssessments.map((assessment) => String(assessment.historyClaimId));
      if (
        assessmentClaimIds.some((id) => !claimIds.has(id))
        || new Set(assessmentClaimIds).size !== assessmentClaimIds.length
      ) {
        errors.push('Each assessment must reference a different historical claim on this entry.');
      }
    } catch (err) {
      return next(err);
    }
  }

  if (errors.length) return res.status(400).json({ message: 'Invalid review.', errors });
  next();
}

function validateFlag(req, res, next) {
  const { comment } = req.body;

  if (!comment || !comment.trim()) {
    return res.status(400).json({ message: 'Comment is required when flagging an entry.' });
  }

  next();
}

module.exports = { validateReview, validateFlag };
