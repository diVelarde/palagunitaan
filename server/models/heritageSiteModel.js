const db = require('../config/db');

async function findAll() {
  const [rows] = await db.query('SELECT * FROM heritage_sites ORDER BY created_at DESC');
  return rows;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM heritage_sites WHERE id = ?', [id]);
  return rows[0] || null;
}

async function create({ createdBy, name, description, latitude, longitude, isHighlighted, highlightPeriod }) {
  const [result] = await db.query(
    `INSERT INTO heritage_sites (created_by, name, description, latitude, longitude, is_highlighted, highlight_period)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [createdBy, name, description || null, latitude, longitude, Boolean(isHighlighted), highlightPeriod || null]
  );
  return findById(result.insertId);
}

async function update(id, { name, description, latitude, longitude, isHighlighted, highlightPeriod }) {
  await db.query(
    `UPDATE heritage_sites
     SET name = ?, description = ?, latitude = ?, longitude = ?, is_highlighted = ?, highlight_period = ?
     WHERE id = ?`,
    [name, description || null, latitude, longitude, Boolean(isHighlighted), highlightPeriod || null, id]
  );
  return findById(id);
}

async function remove(id) {
  await db.query('DELETE FROM heritage_sites WHERE id = ?', [id]);
}

module.exports = { findAll, findById, create, update, remove };
