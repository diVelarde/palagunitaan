const REPORT_REASONS = [
  'Misleading cultural claim',
  'Disrespectful or harmful',
  'Wrong information',
  'Other',
];
const TARGET_TYPES = ['entry', 'blog_post'];

function validateCreateReport(req, res, next) {
  const { targetType, targetId, reason, message } = req.body || {};
  const numericTargetId = Number(targetId);
  if (!TARGET_TYPES.includes(targetType)) {
    return res.status(400).json({ message: 'targetType must be "entry" or "blog_post".' });
  }
  if (!Number.isSafeInteger(numericTargetId) || numericTargetId < 1) {
    return res.status(400).json({ message: 'targetId must be a positive integer.' });
  }
  if (!REPORT_REASONS.includes(reason)) {
    return res.status(400).json({ message: `reason must be one of: ${REPORT_REASONS.join(', ')}.` });
  }
  if (message != null && (typeof message !== 'string' || message.length > 2000)) {
    return res.status(400).json({ message: 'message must be 2000 characters or fewer.' });
  }
  req.reportTargetId = numericTargetId;
  next();
}

function validateReportStatus(req, res, next) {
  if (req.query.status != null && !['open', 'closed'].includes(req.query.status)) {
    return res.status(400).json({ message: 'status must be "open" or "closed".' });
  }
  next();
}

function validateReportId(req, res, next) {
  if (!/^[1-9]\d*$/.test(req.params.id)) {
    return res.status(400).json({ message: 'Report id must be a positive integer.' });
  }
  next();
}

module.exports = {
  validateCreateReport,
  validateReportStatus,
  validateReportId,
  REPORT_REASONS,
  TARGET_TYPES,
};
