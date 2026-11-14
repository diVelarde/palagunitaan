const {
  validateCreateReport,
  validateReportStatus,
  validateReportId,
} = require('../validators/contentReportValidators');

function runValidator(validator, { body = {}, params = {}, query = {} } = {}) {
  const req = { body, params, query };
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
  const next = jest.fn();
  validator(req, res, next);
  return { req, res, next };
}

describe('content report validation', () => {
  it('accepts a valid entry or blog-post report and normalizes its target id', () => {
    const { req, next, res } = runValidator(validateCreateReport, {
      body: {
        targetType: 'blog_post',
        targetId: '12',
        reason: 'Misleading cultural claim',
        message: 'A source disagrees with this claim.',
      },
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.reportTargetId).toBe(12);
    expect(res.statusCode).toBe(200);
  });

  it.each([
    [{ targetType: 'blog', targetId: 3, reason: 'Other' }],
    [{ targetType: 'entry', targetId: 0, reason: 'Other' }],
    [{ targetType: 'entry', targetId: 3, reason: 'Not an allowed reason' }],
    [{ targetType: 'entry', targetId: 3, reason: 'Other', message: 4 }],
  ])('rejects invalid report fields', (body) => {
    const { next, res } = runValidator(validateCreateReport, { body });
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });

  it('accepts open and closed status filters but rejects unknown values', () => {
    expect(runValidator(validateReportStatus, { query: { status: 'open' } }).next).toHaveBeenCalled();
    expect(runValidator(validateReportStatus, { query: { status: 'closed' } }).next).toHaveBeenCalled();
    const invalid = runValidator(validateReportStatus, { query: { status: 'pending' } });
    expect(invalid.next).not.toHaveBeenCalled();
    expect(invalid.res.statusCode).toBe(400);
  });

  it('requires a positive numeric report id when closing', () => {
    expect(runValidator(validateReportId, { params: { id: '12' } }).next).toHaveBeenCalled();
    const invalid = runValidator(validateReportId, { params: { id: '0' } });
    expect(invalid.next).not.toHaveBeenCalled();
    expect(invalid.res.statusCode).toBe(400);
  });
});
