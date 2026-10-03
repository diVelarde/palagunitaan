jest.mock('../models/geographicTagModel');
jest.mock('../models/categoryModel');
jest.mock('../models/heritageEntryModel');

const heritageEntryModel = require('../models/heritageEntryModel');
const { listEntries, deleteEntry } = require('../controllers/adminContentController');

function response() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
}

describe('admin heritage entry management', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists entries using bounded pagination', async () => {
    heritageEntryModel.findAllForAdmin.mockResolvedValue([{ id: 12, title: 'A story' }]);
    const res = response();

    await listEntries({ query: { limit: '500', offset: '-1' } }, res, jest.fn());

    expect(heritageEntryModel.findAllForAdmin).toHaveBeenCalledWith({ limit: 100, offset: 0 });
    expect(res.json).toHaveBeenCalledWith({ entries: [{ id: 12, title: 'A story' }] });
  });

  it('rejects invalid IDs and reports missing entries', async () => {
    const next = jest.fn();
    const invalidResponse = response();
    await deleteEntry({ params: { id: '0' } }, invalidResponse, next);
    expect(invalidResponse.status).toHaveBeenCalledWith(400);
    expect(heritageEntryModel.deleteById).not.toHaveBeenCalled();

    heritageEntryModel.deleteById.mockResolvedValue(false);
    const missingResponse = response();
    await deleteEntry({ params: { id: '22' } }, missingResponse, next);
    expect(missingResponse.status).toHaveBeenCalledWith(404);
  });

  it('deletes an existing entry and returns no content', async () => {
    heritageEntryModel.deleteById.mockResolvedValue(true);
    const res = response();

    await deleteEntry({ params: { id: '22' } }, res, jest.fn());

    expect(heritageEntryModel.deleteById).toHaveBeenCalledWith(22);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
