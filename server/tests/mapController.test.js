jest.mock('../models/geographicTagModel');
jest.mock('../models/heritageSiteModel');

const geographicTagModel = require('../models/geographicTagModel');
const heritageSiteModel = require('../models/heritageSiteModel');
const { getMapData } = require('../controllers/mapController');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('getMapData', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches entries and sites in parallel, not sequentially', async () => {
    let entriesResolved = false;
    geographicTagModel.findTagsForPublishedEntries.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => { entriesResolved = true; resolve([]); }, 20))
    );
    heritageSiteModel.findAll.mockImplementation(async () => {
      expect(entriesResolved).toBe(false);
      return [];
    });
    await getMapData({}, mockRes(), jest.fn());
  });

  it('merges entries and sites into a single markers array with correct shape', async () => {
    geographicTagModel.findTagsForPublishedEntries.mockResolvedValue([
      { entry_id: 1, title: 'The Aswang of San Isidro', category_auto: 'Legend', verification_status: 'verified', latitude: '13.62', longitude: '123.19', location_name: 'San Isidro', region_name: 'Bicol Region', region_province: 'Camarines Sur' },
    ]);
    heritageSiteModel.findAll.mockResolvedValue([
      { id: 5, name: 'Peñafrancia Basilica', description: 'Shrine', image_url: 'https://example.test/basilica.jpg', is_highlighted: 1, latitude: '13.63', longitude: '123.18' },
    ]);

    const res = mockRes();
    await getMapData({}, res, jest.fn());

    const { markers } = res.json.mock.calls[0][0];
    expect(markers).toHaveLength(2);

    const entryMarker = markers.find((m) => m.type === 'entry');
    expect(entryMarker).toMatchObject({
      id: 1,
      title: 'The Aswang of San Isidro',
      latitude: 13.62,
      longitude: 123.19,
      regionName: 'Camarines Sur',
    });
    expect(typeof entryMarker.latitude).toBe('number');

    const siteMarker = markers.find((m) => m.type === 'site');
    expect(siteMarker).toMatchObject({
      id: 5,
      title: 'Peñafrancia Basilica',
      isHighlighted: true,
      imageUrl: 'https://example.test/basilica.jpg',
    });
  });

  it('maps region-only Sorsogon entries to an approximate province location', async () => {
    geographicTagModel.findTagsForPublishedEntries.mockResolvedValue([
      {
        entry_id: 2,
        title: 'Sorsogon story',
        category_auto: 'Oral history',
        verification_status: 'verified',
        latitude: null,
        longitude: null,
        location_name: null,
        region_province: 'Sorsogon',
        region_name: 'Bicol Region',
      },
    ]);
    heritageSiteModel.findAll.mockResolvedValue([]);

    const res = mockRes();
    await getMapData({}, res, jest.fn());

    expect(res.json.mock.calls[0][0].markers[0]).toMatchObject({
      type: 'entry',
      latitude: 12.9731,
      longitude: 124.0053,
      locationName: 'Sorsogon (approximate)',
      approximateLocation: true,
    });
  });

  it('omits heritage sites without valid coordinates', async () => {
    geographicTagModel.findTagsForPublishedEntries.mockResolvedValue([]);
    heritageSiteModel.findAll.mockResolvedValue([
      { id: 6, name: 'Unpinned site', latitude: null, longitude: null },
      { id: 7, name: 'Invalid site', latitude: 'not-a-number', longitude: '123.2' },
    ]);

    const res = mockRes();
    await getMapData({}, res, jest.fn());

    expect(res.json.mock.calls[0][0].markers).toEqual([]);
  });

  it('does not invent a location for unpinned entries outside supported regions', async () => {
    geographicTagModel.findTagsForPublishedEntries.mockResolvedValue([
      {
        entry_id: 3,
        title: 'Region story',
        latitude: null,
        longitude: null,
        region_province: 'Albay',
      },
    ]);
    heritageSiteModel.findAll.mockResolvedValue([]);

    const res = mockRes();
    await getMapData({}, res, jest.fn());

    expect(res.json.mock.calls[0][0].markers).toEqual([]);
  });

  it('calls next(err) instead of throwing when a model rejects', async () => {
    geographicTagModel.findTagsForPublishedEntries.mockRejectedValue(new Error('connection lost'));
    heritageSiteModel.findAll.mockResolvedValue([]);
    const next = jest.fn();
    await getMapData({}, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
