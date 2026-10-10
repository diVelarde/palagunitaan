const { validateRoleRequest } = require('../validators/roleRequestValidators');

function validate(role, body) {
  const req = { user: { role }, body };
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
  const next = jest.fn();
  validateRoleRequest(req, res, next);
  return { next, res };
}

describe('role request validation', () => {
  it('allows a regular user to request contributor access with qualifications', () => {
    const { next, res } = validate('public', {
      requestedRole: 'contributor',
      qualifications: 'I have collected oral histories in my community.',
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });

  it('requires qualifications', () => {
    const { next, res } = validate('contributor', {
      requestedRole: 'validator',
      qualifications: '   ',
    });
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.payload.message).toMatch(/qualifications/i);
  });

  it('only allows requesting the next role in the upgrade path', () => {
    const { next, res } = validate('public', {
      requestedRole: 'admin',
      qualifications: 'I meet the role requirements.',
    });
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });
});
