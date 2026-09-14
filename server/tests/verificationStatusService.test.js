const { isValidDecision, canReview, resolveOutcome, DECISION_RULES } = require('../services/verificationStatusService');

describe('isValidDecision', () => {
  it('accepts approved, disputed, rejected', () => {
    expect(isValidDecision('approved')).toBe(true);
    expect(isValidDecision('disputed')).toBe(true);
    expect(isValidDecision('rejected')).toBe(true);
  });
  it('rejects anything else', () => {
    expect(isValidDecision('published')).toBe(false);
    expect(isValidDecision('')).toBe(false);
    expect(isValidDecision(undefined)).toBe(false);
  });
});

describe('canReview', () => {
  it('allows review only when status is pending', () => {
    expect(canReview({ status: 'pending' })).toBe(true);
    expect(canReview({ status: 'published' })).toBe(false);
    expect(canReview({ status: 'draft' })).toBe(false);
    expect(canReview({ status: 'rejected' })).toBe(false);
  });
});

describe('resolveOutcome', () => {
  it('maps approved -> verified + published', () => {
    expect(resolveOutcome('approved')).toEqual({ verificationStatus: 'verified', entryStatus: 'published' });
  });
  it('maps disputed -> disputed + still published (visible but flagged)', () => {
    expect(resolveOutcome('disputed')).toEqual({ verificationStatus: 'disputed', entryStatus: 'published' });
  });
  it('maps rejected -> unverified + rejected (never public)', () => {
    expect(resolveOutcome('rejected')).toEqual({ verificationStatus: 'unverified', entryStatus: 'rejected' });
  });
  it('throws on an unknown decision rather than silently defaulting', () => {
    expect(() => resolveOutcome('maybe')).toThrow(/Unknown review decision/);
  });
  it('every entry status DECISION_RULES can produce is a real workflow status', () => {
    const validStatuses = ['draft', 'pending', 'published', 'rejected'];
    Object.values(DECISION_RULES).forEach((rule) => expect(validStatuses).toContain(rule.entryStatus));
  });
});
