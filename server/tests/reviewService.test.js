jest.mock('../models/heritageEntryModel');
jest.mock('../models/editorialActionModel');
jest.mock('../models/claimAssessmentModel');
jest.mock('../services/notificationService');

const heritageEntryModel = require('../models/heritageEntryModel');
const editorialActionModel = require('../models/editorialActionModel');
const claimAssessmentModel = require('../models/claimAssessmentModel');
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
  claimAssessmentModel.createMany.mockResolvedValue({ affectedRows: 1 });
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

  it('publishes as unverified when approved_unverified is selected', async () => {
    editorialActionModel.create.mockResolvedValueOnce({ id: 100, action_type: 'approved_unverified' });

    const { entry, action } = await reviewEntry({
      entryId: 1,
      validatorId: 2,
      decision: 'approved_unverified',
      comment: null,
    });

    expect(entry.status).toBe('published');
    expect(entry.verification_status).toBe('unverified');
    expect(action.action_type).toBe('approved_unverified');
    expect(editorialActionModel.create).toHaveBeenCalledWith({
      heritageEntryId: 1,
      validatorId: 2,
      actionType: 'approved_unverified',
      comment: null,
    });
    expect(notificationService.notifyReviewDecision).toHaveBeenCalledWith({
      entry,
      decision: 'approved_unverified',
    });
  });

  it('saves each claim assessment linked to the editorial action', async () => {
    heritageEntryModel.findById.mockResolvedValue({
      ...PENDING_ENTRY,
      history_claims: [{ id: 31 }, { id: 32 }],
    });
    const assessments = [
      {
        historyClaimId: 31,
        sourceTypeFit: 'met',
        sourceCredibility: 'partly',
        corroboration: 'met',
        claimedYearSupported: 'not_met',
        notes: 'Two independent accounts support the source type.',
      },
      {
        historyClaimId: 32,
        sourceTypeFit: 'partly',
        sourceCredibility: 'met',
        corroboration: 'partly',
        claimedYearSupported: 'met',
        notes: null,
      },
    ];

    await reviewEntry({
      entryId: 1,
      validatorId: 2,
      decision: 'approved',
      assessments,
    });

    expect(editorialActionModel.create).toHaveBeenCalled();
    expect(claimAssessmentModel.createMany).toHaveBeenCalledWith([
      { ...assessments[0], heritageEntryId: 1, validatorId: 2, editorialActionId: 99 },
      { ...assessments[1], heritageEntryId: 1, validatorId: 2, editorialActionId: 99 },
    ]);
    expect(editorialActionModel.create.mock.invocationCallOrder[0])
      .toBeLessThan(claimAssessmentModel.createMany.mock.invocationCallOrder[0]);
  });

  it.each([
    ['approved without assessments', 'approved', undefined],
    ['approved with an empty assessment list', 'approved', []],
    ['approved_unverified without assessments', 'approved_unverified', undefined],
    ['a claim from another entry', 'approved', [{ historyClaimId: 99 }]],
  ])('does not approve when assessments are invalid: %s', async (_label, decision, assessments) => {
    heritageEntryModel.findById.mockResolvedValue({
      ...PENDING_ENTRY,
      history_claims: [{ id: 31 }],
    });

    await expect(reviewEntry({
      entryId: 1,
      validatorId: 2,
      decision,
      assessments,
    })).rejects.toMatchObject({ statusCode: 400 });

    expect(heritageEntryModel.updateVerification).not.toHaveBeenCalled();
    expect(editorialActionModel.create).not.toHaveBeenCalled();
    expect(claimAssessmentModel.createMany).not.toHaveBeenCalled();
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

  it('prevents contributors from reviewing their own entries', async () => {
    await expect(reviewEntry({ entryId: 1, validatorId: '7', decision: 'disputed' }))
      .rejects.toMatchObject({
        message: 'You cannot review your own submission.',
        statusCode: 403,
      });

    expect(heritageEntryModel.updateVerification).not.toHaveBeenCalled();
    expect(editorialActionModel.create).not.toHaveBeenCalled();
    expect(notificationService.notifyReviewDecision).not.toHaveBeenCalled();
  });

  it.each(['approved', 'disputed', 'rejected'])(
    'blocks self-review with a ReviewError for the %s decision',
    async (decision) => {
      const error = await reviewEntry({
        entryId: 1,
        validatorId: 7,
        decision,
        comment: 'review comment',
      }).catch((err) => err);
      expect(error).toBeInstanceOf(ReviewError);
      expect(error).toMatchObject({
        message: 'You cannot review your own submission.',
        statusCode: 403,
      });

      expect(heritageEntryModel.updateVerification).not.toHaveBeenCalled();
      expect(editorialActionModel.create).not.toHaveBeenCalled();
      expect(notificationService.notifyReviewDecision).not.toHaveBeenCalled();
    }
  );

  it('blocks self-review for an administrator by the same user id', async () => {
    const administratorId = PENDING_ENTRY.user_id;
    await expect(reviewEntry({ entryId: 1, validatorId: administratorId, decision: 'approved' }))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(heritageEntryModel.updateVerification).not.toHaveBeenCalled();
    expect(editorialActionModel.create).not.toHaveBeenCalled();
    expect(notificationService.notifyReviewDecision).not.toHaveBeenCalled();
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
