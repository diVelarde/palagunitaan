const db = require('../config/db');

async function create({ heritageEntryId, fileUrl, fileType }) {
  const [result] = await db.query('INSERT INTO multimedia_assets (heritage_entry_id, file_url, file_type) VALUES (?, ?, ?)', [heritageEntryId, fileUrl, fileType]);
  const [rows] = await db.query('SELECT * FROM multimedia_assets WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function findByEntry(heritageEntryId) {
  const [rows] = await db.query('SELECT * FROM multimedia_assets WHERE heritage_entry_id = ? ORDER BY created_at ASC', [heritageEntryId]);
  return rows;
}

module.exports = { create, findByEntry };
