const geographicTagModel = require('../models/geographicTagModel');
const heritageSiteModel = require('../models/heritageSiteModel');

async function getMapData(req, res, next) {
  try {
    const [taggedEntries, sites] = await Promise.all([
      geographicTagModel.findTagsForPublishedEntries(),
      heritageSiteModel.findAll(),
    ]);

    const entryMarkers = taggedEntries.map((row) => ({
      type: 'entry',
      id: row.entry_id,
      title: row.title,
      category: row.category_auto,
      verificationStatus: row.verification_status,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      locationName: row.location_name,
    }));

    const siteMarkers = sites.map((site) => ({
      type: 'site',
      id: site.id,
      title: site.name,
      description: site.description,
      isHighlighted: Boolean(site.is_highlighted),
      latitude: Number(site.latitude),
      longitude: Number(site.longitude),
    }));

    res.json({ markers: [...entryMarkers, ...siteMarkers] });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMapData };
