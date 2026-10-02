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

async function incrementViewCount(id) {
  const [result] = await db.query(
    'UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

async function findByUser(userId) {
  const [rows] = await db.query('SELECT * FROM blog_posts WHERE user_id = ? ORDER BY published_at DESC', [userId]);
  return rows;
}

async function create({ userId, title, content, coverImageUrl }) {
  const [result] = await db.query(
    'INSERT INTO blog_posts (user_id, title, content, cover_image_url) VALUES (?, ?, ?, ?)',
    [userId, title, content, coverImageUrl || null]
  );
  return findById(result.insertId);
}

module.exports = { findAll, findById, incrementViewCount, findByUser, create };