jest.mock('../models/highlightModel');
jest.mock('../models/heritageEntryModel');
jest.mock('../models/heritageSiteModel');

const highlightModel = require('../models/highlightModel');
const heritageSiteModel = require('../models/heritageSiteModel');
const { createHighlight } = require('../controllers/highlightController');

describe('createHighlight', () => {
  it('creates a highlight for an existing heritage site', async () => {
    heritageSiteModel.findById.mockResolvedValue({ id: 5, name: 'Peñafrancia Basilica' });
    highlightModel.create.mockResolvedValue({ id: 12, heritage_site_id: 5 });
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    await createHighlight({
      body: {
        heritageSiteId: 5,
        periodType: 'week',
        startsOn: '2026-10-11',
        endsOn: '2026-10-17',
      },
      user: { id: 7 },
    }, res, jest.fn());

    expect(highlightModel.create).toHaveBeenCalledWith({
      heritageEntryId: null,
      heritageSiteId: 5,
      periodType: 'week',
      startsOn: '2026-10-11',
      endsOn: '2026-10-17',
      createdBy: 7,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ highlight: { id: 12, heritage_site_id: 5 } });
  });
});
