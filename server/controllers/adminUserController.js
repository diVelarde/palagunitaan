const userModel = require('../models/userModel');

function toAdminSafeUser(user) {
  const { id, name, email, avatar_url, role, created_at } = user;
  return { id, name, email, avatarUrl: avatar_url, role, createdAt: created_at };
}

async function listUsers(req, res, next) {
  try {
    const users = await userModel.findAll();
    res.json({ users: users.map(toAdminSafeUser) });
  } catch (err) {
    next(err);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const targetId = Number(req.params.id);

    if (targetId === req.user.id) {
      return res.status(400).json({ message: 'You cannot change your own role here.' });
    }

    const existing = await userModel.findById(targetId);
    if (!existing) return res.status(404).json({ message: 'User not found.' });

    const updated = await userModel.updateRole(targetId, req.body.role);
    res.json({ user: toAdminSafeUser(updated) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, updateUserRole };
