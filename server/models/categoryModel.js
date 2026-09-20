const db = require('../config/db');

async function findAllCategories() {
  const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
  return rows;
}
async function findCategoryById(id) {
  const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0] || null;
}
async function findCategoryByName(name) {
  const [rows] = await db.query('SELECT * FROM categories WHERE name = ?', [name]);
  return rows[0] || null;
}
async function createCategory({ name, description }) {
  const [result] = await db.query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description || null]);
  return findCategoryById(result.insertId);
}
async function updateCategory(id, { name, description }) {
  await db.query('UPDATE categories SET name = ?, description = ? WHERE id = ?', [name, description || null, id]);
  return findCategoryById(id);
}
async function deleteCategory(id) {
  await db.query('DELETE FROM categories WHERE id = ?', [id]); // cascades to metadata_fields
}
async function findFieldsByCategory(categoryId) {
  const [rows] = await db.query('SELECT * FROM metadata_fields WHERE category_id = ? ORDER BY id', [categoryId]);
  return rows;
}
async function createField({ categoryId, fieldName, fieldType }) {
  const [result] = await db.query('INSERT INTO metadata_fields (category_id, field_name, field_type) VALUES (?, ?, ?)', [categoryId, fieldName, fieldType || 'text']);
  const [rows] = await db.query('SELECT * FROM metadata_fields WHERE id = ?', [result.insertId]);
  return rows[0];
}
async function updateField(id, { fieldName, fieldType }) {
  await db.query('UPDATE metadata_fields SET field_name = ?, field_type = ? WHERE id = ?', [fieldName, fieldType, id]);
  const [rows] = await db.query('SELECT * FROM metadata_fields WHERE id = ?', [id]);
  return rows[0];
}
async function deleteField(id) {
  await db.query('DELETE FROM metadata_fields WHERE id = ?', [id]);
}
async function findValuesByEntry(heritageEntryId) {
  const [rows] = await db.query(
    `SELECT mv.id, mv.field_value, mf.field_name, mf.field_type FROM metadata_values mv JOIN metadata_fields mf ON mf.id = mv.metadata_field_id WHERE mv.heritage_entry_id = ?`,
    [heritageEntryId]
  );
  return rows;
}
async function setValue({ heritageEntryId, metadataFieldId, fieldValue }) {
  await db.query('INSERT INTO metadata_values (heritage_entry_id, metadata_field_id, field_value) VALUES (?, ?, ?)', [heritageEntryId, metadataFieldId, fieldValue]);
}

module.exports = {
  findAllCategories, 
  findCategoryById, 
  findCategoryByName, 
  createCategory,
  updateCategory, 
  deleteCategory, 
  findFieldsByCategory, 
  createField,
  updateField, 
  deleteField, 
  findValuesByEntry, 
  setValue,
};