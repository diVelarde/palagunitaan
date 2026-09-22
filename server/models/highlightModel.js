const db = require('../config/db');

async function findActive(periodType) {
  const [rows] = await db.query(
    `SELECT h.*, he.title, he.euphemistic_content, he.category_auto
     FROM highlights h
     JOIN heritage_entries he ON he.id = h.heritage_entry_id
     WHERE h.period_type = ? AND CURDATE() BETWEEN h.starts_on AND h.ends_on
     ORDER BY h.created_at DESC
     LIMIT 1`,
    [periodType]
  );
  return rows[0] || null;
}

async function findHistory({ limit = 20 } = {}) {
  const [rows] = await db.query(
    `SELECT h.*, he.title FROM highlights h JOIN heritage_entries he ON he.id = h.heritage_entry_id ORDER BY h.starts_on DESC LIMIT ?`,
    [limit]
  );
  return rows;
}

async function create({ heritageEntryId, periodType, startsOn, endsOn, createdBy }) {
  const [result] = await db.query(
    'INSERT INTO highlights (heritage_entry_id, period_type, starts_on, ends_on, created_by) VALUES (?, ?, ?, ?, ?)',
    [heritageEntryId, periodType, startsOn, endsOn, createdBy]
  );
  const [rows] = await db.query('SELECT * FROM highlights WHERE id = ?', [result.insertId]);
  return rows[0];
}

module.exports = { findActive, findHistory, create };