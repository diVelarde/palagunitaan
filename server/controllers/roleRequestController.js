const roleRequestModel = require('../models/roleRequestModel');
const userModel = require('../models/userModel');
const notificationService = require('../services/notificationService');

async function createRequest(req, res, next) {
  try {
    const existing = await roleRequestModel.findPendingForUser(req.user.id);
    if (existing) return res.status(409).json({ message: 'You already have a pending role request.' });
    const request = await roleRequestModel.create({ userId: req.user.id, requestedRole: req.body.requestedRole, message: req.body.message });
    res.status(201).json({ request });
  } catch (err) { next(err); }
}

async function listPending(req, res, next) {
  try { res.json({ requests: await roleRequestModel.findAllPending() }); } catch (err) { next(err); }
}

async function reviewRequest(req, res, next) {
  try {
    const { decision } = req.body;
    const request = await roleRequestModel.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.status !== 'pending') return res.status(409).json({ message: 'This request has already been reviewed.' });

    const updated = await roleRequestModel.markReviewed(request.id, { status: decision, reviewedBy: req.user.id });

    if (decision === 'approved') {
      await userModel.updateRole(request.user_id, request.requested_role);
    }

    try {
      const message = decision === 'approved'
        ? `Your request to become a ${request.requested_role} was approved.`
        : `Your request to become a ${request.requested_role} was not approved.`;
      await notificationService.notifyRoleRequestDecision({ userId: request.user_id, message });
    } catch (err) {
      console.error('Failed to notify user of role request decision', request.id, err.message);
    }

    res.json({ request: updated });
  } catch (err) { next(err); }
}

module.exports = { createRequest, listPending, reviewRequest };