const db = require('../config/db');

const TRANSIENT_CONNECTION_ERRORS = new Set(['ECONNRESET', 'PROTOCOL_CONNECTION_LOST']);

async function queryActiveHighlight(periodType) {
  const sql = `SELECT h.*,
       CASE WHEN h.heritage_site_id IS NOT NULL THEN 'site' ELSE 'entry' END AS target_type,
       he.title, he.raw_content, he.euphemistic_content, he.category_auto, he.cover_image_url,
       hs.name AS site_name, hs.description AS site_description, hs.image_url AS site_image_url,
       hs.latitude AS site_latitude, hs.longitude AS site_longitude
     FROM highlights h
     LEFT JOIN heritage_entries he ON he.id = h.heritage_entry_id
     LEFT JOIN heritage_sites hs ON hs.id = h.heritage_site_id
     WHERE h.period_type = ?
       AND (h.heritage_entry_id IS NULL OR he.status = 'published')
       AND CURDATE() BETWEEN h.starts_on AND h.ends_on
     ORDER BY h.created_at DESC
     LIMIT 1`;

  try {
    return await db.query(sql, [periodType]);
  } catch (err) {
    if (!TRANSIENT_CONNECTION_ERRORS.has(err.code)) throw err;
    console.warn(`Transient database connection error while loading ${periodType} highlight; retrying once (${err.code}).`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return db.query(sql, [periodType]);
  }
}

async function findActive(periodType) {
  const [rows] = await queryActiveHighlight(periodType);
  return rows[0] || null;
}

async function findHistory({ limit = 100, offset = 0 } = {}) {
  const [rows] = await db.query(
    `SELECT h.*,
            CASE WHEN h.heritage_site_id IS NOT NULL THEN 'site' ELSE 'entry' END AS target_type,
            he.title, he.status, he.category_auto, he.cover_image_url,
            hs.name AS site_name, hs.description AS site_description, hs.image_url AS site_image_url
     FROM highlights h
     LEFT JOIN heritage_entries he ON he.id = h.heritage_entry_id
     LEFT JOIN heritage_sites hs ON hs.id = h.heritage_site_id
     ORDER BY h.starts_on DESC, h.id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows;
}

async function create({ heritageEntryId = null, heritageSiteId = null, periodType, startsOn, endsOn, createdBy }) {
  const [result] = await db.query(
    'INSERT INTO highlights (heritage_entry_id, heritage_site_id, period_type, starts_on, ends_on, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [heritageEntryId, heritageSiteId, periodType, startsOn, endsOn, createdBy]
  );
  const [rows] = await db.query('SELECT * FROM highlights WHERE id = ?', [result.insertId]);
  return rows[0];
}

module.exports = { findActive, findHistory, create };