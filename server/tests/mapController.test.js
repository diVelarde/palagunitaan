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
      { entry_id: 1, title: 'The Aswang of San Isidro', category_auto: 'Legend', verification_status: 'verified', latitude: '13.62', longitude: '123.19', location_name: 'San Isidro' },
    ]);
    heritageSiteModel.findAll.mockResolvedValue([
      { id: 5, name: 'Peñafrancia Basilica', description: 'Shrine', is_highlighted: 1, latitude: '13.63', longitude: '123.18' },
    ]);

    const res = mockRes();
    await getMapData({}, res, jest.fn());

    const { markers } = res.json.mock.calls[0][0];
    expect(markers).toHaveLength(2);

    const entryMarker = markers.find((m) => m.type === 'entry');
    expect(entryMarker).toMatchObject({ id: 1, title: 'The Aswang of San Isidro', latitude: 13.62, longitude: 123.19 });
    expect(typeof entryMarker.latitude).toBe('number');

    const siteMarker = markers.find((m) => m.type === 'site');
    expect(siteMarker).toMatchObject({ id: 5, title: 'Peñafrancia Basilica', isHighlighted: true });
  });

  it('calls next(err) instead of throwing when a model rejects', async () => {
    geographicTagModel.findTagsForPublishedEntries.mockRejectedValue(new Error('connection lost'));
    heritageSiteModel.findAll.mockResolvedValue([]);
    const next = jest.fn();
    await getMapData({}, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
