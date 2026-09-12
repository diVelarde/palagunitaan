const db = require('../config/db');

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM heritage_entries WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findByUser(userId) {
  const [rows] = await db.query(
    'SELECT * FROM heritage_entries WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
}

async function findPublished({ limit = 20, offset = 0 } = {}) {
  const [rows] = await db.query(
    `SELECT * FROM heritage_entries
     WHERE status = 'published'
     ORDER BY published_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows;
}

async function search({ keyword, category, region, verificationStatus, historicalPeriod, limit = 20, offset = 0 } = {}) {
  const conditions = [`status = 'published'`];
  const params = [];

  if (keyword) {
    conditions.push('(title LIKE ? OR raw_content LIKE ? OR euphemistic_content LIKE ?)');
    const like = `%${keyword}%`;
    params.push(like, like, like);
  }
  if (category) { conditions.push('category_auto = ?'); params.push(category); }
  if (region) { conditions.push('region_id = ?'); params.push(region); }
  if (verificationStatus) { conditions.push('verification_status = ?'); params.push(verificationStatus); }
  if (historicalPeriod) { conditions.push('historical_period = ?'); params.push(historicalPeriod); }

  const [rows] = await db.query(
    `SELECT * FROM heritage_entries WHERE ${conditions.join(' AND ')} ORDER BY published_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return rows;
}

async function create({ userId, title, rawContent, sourceType, sourceDescription, historicalPeriod }) {
  const [result] = await db.query(
    `INSERT INTO heritage_entries
      (user_id, title, raw_content, source_type, source_description, historical_period, status, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
    [userId, title, rawContent, sourceType || null, sourceDescription || null, historicalPeriod || null]
  );
  return findById(result.insertId);
}

async function updateStatus(id, status) {
  const publishedAtClause = status === 'published' ? ', published_at = NOW()' : '';
  await db.query(`UPDATE heritage_entries SET status = ? ${publishedAtClause} WHERE id = ?`, [status, id]);
  return findById(id);
}

async function updateCategoryAuto(id, categoryAuto) {
  await db.query('UPDATE heritage_entries SET category_auto = ? WHERE id = ?', [categoryAuto, id]);
  return findById(id);
}

async function updateEuphemisticContent(id, euphemisticContent) {
  await db.query('UPDATE heritage_entries SET euphemistic_content = ? WHERE id = ?', [euphemisticContent, id]);
  return findById(id);
}

async function findAllPublishedForTimeline() {
  const [rows] = await db.query(
    `SELECT id, title, historical_period, verification_status, category_auto, published_at
     FROM heritage_entries
     WHERE status = 'published' AND historical_period IS NOT NULL
     ORDER BY published_at DESC
     LIMIT 500`
  );
  return rows;
}

async function findPending() {
  const [rows] = await db.query(`SELECT * FROM heritage_entries WHERE status = 'pending' ORDER BY submitted_at ASC`);
  return rows;
}

async function updateVerification(id, { status, verificationStatus }) {
  const publishedAtClause = status === 'published' ? ', published_at = NOW()' : '';
  await db.query(
    `UPDATE heritage_entries SET status = ?, verification_status = ? ${publishedAtClause} WHERE id = ?`,
    [status, verificationStatus, id]
  );
  return findById(id);
}


module.exports = { 
  findById, 
  findByUser, 
  findPublished, 
  search, 
  create, 
  updateStatus, 
  updateCategoryAuto, 
  updateEuphemisticContent,
  findAllPublishedForTimeline,
  findPending,
  updateVerification
};