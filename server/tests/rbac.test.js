const { requireRole } = require('../middleware/roleMiddleware');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('requireRole', () => {
  it('calls next() when the user has an allowed role', () => {
    const middleware = requireRole('admin');
    const next = jest.fn();
    middleware({ user: { role: 'admin' } }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('allows any of multiple listed roles', () => {
    const middleware = requireRole('validator', 'admin');
    const next = jest.fn();
    middleware({ user: { role: 'validator' } }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects with 403 when the role is not in the allowed list', () => {
    const middleware = requireRole('admin');
    const res = mockRes();
    const next = jest.fn();
    middleware({ user: { role: 'contributor' } }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('rejects with 401 when there is no authenticated user at all', () => {
    const middleware = requireRole('admin');
    const res = mockRes();
    const next = jest.fn();
    middleware({}, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('never grants access based on req.session.viewRole — only req.user.role counts', () => {
    // Simulates a contributor who has switched their VIEW to admin (AUTH-003).
    // requireRole must ignore that entirely.
    const middleware = requireRole('admin');
    const res = mockRes();
    const next = jest.fn();
    const req = { user: { role: 'contributor' }, session: { viewRole: 'admin' } };
    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('adminRoutes RBAC coverage', () => {
  it('adminRoutes applies requireAuth and requireRole before mounting any sub-router', () => {
    const adminRoutesSource = require('fs').readFileSync(require.resolve('../routes/adminRoutes'), 'utf8');
    const guardIndex = adminRoutesSource.indexOf("router.use(requireAuth, requireRole('admin'))");
    const firstMountIndex = adminRoutesSource.indexOf("router.use('/");
    expect(guardIndex).toBeGreaterThan(-1);
    expect(firstMountIndex).toBeGreaterThan(guardIndex);
  });
});