function validateRegion(req, res, next) {
  const { name, province } = req.body;
  const errors = [];
  if (!name || !name.trim()) errors.push('name is required.');
  if (!province || !province.trim()) errors.push('province is required.');
  if (errors.length) return res.status(400).json({ message: 'Invalid region.', errors });
  next();
}

function validateCategory(req, res, next) {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: 'name is required.' });
  next();
}

const VALID_FIELD_TYPES = ['text', 'number', 'date', 'boolean', 'select'];
function validateField(req, res, next) {
  const { fieldName, fieldType } = req.body;
  const errors = [];
  if (!fieldName || !fieldName.trim()) errors.push('fieldName is required.');
  if (fieldType && !VALID_FIELD_TYPES.includes(fieldType)) errors.push(`fieldType must be one of: ${VALID_FIELD_TYPES.join(', ')}.`);
  if (errors.length) return res.status(400).json({ message: 'Invalid field.', errors });
  next();
}

module.exports = { validateRegion, validateCategory, validateField };