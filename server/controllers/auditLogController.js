const editorialActionModel = require('../models/editorialActionModel');

async function listAuditLog(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    const entries = await editorialActionModel.findAll({ limit, offset });
    res.json({ entries });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAuditLog };