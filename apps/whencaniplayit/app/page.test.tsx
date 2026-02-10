import { render, screen, within } from '@testing-library/react';
import type React from 'react';
import Home from './page';

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

describe('Home page', () => {
  it('renders the hero and key sections', async () => {
    const ui = await Home({
      searchParams: Promise.resolve({ platform: '1', view: 'upcoming' }),
    });

    render(ui);

    expect(screen.getByText('Stay ahead of every big game drop and score update.')).toBeInTheDocument();
    expect(screen.getByText('ViewToggle')).toBeInTheDocument();
    expect(screen.getByText('LatestReviewsSection')).toBeInTheDocument();
    expect(screen.getByText('TrendingSection')).toBeInTheDocument();
    // Filters appears both on mobile and desktop, so use queryAllByText
    expect(screen.queryAllByText('Filters').length).toBeGreaterThan(0);
  });
});
