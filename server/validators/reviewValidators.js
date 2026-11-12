const { isValidDecision } = require('../services/verificationStatusService');
const heritageEntryModel = require('../models/heritageEntryModel');

const ASSESSMENT_VALUES = ['met', 'partly', 'not_met'];
const MIN_COMMENT_LENGTH = 20;

async function validateReview(req, res, next) {
  const { decision, comment, assessments } = req.body;
  const errors = [];

  if (!decision || !isValidDecision(decision)) {
    errors.push('decision must be one of: approved, approved_unverified, disputed, rejected.');
  }
  const commentLength = typeof comment === 'string' ? comment.trim().length : 0;
  if (decision === 'disputed' && commentLength < MIN_COMMENT_LENGTH) {
    errors.push('A comment of at least 20 characters is required when disputing an entry.');
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
      if (entry?.claims_conflict && commentLength < MIN_COMMENT_LENGTH) {
        errors.push('A comment of at least 20 characters is required to explain how the conflicting claims were handled.');
      }
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

  if (typeof comment !== 'string' || comment.trim().length < MIN_COMMENT_LENGTH) {
    return res.status(400).json({
      message: 'A comment of at least 20 characters is required when disputing an entry.',
    });
  }

  next();
}

module.exports = { validateReview, validateFlag };
