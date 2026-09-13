const notificationModel = require('../models/notificationModel');

async function listMine(req, res, next) {
  try {
    const notifications = await notificationModel.findByUser(req.user.id);
    res.json({ notifications });
  } catch (err) { next(err); }
}

async function unreadCount(req, res, next) {
  try {
    const count = await notificationModel.countUnread(req.user.id);
    res.json({ count });
  } catch (err) { next(err); }
}

async function markRead(req, res, next) {
  try {
    await notificationModel.markRead(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listMine, unreadCount, markRead };
