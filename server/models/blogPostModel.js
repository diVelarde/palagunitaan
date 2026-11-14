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

function escapeLikeTerm(term) {
  return term.replace(/[!%_]/g, '!$&');
}

function addDay(date) {
  const nextDate = new Date(`${date}T00:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  return nextDate.toISOString().slice(0, 10);
}

async function findAll({
  limit = 20,
  offset = 0,
  q,
  authorId,
  authorName,
  from,
  to,
  sort = 'newest',
} = {}, viewer) {
  const visibility = visibilityFilter(viewer);
  const conditions = [visibility.clause];
  const params = [...visibility.params];
  if (q) {
    const pattern = `%${escapeLikeTerm(q)}%`;
    conditions.push("(bp.title LIKE ? ESCAPE '!' OR bp.content LIKE ? ESCAPE '!')");
    params.push(pattern, pattern);
  }
  if (authorId != null) {
    conditions.push('bp.user_id = ?');
    params.push(authorId);
  } else if (authorName) {
    conditions.push('u.name = ?');
    params.push(authorName);
  }
  if (from) {
    conditions.push('bp.created_at >= ?');
    params.push(`${from} 00:00:00`);
  }
  if (to) {
    conditions.push('bp.created_at < ?');
    params.push(`${addDay(to)} 00:00:00`);
  }
  const orderBy = sort === 'oldest'
    ? 'bp.created_at ASC, bp.id ASC'
    : 'bp.created_at DESC, bp.id DESC';
  const [rows] = await db.query(
    `SELECT bp.*, u.name AS author_name
     FROM blog_posts bp JOIN users u ON u.id = bp.user_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
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

async function create({
  userId,
  title,
  content,
  coverImageUrl,
  mentionsPeople = false,
  consentConfirmed = false,
}) {
  const [result] = await db.query(
    "INSERT INTO blog_posts (user_id, title, content, cover_image_url, status, mentions_people, consent_confirmed) VALUES (?, ?, ?, ?, 'pending', ?, ?)",
    [userId, title, content, coverImageUrl || null, mentionsPeople, consentConfirmed]
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