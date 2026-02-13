import { render, screen, within } from '@testing-library/react';
import type React from 'react';
import Home from './page';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('view=upcoming&platform=1'),
}));

jest.mock('@/lib/igdb', () => ({
  getUpcomingPSGames: jest.fn().mockResolvedValue([]),
  getRecentlyReleasedGames: jest.fn().mockResolvedValue([]),
  getGameGenres: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/components/GameCard', () => ({
  GameCard: () => <div>GameCard</div>,
}));

jest.mock('@/components/PlatformFilter', () => ({
  PlatformFilter: () => <div>PlatformFilter</div>,
}));

jest.mock('@/components/ViewToggle', () => ({
  ViewToggle: () => <div>ViewToggle</div>,
}));

jest.mock('@/components/LatestReviewsSection', () => ({
  LatestReviewsSection: () => <div>LatestReviewsSection</div>,
}));

jest.mock('@/components/TrendingSection', () => ({
  TrendingSection: () => <div>TrendingSection</div>,
}));

jest.mock('@/components/RecentlyViewedSection', () => ({
  RecentlyViewedSection: () => <div>RecentlyViewedSection</div>,
}));

describe('Home page', () => {
  it('renders the hero and key sections', async () => {
    const ui = await Home({
      searchParams: Promise.resolve({ platform: '1', view: 'upcoming' }),
    });

    render(ui);

    expect(screen.getByText('Upcoming launches, review momentum, and multi-platform tracking—all in one place.')).toBeInTheDocument();
    expect(screen.getByText('ViewToggle')).toBeInTheDocument();
    expect(screen.getByText('LatestReviewsSection')).toBeInTheDocument();
    expect(screen.getByText('TrendingSection')).toBeInTheDocument();
    // PlatformFilter appears both on mobile and desktop, so use queryAllByText
    expect(screen.queryAllByText('PlatformFilter').length).toBeGreaterThan(0);
  });
});
