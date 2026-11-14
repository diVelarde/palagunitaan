const db = require('../config/db');

function visibilityFilter({ userId, role } = {}) {
  if (role === 'validator' || role === 'admin') {
    return { clause: '1 = 1', params: [] };
  }
  if (userId != null) {
    return {
      clause: '(bp.status = ? OR bp.user_id = ?)',
      params: ['published', userId],
    };
  }
  return { clause: 'bp.status = ?', params: ['published'] };
}

async function findAll({ limit = 20, offset = 0 } = {}, viewer) {
  const visibility = visibilityFilter(viewer);
  const [rows] = await db.query(
    `SELECT bp.*, u.name AS author_name FROM blog_posts bp JOIN users u ON u.id = bp.user_id WHERE ${visibility.clause} ORDER BY bp.published_at DESC LIMIT ? OFFSET ?`,
    [...visibility.params, limit, offset]
  );
  return rows;
}

async function findById(id, viewer) {
  const visibility = visibilityFilter(viewer);
  const [rows] = await db.query(
    `SELECT bp.*, u.name AS author_name FROM blog_posts bp JOIN users u ON u.id = bp.user_id WHERE bp.id = ? AND ${visibility.clause}`,
    [id, ...visibility.params]
  );
  return rows[0] || null;
}

async function incrementViewCount(id) {
  const [result] = await db.query(
    "UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ? AND status = 'published'",
    [id]
  );
  return result.affectedRows > 0;
}

async function findByUser(userId) {
  const [rows] = await db.query('SELECT * FROM blog_posts WHERE user_id = ? ORDER BY published_at DESC', [userId]);
  return rows;
}

async function findPending({ excludeUserId } = {}) {
  const params = [];
  let excludeAuthor = '';
  if (excludeUserId != null) {
    excludeAuthor = ' AND bp.user_id <> ?';
    params.push(excludeUserId);
  }
  const [rows] = await db.query(
    `SELECT bp.*, u.name AS author_name
     FROM blog_posts bp JOIN users u ON u.id = bp.user_id
     WHERE bp.status = 'pending'${excludeAuthor}
     ORDER BY bp.published_at ASC, bp.id ASC`,
    params
  );
  return rows;
}

async function markReviewed(id, { status, reviewedBy, reason = null }) {
  await db.query(
    'UPDATE blog_posts SET status = ?, reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ? WHERE id = ?',
    [status, reviewedBy, reason, id]
  );
  return findById(id, { userId: reviewedBy, role: 'validator' });
}

async function create({ userId, title, content, coverImageUrl }) {
  const [result] = await db.query(
    "INSERT INTO blog_posts (user_id, title, content, cover_image_url, status) VALUES (?, ?, ?, ?, 'pending')",
    [userId, title, content, coverImageUrl || null]
  );
  return findById(result.insertId, { userId });
}

module.exports = {
  findAll,
  findById,
  incrementViewCount,
  findByUser,
  findPending,
  markReviewed,
  create,
};