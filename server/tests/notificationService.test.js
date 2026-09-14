jest.mock('../models/notificationModel');
const notificationModel = require('../models/notificationModel');
const { notifyReviewDecision } = require('../services/notificationService');

const ENTRY = { id: 1, user_id: 7, title: 'The Aswang of San Isidro' };

beforeEach(() => {
  jest.clearAllMocks();
  notificationModel.create.mockResolvedValue({ id: 1 });
});

describe('notifyReviewDecision', () => {
  it('creates a notification addressed to the entry OWNER, not the validator', async () => {
    await notifyReviewDecision({ entry: ENTRY, decision: 'approved' });
    expect(notificationModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: ENTRY.user_id, heritageEntryId: ENTRY.id, type: 'entry_reviewed' })
    );
  });

  it('mentions the entry title in the message for each decision type', async () => {
    for (const decision of ['approved', 'disputed', 'rejected']) {
      await notifyReviewDecision({ entry: ENTRY, decision });
      const [[call]] = notificationModel.create.mock.calls.slice(-1);
      expect(call.message).toContain(ENTRY.title);
    }
  });

  it('does not throw and returns null for an unrecognized decision', async () => {
    const result = await notifyReviewDecision({ entry: ENTRY, decision: 'something-new' });
    expect(result).toBeNull();
    expect(notificationModel.create).not.toHaveBeenCalled();
  });
});
