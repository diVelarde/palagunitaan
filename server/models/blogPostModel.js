const db = require('../config/db');

async function findAll({ limit = 20, offset = 0 } = {}) {
  const [rows] = await db.query(
    `SELECT bp.*, u.name AS author_name FROM blog_posts bp JOIN users u ON u.id = bp.user_id ORDER BY bp.published_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows;
}

async function findById(id) {
  const [rows] = await db.query(`SELECT bp.*, u.name AS author_name FROM blog_posts bp JOIN users u ON u.id = bp.user_id WHERE bp.id = ?`, [id]);
  return rows[0] || null;
}

async function findByUser(userId) {
  const [rows] = await db.query('SELECT * FROM blog_posts WHERE user_id = ? ORDER BY published_at DESC', [userId]);
  return rows;
}

async function create({ userId, title, content }) {
  const [result] = await db.query('INSERT INTO blog_posts (user_id, title, content) VALUES (?, ?, ?)', [userId, title, content]);
  return findById(result.insertId);
}

module.exports = { findAll, findById, findByUser, create };