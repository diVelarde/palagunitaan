import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

test('filters timeline entries by category and region and renders available entry details', async () => {
  const fetchTimeline = jest.fn().mockResolvedValue([
    {
      period: 'Spanish Colonial Period',
      entries: [
        {
          id: 1,
          title: 'The Moon Eater',
          category_auto: 'Myth',
          region_name: 'Camarines Sur',
          verification_status: 'verified',
          claimed_year_start: 1750,
          claimed_year_end: 1780,
          cover_image_url: '/moon-eater.jpg',
          euphemistic_content: 'A short account of a lunar legend.',
        },
        {
          id: 2,
          title: 'The River Keeper',
          category_auto: 'Legend',
          region_name: 'Albay',
          verification_status: 'disputed',
        },
      ],
    },
  ]);

  const { container } = render(<TimelinePage fetchTimeline={fetchTimeline} />);

  expect(await screen.findByText('1750–1780')).toBeInTheDocument();
  expect(screen.getByText('A short account of a lunar legend.')).toBeInTheDocument();
  expect(container.querySelector('.timeline-entry-image')).toHaveAttribute('src', '/moon-eater.jpg');

  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Legend' } });
  fireEvent.change(screen.getByLabelText('Region'), { target: { value: 'Albay' } });

  expect(screen.getByText('The River Keeper')).toBeInTheDocument();
  expect(screen.queryByText('The Moon Eater')).not.toBeInTheDocument();
  expect(screen.getByText('Disputed')).toBeInTheDocument();
  expect(screen.getByText('Summary coming soon')).toBeInTheDocument();
});

test('keeps dated entries in list order and moves entries without years to an undated list', async () => {
  const fetchTimeline = jest.fn().mockResolvedValue([
    {
      period: 'Spanish Colonial Period',
      entries: [
        { id: 11, title: 'First dated story', claimed_year: 1720, verification_status: 'verified' },
        { id: 12, title: 'Story without a year', verification_status: 'unverified' },
        { id: 13, title: 'Second dated story', claimed_year: 1790, verification_status: 'disputed' },
        { id: 14, title: 'Another story without a year', verification_status: 'verified' },
      ],
    },
  ]);
  const originalObserver = global.IntersectionObserver;
  global.IntersectionObserver = undefined;

  try {
    render(<TimelinePage fetchTimeline={fetchTimeline} />);

    const datedList = await screen.findByRole('list', {
      name: 'Dated entries in Spanish Colonial Period',
    });
    const datedItems = within(datedList).getAllByRole('listitem');
    expect(datedItems).toHaveLength(2);
    expect(datedItems[0]).toHaveClass('timeline-item-right', 'timeline-item-visible');
    expect(datedItems[1]).toHaveClass('timeline-item-left', 'timeline-item-visible');
    expect(within(datedItems[0]).getByText('First dated story')).toBeInTheDocument();
    expect(within(datedItems[1]).getByText('Second dated story')).toBeInTheDocument();

    const undatedList = screen.getByRole('list', {
      name: 'Undated entries in Spanish Colonial Period',
    });
    const undatedItems = within(undatedList).getAllByRole('listitem');
    expect(undatedItems).toHaveLength(2);
    expect(within(undatedList).getByText('Story without a year')).toBeInTheDocument();
    expect(undatedItems[0]).toHaveClass('timeline-item-right', 'timeline-item-visible');
    expect(undatedItems[1]).toHaveClass('timeline-item-left', 'timeline-item-visible');
  } finally {
    if (originalObserver === undefined) delete global.IntersectionObserver;
    else global.IntersectionObserver = originalObserver;
  }
});

test('reveals dated and undated entries once when their observers intersect them', async () => {
  const callbacks = [];
  const observers = [];
  const originalObserver = global.IntersectionObserver;
  global.IntersectionObserver = jest.fn(function createObserver(callback) {
    callbacks.push(callback);
    this.observe = jest.fn();
    this.unobserve = jest.fn();
    this.disconnect = jest.fn();
    observers.push(this);
  });

  try {
    render(<TimelinePage fetchTimeline={() => Promise.resolve([{
      period: 'Spanish Colonial Period',
      entries: [
        { id: 21, title: 'Observed story', claimed_year: 1800 },
        { id: 22, title: 'Observed undated story' },
      ],
    }])} />);

    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(2);
    items.forEach((item) => expect(item).not.toHaveClass('timeline-item-visible'));
    act(() => callbacks.forEach((callback, index) => {
      const item = observers[index].observe.mock.calls[0][0];
      callback([{ isIntersecting: true, target: item }]);
    }));

    items.forEach((item) => expect(item).toHaveClass('timeline-item-visible'));
    observers.forEach((observer) => {
      expect(observer.unobserve).toHaveBeenCalledWith(observer.observe.mock.calls[0][0]);
    });
  } finally {
    cleanup();
    if (originalObserver === undefined) delete global.IntersectionObserver;
    else global.IntersectionObserver = originalObserver;
  }
});
