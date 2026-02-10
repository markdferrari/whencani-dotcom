import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import { LatestReviewsSection } from '../LatestReviewsSection';
import type { OpenCriticReview } from '@/lib/opencritic';

jest.mock('../EmblaCarouselReviews', () => ({
  EmblaCarouselReviews: ({ reviews }: { reviews: OpenCriticReview[] }) => (
    <div data-testid="embla-carousel-reviews">
      {reviews.map((review) => (
        <div key={review.id}>{review.name}</div>
      ))}
    </div>
  ),
}));

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

  class MockIntersectionObserver {
    private callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }

    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();

    triggerIntersect(isIntersecting: boolean) {
      const entry = [{ isIntersecting } as IntersectionObserverEntry];
      this.callback(entry, this as unknown as IntersectionObserver);
    }
  }

  let intersectionObserver: MockIntersectionObserver | null = null;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as typeof fetch;

    window.IntersectionObserver = jest
      .fn((callback: IntersectionObserverCallback) => {
        const observer = new MockIntersectionObserver(callback);
        intersectionObserver = observer;
        return observer as unknown as IntersectionObserver;
      }) as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    jest.resetAllMocks();
    intersectionObserver = null;
  });

  it('should render section title without fetching initially', () => {
    render(<LatestReviewsSection />);

    expect(screen.getByText('Latest Reviews')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('adds a shrinkable carousel wrapper to prevent overflow', () => {
    render(<LatestReviewsSection />);

    const wrapper = screen.getByTestId('latest-reviews-carousel-wrapper');
    expect(wrapper).toHaveClass('max-w-full', 'min-w-0');
  });

  it('should fetch and render reviews after intersection', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ reviews: mockReviews }), { status: 200 })
    );

    render(<LatestReviewsSection />);

    await act(async () => {
      intersectionObserver?.triggerIntersect(true);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/opencritic/reviewed-this-week', {
        cache: 'no-store',
      });
      expect(screen.getAllByText('Game One').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Game Two').length).toBeGreaterThan(0);
      expect(screen.getByTestId('embla-carousel-reviews')).toBeInTheDocument();
    });
  });

  it('should render empty state on fetch error', async () => {
    fetchMock.mockRejectedValue(new Error('API Error'));

    render(<LatestReviewsSection />);

    await act(async () => {
      intersectionObserver?.triggerIntersect(true);
    });

    await waitFor(() => {
      expect(screen.getByText('No reviews available')).toBeInTheDocument();
    });
  });
});
