const geographicTagModel = require('../models/geographicTagModel');
const heritageSiteModel = require('../models/heritageSiteModel');

const APPROXIMATE_PROVINCE_COORDINATES = {
  sorsogon: { latitude: 12.9731, longitude: 124.0053 },
};

function isValidCoordinates(coordinates) {
  return coordinates
    && Number.isFinite(coordinates.latitude)
    && coordinates.latitude >= -90
    && coordinates.latitude <= 90
    && Number.isFinite(coordinates.longitude)
    && coordinates.longitude >= -180
    && coordinates.longitude <= 180;
}

async function getMapData(req, res, next) {
  try {
    const [taggedEntries, sites] = await Promise.all([
      geographicTagModel.findTagsForPublishedEntries(),
      heritageSiteModel.findAll(),
    ]);

    const entryMarkers = taggedEntries.flatMap((row) => {
      const hasPinnedCoordinates = row.latitude != null && row.longitude != null;
      const province = row.region_province || row.region_name;
      const approximateCoordinates = APPROXIMATE_PROVINCE_COORDINATES[String(province || '').trim().toLowerCase()];
      const coordinates = hasPinnedCoordinates
        ? { latitude: Number(row.latitude), longitude: Number(row.longitude) }
        : approximateCoordinates;
      if (!isValidCoordinates(coordinates)) return [];
      const isApproximate = !hasPinnedCoordinates;
      return [{
        type: 'entry',
        id: row.entry_id,
        title: row.title,
        category: row.category_auto,
        verificationStatus: row.verification_status,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        locationName: row.location_name || (isApproximate ? `${province} (approximate)` : null),
        approximateLocation: isApproximate,
        regionName: province,
      }];
    });

    const siteMarkers = sites.flatMap((site) => {
      if (site.latitude == null || site.longitude == null) return [];
      const coordinates = { latitude: Number(site.latitude), longitude: Number(site.longitude) };
      if (!isValidCoordinates(coordinates)) return [];
      return [{
        type: 'site',
        id: site.id,
        title: site.name,
        description: site.description,
        imageUrl: site.image_url,
        isHighlighted: Boolean(site.is_highlighted),
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      }];
    });

    res.json({ markers: [...entryMarkers, ...siteMarkers] });
  } catch (err) {
    next(err);
  }
}

async function getRegions(req, res, next) {
  try {
    res.json({ regions: await geographicTagModel.findAllRegions() });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMapData, getRegions };
