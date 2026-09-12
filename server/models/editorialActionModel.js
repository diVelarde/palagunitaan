const db = require('../config/db');

async function create({ heritageEntryId, validatorId, actionType, comment }) {
  const [result] = await db.query(
    'INSERT INTO editorial_actions (heritage_entry_id, validator_id, action_type, comment) VALUES (?, ?, ?, ?)',
    [heritageEntryId, validatorId, actionType, comment || null]
  );
  const [rows] = await db.query('SELECT * FROM editorial_actions WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function findByEntry(heritageEntryId) {
  const [rows] = await db.query(
    `SELECT ea.*, u.name AS validator_name
     FROM editorial_actions ea
     JOIN users u ON u.id = ea.validator_id
     WHERE ea.heritage_entry_id = ?
     ORDER BY ea.action_date DESC`,
    [heritageEntryId]
  );
  return rows;
}

module.exports = { create, findByEntry };
