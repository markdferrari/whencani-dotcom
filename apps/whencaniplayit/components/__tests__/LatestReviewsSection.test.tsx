import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import { LatestReviewsSection } from '../LatestReviewsSection';
import type { OpenCriticReview } from '@/lib/opencritic';

describe('LatestReviewsSection', () => {
  const mockReviews = [
    {
      id: 1,
      name: 'Game One',
      images: {
        box: { og: 'https://example.com/game1.jpg' },
      },
      tier: 'Mighty',
      topCriticScore: 90,
      numReviews: 50,
      percentRecommended: 95,
    },
    {
      id: 2,
      name: 'Game Two',
      images: {
        box: { og: 'https://example.com/game2.jpg' },
      },
      tier: 'Strong',
      topCriticScore: 80,
      numReviews: 30,
      percentRecommended: 85,
    },
  ];

  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render section title and fetch reviews immediately', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ reviews: mockReviews }), { status: 200 })
    );

    render(<LatestReviewsSection />);

    expect(screen.getByText('Latest Reviews')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/opencritic/reviewed-this-week', {
        cache: 'no-store',
      });
      expect(screen.getByText('Game One')).toBeInTheDocument();
      expect(screen.getByText('Game Two')).toBeInTheDocument();
    });
  });

  it('should render loading state initially', () => {
    fetchMock.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LatestReviewsSection />);

    expect(screen.getByText('Loading latest reviews…')).toBeInTheDocument();
  });

  it('should render empty state on fetch error', async () => {
    fetchMock.mockRejectedValue(new Error('API Error'));

    render(<LatestReviewsSection />);

    await waitFor(() => {
      expect(screen.getByText('No reviews available')).toBeInTheDocument();
    });
  });
});
