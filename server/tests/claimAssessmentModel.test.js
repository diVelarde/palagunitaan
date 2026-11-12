jest.mock('../config/db', () => ({ query: jest.fn() }));

const db = require('../config/db');
const { createMany, findByEntryId } = require('../models/claimAssessmentModel');

const ASSESSMENT = {
  historyClaimId: 31,
  heritageEntryId: 4,
  validatorId: 2,
  editorialActionId: 99,
  sourceTypeFit: 'met',
  sourceCredibility: 'partly',
  corroboration: 'met',
  claimedYearSupported: 'not_met',
  notes: 'Source notes.',
};

describe('claimAssessmentModel', () => {
  beforeEach(() => {
    db.query.mockReset().mockResolvedValue([{ affectedRows: 1, insertId: 1 }]);
  });

  it('inserts multiple assessments in one parameterized query', async () => {
    const connection = { query: jest.fn().mockResolvedValue([{ affectedRows: 2 }]) };

    await createMany([ASSESSMENT, { ...ASSESSMENT, historyClaimId: 32, notes: null }], connection);

    expect(connection.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO claim_assessments'),
      [
        31, 4, 2, 99, 'met', 'partly', 'met', 'not_met', 'Source notes.',
        32, 4, 2, 99, 'met', 'partly', 'met', 'not_met', null,
      ]
    );
    expect(db.query).not.toHaveBeenCalled();
  });

  it('loads assessments for an entry in creation order', async () => {
    db.query.mockResolvedValueOnce([[{ id: 1 }]]);

    await findByEntryId(4);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY ca.created_at ASC, ca.id ASC'),
      [4]
    );
  });
});
