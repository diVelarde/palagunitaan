jest.mock('../config/db', () => ({ query: jest.fn() }));

const db = require('../config/db');
const { findAllPending, markReviewed } = require('../models/roleRequestModel');

describe('roleRequestModel.findAllPending', () => {
  beforeEach(() => db.query.mockReset());

  it('uses a non-reserved alias for the applicant role', async () => {
    const requests = [{ id: 5, applicant_role: 'contributor' }];
    db.query.mockResolvedValue([requests]);

    await expect(findAllPending()).resolves.toEqual(requests);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('u.role AS applicant_role'));
    expect(db.query.mock.calls[0][0]).not.toMatch(/AS current_role/i);
  });

  describe('roleRequestModel.markReviewed', () => {
    beforeEach(() => db.query.mockReset());

    it('saves the decision reason and returns the updated request', async () => {
      const updatedRequest = { id: 5, status: 'denied', decision_reason: 'Insufficient experience.' };
      db.query
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[updatedRequest]]);

      await expect(markReviewed(5, {
        status: 'denied',
        reviewedBy: 2,
        reason: 'Insufficient experience.',
      })).resolves.toEqual(updatedRequest);

      expect(db.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('decision_reason = ?'),
        ['denied', 2, 'Insufficient experience.', 5]
      );
      expect(db.query).toHaveBeenNthCalledWith(2, 'SELECT * FROM role_requests WHERE id = ?', [5]);
    });
  });
});
