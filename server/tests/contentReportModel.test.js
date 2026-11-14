jest.mock('../config/db', () => ({ query: jest.fn() }));

const db = require('../config/db');
const contentReportModel = require('../models/contentReportModel');

describe('contentReportModel', () => {
  beforeEach(() => db.query.mockReset());

  it('finds an existing open report for the same reporter and target', async () => {
    const report = { id: 4 };
    db.query.mockResolvedValue([[report]]);

    await expect(contentReportModel.findOpenDuplicate({
      reporterId: 7,
      targetType: 'blog_post',
      targetId: 12,
    })).resolves.toEqual(report);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("status = 'open'"),
      [7, 'blog_post', 12]
    );
  });

  it('creates a report and fetches its target and reporter labels', async () => {
    const report = { id: 5, target_type: 'entry', target_id: 33 };
    db.query
      .mockResolvedValueOnce([{ insertId: 5 }])
      .mockResolvedValueOnce([[report]]);

    await expect(contentReportModel.create({
      reporterId: 7,
      targetType: 'entry',
      targetId: 33,
      reason: 'Wrong information',
      message: 'The date in this entry is incorrect.',
    })).resolves.toEqual(report);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO content_reports'),
      [7, 'entry', 33, 'Wrong information', 'The date in this entry is incorrect.']
    );
    expect(db.query.mock.calls[1][0]).toContain("he.id = cr.target_id");
    expect(db.query.mock.calls[1][0]).toContain("bp.id = cr.target_id");
  });

  it('lists reports by status in oldest-first order', async () => {
    db.query.mockResolvedValue([[{ id: 6, status: 'open' }]]);

    await expect(contentReportModel.findByStatus('open')).resolves.toEqual([{ id: 6, status: 'open' }]);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE cr.status = ?'),
      ['open']
    );
    expect(db.query.mock.calls[0][0]).toContain('ORDER BY cr.created_at ASC, cr.id ASC');
  });

  it('closes only an open report and returns the closed record', async () => {
    const report = { id: 6, status: 'closed' };
    db.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[report]]);

    await expect(contentReportModel.close(6)).resolves.toEqual(report);
    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("SET status = 'closed' WHERE id = ? AND status = 'open'"),
      [6]
    );
  });

  it('returns null when the report is missing or already closed', async () => {
    db.query.mockResolvedValue([{ affectedRows: 0 }]);

    await expect(contentReportModel.close(6)).resolves.toBeNull();
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});
