const { validateHighlight } = require('../validators/highlightValidators');

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('validateHighlight', () => {
  const dates = { periodType: 'week', startsOn: '2026-10-11', endsOn: '2026-10-17' };

  it('accepts a heritage site target', () => {
    const req = { body: { heritageSiteId: 5, ...dates } };
    const res = createResponse();
    const next = jest.fn();

    validateHighlight(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('requires exactly one valid entry or site target', () => {
    const req = { body: { heritageEntryId: 'invalid', heritageSiteId: 5, ...dates } };
    const res = createResponse();
    const next = jest.fn();

    validateHighlight(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
