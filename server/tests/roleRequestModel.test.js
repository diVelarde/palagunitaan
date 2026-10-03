jest.mock('../config/db', () => ({ query: jest.fn() }));

const db = require('../config/db');
const { findAllPending } = require('../models/roleRequestModel');

describe('roleRequestModel.findAllPending', () => {
  beforeEach(() => db.query.mockReset());

  it('uses a non-reserved alias for the applicant role', async () => {
    const requests = [{ id: 5, applicant_role: 'contributor' }];
    db.query.mockResolvedValue([requests]);

    await expect(findAllPending()).resolves.toEqual(requests);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('u.role AS applicant_role'));
    expect(db.query.mock.calls[0][0]).not.toMatch(/AS current_role/i);
  });
});
