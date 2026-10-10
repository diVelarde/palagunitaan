jest.mock('../models/categoryModel');

const { validateSubmission } = require('../validators/heritageEntryValidators');
const categoryModel = require('../models/categoryModel');

function validate(body) {
  const req = { body };
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
  const next = jest.fn();
  return validateSubmission(req, res, next).then(() => ({ res, next }));
}

const validEntry = {
  title: 'Juan Tamad',
  rawContent: 'A community account with enough detail to meet the minimum length.',
};

describe('heritage entry history claim validation', () => {
  beforeEach(() => categoryModel.findAllCategories.mockResolvedValue([]));

  it('accepts multiple claims with separate source years', async () => {
    const { next, res } = await validate({
      ...validEntry,
      historyClaims: [
        { claimedYear: 2003, sourceDescription: 'Interview', sourceYear: 2005 },
        { claimedYear: 1960, sourceDescription: 'Printed folklore collection', sourceYear: 1971 },
      ],
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });

  it('rejects claims without a valid year or source description', async () => {
    const { next, res } = await validate({
      ...validEntry,
      historyClaims: [{ claimedYear: 0, sourceDescription: ' ' }],
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.payload.errors).toEqual(expect.arrayContaining([
      expect.stringContaining('claimedYear'),
      expect.stringContaining('sourceDescription'),
    ]));
  });

  it('accepts an admin-configured category', async () => {
    categoryModel.findAllCategories.mockResolvedValue([{ name: 'Local Custom Category' }]);
    const { next, res } = await validate({
      ...validEntry,
      category: 'Local Custom Category',
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });
});
