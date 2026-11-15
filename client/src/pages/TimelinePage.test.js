import { render, screen } from '@testing-library/react';
import TimelinePage from './TimelinePage';

jest.mock('react-router-dom', () => ({
  Link: ({ to, children }) => require('react').createElement('a', { href: to }, children),
  useSearchParams: () => [new URLSearchParams('period=Spanish%20Colonial%20Period')],
}));

test('filters the already-loaded timeline by the selected period query', async () => {
  const fetchTimeline = jest.fn().mockResolvedValue([
    { period: 'Pre-Colonial', entries: [] },
    { period: 'Spanish Colonial Period', entries: [] },
  ]);

  render(<TimelinePage fetchTimeline={fetchTimeline} />);

  expect(await screen.findByRole('heading', { name: 'Spanish Colonial Period' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Pre-Colonial' })).not.toBeInTheDocument();
  expect(fetchTimeline).toHaveBeenCalledTimes(1);
});
