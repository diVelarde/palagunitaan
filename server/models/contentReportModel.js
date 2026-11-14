const db = require('../config/db');

async function findById(id) {
  const [rows] = await db.query(
    `SELECT cr.*, u.name AS reporter_name, COALESCE(he.title, bp.title) AS target_title
     FROM content_reports cr
     JOIN users u ON u.id = cr.reporter_id
     LEFT JOIN heritage_entries he ON cr.target_type = 'entry' AND he.id = cr.target_id
     LEFT JOIN blog_posts bp ON cr.target_type = 'blog_post' AND bp.id = cr.target_id
     WHERE cr.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function findOpenDuplicate({ reporterId, targetType, targetId }) {
  const [rows] = await db.query(
    `SELECT id FROM content_reports
     WHERE reporter_id = ? AND target_type = ? AND target_id = ? AND status = 'open'
     LIMIT 1`,
    [reporterId, targetType, targetId]
  );
  return rows[0] || null;
}

async function create({ reporterId, targetType, targetId, reason, message }) {
  const [result] = await db.query(
    'INSERT INTO content_reports (reporter_id, target_type, target_id, reason, message) VALUES (?, ?, ?, ?, ?)',
    [reporterId, targetType, targetId, reason, message || null]
  );
  return findById(result.insertId);
}

async function findByStatus(status = 'open') {
  const [rows] = await db.query(
    `SELECT cr.*, u.name AS reporter_name, COALESCE(he.title, bp.title) AS target_title
     FROM content_reports cr
     JOIN users u ON u.id = cr.reporter_id
     LEFT JOIN heritage_entries he ON cr.target_type = 'entry' AND he.id = cr.target_id
     LEFT JOIN blog_posts bp ON cr.target_type = 'blog_post' AND bp.id = cr.target_id
     WHERE cr.status = ?
     ORDER BY cr.created_at ASC, cr.id ASC`,
    [status]
  );
  return rows;
}

async function close(id) {
  const [result] = await db.query(
    "UPDATE content_reports SET status = 'closed' WHERE id = ? AND status = 'open'",
    [id]
  );
  if (!result.affectedRows) return null;
  return findById(id);
}

module.exports = { findById, findOpenDuplicate, create, findByStatus, close };
