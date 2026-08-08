const db = require('../config/db');

async function findByGoogleId(googleId) {
  const [rows] = await db.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function createUser({ googleId, name, email, avatarUrl }) {
  const [result] = await db.query(
    'INSERT INTO users (google_id, name, email, avatar_url, role) VALUES (?, ?, ?, ?, ?)',
    [googleId, name, email, avatarUrl || null, 'public']
  );
  return findById(result.insertId);
}

async function updateRole(id, role) {
  await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  return findById(id);
}

module.exports = {
  findByGoogleId,
  findById,
  findByEmail,
  createUser,
  updateRole,
};