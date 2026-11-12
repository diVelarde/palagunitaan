import { render, screen } from '@testing-library/react';
import AdminEntriesTab from './AdminEntriesTab';

test('shows the self-submission note and keeps deletion available', async () => {
  render(
    <AdminEntriesTab
      fetchEntries={async () => [{ id: 1, user_id: '7', title: 'My story', status: 'pending' }]}
      deleteEntry={jest.fn()}
      setEducationalAiExcluded={jest.fn()}
      currentUserId={7}
    />
  );

  expect(await screen.findByText('You submitted this entry, so another reviewer must decide.'))
    .toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
});
