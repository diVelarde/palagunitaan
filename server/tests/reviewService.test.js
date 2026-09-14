jest.mock('../models/heritageEntryModel');
jest.mock('../models/editorialActionModel');
jest.mock('../services/notificationService');

const heritageEntryModel = require('../models/heritageEntryModel');
const editorialActionModel = require('../models/editorialActionModel');
const notificationService = require('../services/notificationService');
const { reviewEntry, ReviewError } = require('../services/reviewService');

const PENDING_ENTRY = { id: 1, user_id: 7, title: 'The Aswang of San Isidro', status: 'pending', raw_content: '...' };

beforeEach(() => {
  jest.clearAllMocks();
  heritageEntryModel.findById.mockResolvedValue({ ...PENDING_ENTRY });
  heritageEntryModel.updateVerification.mockImplementation(async (id, { status, verificationStatus }) => ({
    ...PENDING_ENTRY, status, verification_status: verificationStatus,
  }));
  editorialActionModel.create.mockResolvedValue({ id: 99, action_type: 'approved' });
  notificationService.notifyReviewDecision.mockResolvedValue({ id: 5 });
});

describe('reviewEntry', () => {
  it('approves: sets verified + published, records the action, notifies', async () => {
    const { entry, action } = await reviewEntry({ entryId: 1, validatorId: 2, decision: 'approved', comment: null });
    expect(entry.status).toBe('published');
    expect(entry.verification_status).toBe('verified');
    expect(action.id).toBe(99);
    expect(notificationService.notifyReviewDecision).toHaveBeenCalled();
  });

  it('disputes: entry stays published but flagged disputed', async () => {
    const { entry } = await reviewEntry({ entryId: 1, validatorId: 2, decision: 'disputed', comment: 'needs a second source' });
    expect(entry.status).toBe('published');
    expect(entry.verification_status).toBe('disputed');
  });

  it('rejects: entry never becomes published', async () => {
    const { entry } = await reviewEntry({ entryId: 1, validatorId: 2, decision: 'rejected', comment: 'unverifiable claim' });
    expect(entry.status).toBe('rejected');
  });

  it('throws a 404 ReviewError when the entry does not exist', async () => {
    heritageEntryModel.findById.mockResolvedValue(null);
    await expect(reviewEntry({ entryId: 999, validatorId: 2, decision: 'approved' })).rejects.toMatchObject({ statusCode: 404 });
    await expect(reviewEntry({ entryId: 999, validatorId: 2, decision: 'approved' })).rejects.toBeInstanceOf(ReviewError);
  });

  it('throws a 409 ReviewError when the entry is not pending', async () => {
    heritageEntryModel.findById.mockResolvedValue({ ...PENDING_ENTRY, status: 'published' });
    await expect(reviewEntry({ entryId: 1, validatorId: 2, decision: 'approved' })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('does not mutate the entry at all if the decision is invalid', async () => {
    await expect(reviewEntry({ entryId: 1, validatorId: 2, decision: 'maybe' })).rejects.toThrow();
    expect(heritageEntryModel.updateVerification).not.toHaveBeenCalled();
    expect(editorialActionModel.create).not.toHaveBeenCalled();
  });

  it('still returns the completed review even if notifying fails (fail-soft)', async () => {
    notificationService.notifyReviewDecision.mockRejectedValue(new Error('notif service down'));
    const { entry, action } = await reviewEntry({ entryId: 1, validatorId: 2, decision: 'approved' });
    expect(entry.status).toBe('published');
    expect(action).toBeDefined();
  });
});
