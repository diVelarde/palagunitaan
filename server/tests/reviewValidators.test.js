jest.mock('../models/heritageEntryModel', () => ({
  findById: jest.fn(),
}));

const heritageEntryModel = require('../models/heritageEntryModel');
const { validateReview } = require('../validators/reviewValidators');

function mockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

describe('validateReview assessments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    heritageEntryModel.findById.mockResolvedValue({ history_claims: [] });
  });

  it('allows an optional well-formed assessments array', () => {
    heritageEntryModel.findById.mockResolvedValue({ history_claims: [{ id: 31 }] });
    const req = {
      params: { id: '4' },
      body: {
        decision: 'approved',
        assessments: [{
          historyClaimId: 31,
          sourceTypeFit: 'met',
          sourceCredibility: 'partly',
          corroboration: 'not_met',
          claimedYearSupported: 'met',
          notes: 'Source notes.',
        }],
      },
    };
    const next = jest.fn();

    return validateReview(req, mockResponse(), next).then(() => {
      expect(next).toHaveBeenCalled();
    });
  });

  it('rejects invalid assessment values and malformed notes', () => {
    const req = {
      params: { id: '4' },
      body: {
        decision: 'approved',
        assessments: [{
          historyClaimId: 31,
          sourceTypeFit: 'yes',
          sourceCredibility: 'met',
          corroboration: 'met',
          claimedYearSupported: 'met',
          notes: 12,
        }],
      },
    };
    const res = mockResponse();
    const next = jest.fn();

    return validateReview(req, res, next).then(() => {
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid review.' }));
    });
  });

  it('requires one assessment per claim for approvals', async () => {
    heritageEntryModel.findById.mockResolvedValue({ history_claims: [{ id: 31 }, { id: 32 }] });
    const req = {
      params: { id: '4' },
      body: {
        decision: 'approved_unverified',
        assessments: [{
          historyClaimId: 31,
          sourceTypeFit: 'met',
          sourceCredibility: 'met',
          corroboration: 'met',
          claimedYearSupported: 'met',
        }],
      },
    };
    const res = mockResponse();
    const next = jest.fn();

    await validateReview(req, res, next);

    expect(heritageEntryModel.findById).toHaveBeenCalledWith('4');
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: expect.arrayContaining([
        'An assessment is required for every historical claim when approving.',
      ]),
    }));
  });

  it('rejects an assessment that references a claim from another entry', async () => {
    heritageEntryModel.findById.mockResolvedValue({ history_claims: [{ id: 31 }] });
    const req = {
      params: { id: '4' },
      body: {
        decision: 'approved',
        assessments: [{
          historyClaimId: 99,
          sourceTypeFit: 'met',
          sourceCredibility: 'met',
          corroboration: 'met',
          claimedYearSupported: 'met',
        }],
      },
    };
    const res = mockResponse();
    const next = jest.fn();

    await validateReview(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: expect.arrayContaining([
        'Each assessment must reference a different historical claim on this entry.',
      ]),
    }));
  });

  it('allows approvals without assessments when the entry has no history claims', async () => {
    const req = { params: { id: '4' }, body: { decision: 'approved' } };
    const next = jest.fn();

    await validateReview(req, mockResponse(), next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects assessments when the entry has no matching history claims', async () => {
    const req = {
      params: { id: '4' },
      body: {
        decision: 'rejected',
        assessments: [{
          historyClaimId: 31,
          sourceTypeFit: 'met',
          sourceCredibility: 'met',
          corroboration: 'met',
          claimedYearSupported: 'met',
        }],
      },
    };
    const res = mockResponse();
    const next = jest.fn();

    await validateReview(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
