const contentReportModel = require('../models/contentReportModel');

async function createReport(req, res, next) {
  try {
    const { targetType, reason, message } = req.body;
    const targetId = req.reportTargetId;
    const duplicate = await contentReportModel.findOpenDuplicate({
      reporterId: req.user.id,
      targetType,
      targetId,
    });
    if (duplicate) {
      return res.status(409).json({ message: 'You already have an open report for this content.' });
    }

    const report = await contentReportModel.create({
      reporterId: req.user.id,
      targetType,
      targetId,
      reason,
      message,
    });
    res.status(201).json({ report });
  } catch (err) { next(err); }
}

async function listReports(req, res, next) {
  try {
    const reports = await contentReportModel.findByStatus(req.query.status || 'open');
    res.json({ reports });
  } catch (err) { next(err); }
}

async function closeReport(req, res, next) {
  try {
    const report = await contentReportModel.close(req.params.id);
    if (!report) return res.status(404).json({ message: 'Open report not found.' });
    res.json({ report });
  } catch (err) { next(err); }
}

module.exports = { createReport, listReports, closeReport };
