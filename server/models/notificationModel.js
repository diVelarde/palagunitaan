const db = require('../config/db');

async function create({ userId, heritageEntryId, type, message }) {
  const [result] = await db.query(
    'INSERT INTO notifications (user_id, heritage_entry_id, type, message) VALUES (?, ?, ?, ?)',
    [userId, heritageEntryId || null, type, message]
  );
  const [rows] = await db.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function findByUser(userId, { limit = 20 } = {}) {
  const [rows] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit]);
  return rows;
}

async function countUnread(userId) {
  const [rows] = await db.query('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE', [userId]);
  return rows[0].count;
}

async function markRead(id, userId) {
  await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, userId]);
}

module.exports = { create, findByUser, countUnread, markRead };
