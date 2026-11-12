import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ValidatorDashboardPage from './ValidatorDashboardPage';

jest.mock('react-router-dom', () => ({
  Link: ({ to, children }) => require('react').createElement('a', { href: to }, children),
}));

const CLAIMS = [
  { id: 21, claimed_year: 1820, source_description: 'A regional archive record.' },
  { id: 22, claimed_year: 1880, source_description: 'An oral history recording.' },
];

function renderReview(submitReview, entryOverrides = {}) {
  const fetchPending = jest.fn().mockResolvedValue([{
    id: 7,
    title: 'A remembered story',
    submitted_at: '2026-01-01',
    raw_content: 'A community account.',
    history_claims: CLAIMS,
    ...entryOverrides,
  }]);

  render(<ValidatorDashboardPage fetchPending={fetchPending} submitReview={submitReview} />);
}

function selectAllAnswers(claimYear, corroboration = 'met') {
  [
    ['Source type', 'Met'],
    ['Source credibility', 'Met'],
    ['Corroboration', corroboration === 'met' ? 'Met' : 'Partly'],
    ['Claimed year', 'Met'],
  ].forEach(([criterion, answer]) => {
    const group = screen.getByRole('group', { name: `${criterion} for claim ${claimYear}` });
    fireEvent.click(within(group).getByLabelText(answer));
  });
}

describe('ValidatorDashboardPage claim assessments', () => {
  it('requires every criterion for every claim and only suggests verified when all claims corroborate', async () => {
    renderReview(jest.fn().mockResolvedValue({}));

    const approveVerified = await screen.findByRole('button', { name: /Approve as Verified/ });
    const approveUnverified = screen.getByRole('button', { name: /Approve as Unverified/ });
    expect(approveVerified).toBeDisabled();
    expect(approveUnverified).toBeDisabled();

    selectAllAnswers(1820);
    selectAllAnswers(1880, 'partly');

    expect(approveVerified).toBeEnabled();
    expect(approveUnverified).toBeEnabled();
    expect(screen.queryByText('Suggested')).not.toBeInTheDocument();

    const secondClaimCorroboration = screen.getByRole('group', {
      name: 'Corroboration for claim 1880',
    });
    fireEvent.click(within(secondClaimCorroboration).getByLabelText('Met'));
    expect(screen.getAllByText('Suggested')).toHaveLength(1);
  });

  it.each([
    ['Approve as Verified', 'approved'],
    ['Approve as Unverified', 'approved_unverified'],
  ])('submits the checklist with %s', async (buttonName, decision) => {
    const submitReview = jest.fn().mockResolvedValue({});
    renderReview(submitReview);
    await screen.findByText('Claimed origin year: 1820');

    selectAllAnswers(1820);
    selectAllAnswers(1880);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(buttonName) }));

    await waitFor(() => expect(submitReview).toHaveBeenCalledWith(
        7,
        decision,
        '',
        expect.arrayContaining([
          expect.objectContaining({
            historyClaimId: 21,
            sourceTypeFit: 'met',
            sourceCredibility: 'met',
            corroboration: 'met',
            claimedYearSupported: 'met',
          }),
          expect.objectContaining({
            historyClaimId: 22,
            sourceTypeFit: 'met',
            sourceCredibility: 'met',
            corroboration: 'met',
            claimedYearSupported: 'met',
          }),
        ])
      ));
  });

  it('shows the conflict banner and requires a conflict-handling note for approval', async () => {
      const submitReview = jest.fn().mockResolvedValue({});
      renderReview(submitReview, { claims_conflict: true });

      expect(await screen.findByText('Claims disagree')).toBeInTheDocument();
      expect(screen.getByText('Sources give different claimed years. Record what each source says.'))
        .toBeInTheDocument();
      selectAllAnswers(1820);
      selectAllAnswers(1880, 'partly');

      fireEvent.click(screen.getByRole('button', { name: /Approve as Unverified/ }));
      expect(await screen.findByText(
        'A comment of at least 20 characters is required to explain how the conflicting claims were handled.'
      )).toBeInTheDocument();
      expect(submitReview).not.toHaveBeenCalled();

      fireEvent.change(screen.getByPlaceholderText(/at least 20 characters when disputing or explaining conflicting years/i), {
        target: { value: 'These accounts describe different origins.' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Approve as Unverified/ }));

      await waitFor(() => expect(submitReview).toHaveBeenCalledWith(
        7,
        'approved_unverified',
        'These accounts describe different origins.',
        expect.any(Array)
      ));
  });
});
