const heritageEntryModel = require('../models/heritageEntryModel');
const multimediaAssetModel = require('../models/multimediaAssetModel');
const cloudinaryService = require('../services/cloudinaryService');

async function uploadMedia(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    if (!cloudinaryService.isAllowedMimeType(req.file.mimetype)) {
      return res.status(400).json({ message: 'Only image or audio files are allowed.' });
    }

    const entry = await heritageEntryModel.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found.' });

    if (entry.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only add media to your own entries.' });
    }

    const result = await cloudinaryService.uploadBuffer(req.file.buffer, { mimetype: req.file.mimetype });
    const asset = await multimediaAssetModel.create({ heritageEntryId: entry.id, fileUrl: result.secure_url, fileType: result.resource_type });
    res.status(201).json({ asset });
  } catch (err) { next(err); }
}

async function listMedia(req, res, next) {
  try { res.json({ assets: await multimediaAssetModel.findByEntry(req.params.id) }); } catch (err) { next(err); }
}

module.exports = { uploadMedia, listMedia };
