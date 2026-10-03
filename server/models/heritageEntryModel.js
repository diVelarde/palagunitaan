const db = require('../config/db');

async function findById(id) {
  const [rows] = await db.query(
    `SELECT he.*, gt.latitude AS location_latitude, gt.longitude AS location_longitude,
            gt.location_name, r.name AS region_name, r.province AS region_province
     FROM heritage_entries he
     LEFT JOIN geographic_tags gt ON gt.heritage_entry_id = he.id
     LEFT JOIN regions r ON r.id = he.region_id
     WHERE he.id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  const [historyClaims] = await db.query(
    `SELECT id, claimed_year, source_type, source_description, source_year, source_url
     FROM heritage_entry_history_claims
     WHERE heritage_entry_id = ?
     ORDER BY claimed_year ASC, id ASC`,
    [id]
  );
  return { ...rows[0], history_claims: historyClaims };
}

async function findByUser(userId) {
  const [rows] = await db.query(
    'SELECT * FROM heritage_entries WHERE user_id = ? ORDER BY submitted_at DESC',
    [userId]
  );
  return rows;
}

async function findAllForAdmin({ limit = 50, offset = 0 } = {}) {
  const [rows] = await db.query(
    `SELECT id, title, status, verification_status, submitted_at, published_at
     FROM heritage_entries
     ORDER BY submitted_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows;
}

async function deleteById(id) {
  const connection = await db.getConnection();
  let transactionStarted = false;
  try {
    await connection.beginTransaction();
    transactionStarted = true;

    const [entries] = await connection.query(
      'SELECT id FROM heritage_entries WHERE id = ? FOR UPDATE',
      [id]
    );
    if (!entries.length) {
      await connection.rollback();
      transactionStarted = false;
      return false;
    }

    await connection.query(
      'UPDATE notifications SET heritage_entry_id = NULL WHERE heritage_entry_id = ?',
      [id]
    );
    await connection.query('DELETE FROM multimedia_assets WHERE heritage_entry_id = ?', [id]);
    await connection.query('DELETE FROM metadata_values WHERE heritage_entry_id = ?', [id]);
    await connection.query('DELETE FROM geographic_tags WHERE heritage_entry_id = ?', [id]);
    await connection.query('DELETE FROM editorial_actions WHERE heritage_entry_id = ?', [id]);
    await connection.query('DELETE FROM highlights WHERE heritage_entry_id = ?', [id]);
    await connection.query('DELETE FROM heritage_entry_history_claims WHERE heritage_entry_id = ?', [id]);
    await connection.query('DELETE FROM heritage_entries WHERE id = ?', [id]);

    await connection.commit();
    transactionStarted = false;
    return true;
  } catch (err) {
    if (transactionStarted) await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
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
  if (region) {
    conditions.push(`(
      region_id IN (SELECT id FROM regions WHERE name = ? OR province = ?)
      OR EXISTS (
        SELECT 1 FROM geographic_tags gt
        WHERE gt.heritage_entry_id = heritage_entries.id AND gt.location_name = ?
      )
    )`);
    params.push(region, region, region);
  }
  if (verificationStatus) { conditions.push('verification_status = ?'); params.push(verificationStatus); }
  if (historicalPeriod) { conditions.push('historical_period = ?'); params.push(historicalPeriod); }

  const [rows] = await db.query(
    `SELECT * FROM heritage_entries WHERE ${conditions.join(' AND ')} ORDER BY published_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return rows;
}

async function create({
  userId, title, rawContent, sourceType, sourceDescription, historicalPeriod,
  categoryAuto, regionId, historyClaims = [],
}) {
  const connection = await db.getConnection();
  let entryId;
  let transactionStarted = false;
  try {
    await connection.beginTransaction();
    transactionStarted = true;
    const [result] = await connection.query(
      `INSERT INTO heritage_entries
        (user_id, title, raw_content, source_type, source_description, historical_period, category_auto, region_id, status, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [userId, title, rawContent, sourceType || null, sourceDescription || null, historicalPeriod || null, categoryAuto || null, regionId || null]
    );
    entryId = result.insertId;
    if (historyClaims.length) {
      const values = historyClaims.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
      const params = historyClaims.flatMap((claim) => [
        entryId,
        claim.claimedYear,
        claim.sourceType || null,
        claim.sourceDescription.trim(),
        claim.sourceYear || null,
        claim.sourceUrl || null,
      ]);
      await connection.query(
        `INSERT INTO heritage_entry_history_claims
          (heritage_entry_id, claimed_year, source_type, source_description, source_year, source_url)
         VALUES ${values}`,
        params
      );
    }
    await connection.commit();
    transactionStarted = false;
  } catch (err) {
    if (transactionStarted) await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
  return findById(entryId);
}

async function findNeedingAiEnrichment({ limit = 25 } = {}) {
  const [rows] = await db.query(
    `SELECT * FROM heritage_entries
     WHERE category_auto IS NULL OR euphemistic_content IS NULL
     ORDER BY id ASC LIMIT ?`,
    [limit]
  );
  return rows;
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

async function updateTranslation(id, { translatedContent, translatedLanguage }) {
  await db.query(
    'UPDATE heritage_entries SET translated_content = ?, translated_language = ? WHERE id = ?',
    [translatedContent, translatedLanguage, id]
  );
  return findById(id);
}

async function updateCoverImage(id, coverImageUrl) {
  await db.query('UPDATE heritage_entries SET cover_image_url = ? WHERE id = ?', [coverImageUrl, id]);
  return findById(id);
}

module.exports = { 
  findById, 
  findByUser, 
  findAllForAdmin,
  deleteById,
  findPublished, 
  search, 
  create, 
  updateStatus, 
  updateCategoryAuto, 
  updateEuphemisticContent,
  findAllPublishedForTimeline,
  findPending,
  updateVerification,
  updateTranslation,
  updateCoverImage,
  findNeedingAiEnrichment
};