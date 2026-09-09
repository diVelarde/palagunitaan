const db = require('../config/db');

async function findAllRegions() {
  const [rows] = await db.query('SELECT * FROM regions ORDER BY name');
  return rows;
}

async function findRegionById(id) {
  const [rows] = await db.query('SELECT * FROM regions WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findTagByEntry(heritageEntryId) {
  const [rows] = await db.query('SELECT * FROM geographic_tags WHERE heritage_entry_id = ?', [heritageEntryId]);
  return rows[0] || null;
}

async function setTag({ heritageEntryId, latitude, longitude, locationName }) {
  const existing = await findTagByEntry(heritageEntryId);
  if (existing) {
    await db.query(
      'UPDATE geographic_tags SET latitude = ?, longitude = ?, location_name = ? WHERE heritage_entry_id = ?',
      [latitude, longitude, locationName || null, heritageEntryId]
    );
  } else {
    await db.query(
      'INSERT INTO geographic_tags (heritage_entry_id, latitude, longitude, location_name) VALUES (?, ?, ?, ?)',
      [heritageEntryId, latitude, longitude, locationName || null]
    );
  }
  return findTagByEntry(heritageEntryId);
}

async function findTagsForPublishedEntries() {
  const [rows] = await db.query(
    `SELECT gt.id, gt.latitude, gt.longitude, gt.location_name,
            he.id AS entry_id, he.title, he.category_auto, he.verification_status
     FROM geographic_tags gt
     JOIN heritage_entries he ON he.id = gt.heritage_entry_id
     WHERE he.status = 'published'`
  );
  return rows;
}

module.exports = { findAllRegions, findRegionById, findTagByEntry, setTag, findTagsForPublishedEntries };
