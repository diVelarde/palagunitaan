const db = require('../config/db');

async function create({ userId, requestedRole, message }) {
  const [result] = await db.query(
    'INSERT INTO role_requests (user_id, requested_role, message) VALUES (?, ?, ?)',
    [userId, requestedRole, message || null]
  );
  const [rows] = await db.query('SELECT * FROM role_requests WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function findPendingForUser(userId) {
  const [rows] = await db.query("SELECT * FROM role_requests WHERE user_id = ? AND status = 'pending'", [userId]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM role_requests WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findAllPending() {
  const [rows] = await db.query(
    `SELECT rr.*, u.name AS user_name, u.email AS user_email, u.role AS current_role
     FROM role_requests rr JOIN users u ON u.id = rr.user_id
     WHERE rr.status = 'pending' ORDER BY rr.created_at ASC`
  );
  return rows;
}

async function markReviewed(id, { status, reviewedBy }) {
  await db.query('UPDATE role_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?', [status, reviewedBy, id]);
  return findById(id);
}

module.exports = { 
    create, 
    findPendingForUser, 
    findById, 
    findAllPending, 
    markReviewed 
};