import { render, screen } from '@testing-library/react';
import type React from 'react';
import { GameCard } from '../GameCard';
import type { IGDBGame } from '@/lib/igdb';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (
    props: React.ImgHTMLAttributes<HTMLImageElement> & { src: string },
  ) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    const { src, alt, ...rest } = props;
    return <img src={src} alt={alt} {...rest} />;
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock window.innerWidth for responsive testing
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024, // Default to desktop width for tests
});

describe('GameCard', () => {
  const mockGame: IGDBGame = {
    id: 12345,
    name: 'Test Game',
    cover: {
      url: '//images.igdb.com/igdb/image/upload/t_thumb/test.jpg',
    },
    release_dates: [
      {
        human: 'Feb 04, 2026',
        date: 1770163200,
        platform: { id: 167, name: 'PlayStation 5' },
      },
    ],
  };

  it('should render game title', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });

  it('should render release date', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText('Feb 04, 2026')).toBeInTheDocument();
  });

  it('should render platform names', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText('PlayStation 5')).toBeInTheDocument();
  });

  it('should link to game detail page', () => {
    render(<GameCard game={mockGame} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/game/12345');
  });

  it('should render cover image with correct src (desktop)', () => {
    render(<GameCard game={mockGame} />);
    const img = screen.getByAltText('Test Game');
    // In test environment with desktop width, t_cover_big is used
    expect(img).toHaveAttribute(
      'src',
      '/api/image?url=https%3A%2F%2Fimages.igdb.com%2Figdb%2Fimage%2Fupload%2Ft_cover_big%2Ftest.jpg',
    );
  });

  it('should display TBA when no release date is available', () => {
    const gameWithoutDate: IGDBGame = {
      id: 12345,
      name: 'Test Game',
    };
    
    render(<GameCard game={gameWithoutDate} />);
    expect(screen.getByText('TBA')).toBeInTheDocument();
  });

  it('should handle multiple platforms', () => {
    const gameWithMultiplePlatforms: IGDBGame = {
      ...mockGame,
      release_dates: [
        {
          human: 'Feb 04, 2026',
          date: 1770163200,
          platform: { id: 167, name: 'PlayStation 5' },
        },
        {
          human: 'Feb 04, 2026',
          date: 1770163200,
          platform: { id: 6, name: 'PC' },
        },
      ],
    };
    
    render(<GameCard game={gameWithMultiplePlatforms} />);
    expect(screen.getByText('PlayStation 5, PC')).toBeInTheDocument();
  });
});
