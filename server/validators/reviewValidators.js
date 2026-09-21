const { isValidDecision } = require('../services/verificationStatusService');

function validateReview(req, res, next) {
  const { decision, comment } = req.body;
  const errors = [];

  if (!decision || !isValidDecision(decision)) {
    errors.push('decision must be one of: approved, disputed, rejected.');
  }
  if (decision === 'disputed' && (!comment || !comment.trim())) {
    errors.push('comment is required when disputing an entry.');
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
