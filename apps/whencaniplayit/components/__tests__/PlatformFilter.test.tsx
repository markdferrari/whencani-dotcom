import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlatformFilter } from '../PlatformFilter';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

const mockStudios = [
  { id: 101, name: 'Studio Alpha' },
  { id: 202, name: 'Studio Beta' },
];

describe('PlatformFilter', () => {
  const mockPush = jest.fn();
  const mockFetch = jest.fn();
  const originalFetch = (global as unknown as { fetch?: typeof fetch }).fetch;
  let mockSearchParams: URLSearchParams;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockStudios,
    });
    (global as unknown as { fetch?: jest.Mock }).fetch = mockFetch;
  });

  afterAll(() => {
    (global as unknown as { fetch?: jest.Mock }).fetch = originalFetch;
  });

  const renderFilter = async () => {
    render(<PlatformFilter genres={[]} />);
    await screen.findByLabelText('Studio');
  };

  it('renders platform and genre selects with options', async () => {
    await renderFilter();

    const platformSelect = screen.getByLabelText('Platform');
    expect(platformSelect).toBeInTheDocument();
    expect(platformSelect).toHaveValue('1');
    expect(screen.getByRole('option', { name: 'PlayStation' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Xbox' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Nintendo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'PC' })).toBeInTheDocument();

    const genreSelect = screen.getByLabelText('Genre');
    expect(genreSelect).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'All genres' })).toBeInTheDocument();
  });

  it('reads the platform value from search params', async () => {
    mockSearchParams = new URLSearchParams('platform=pc');
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    await renderFilter();

    expect(screen.getByLabelText('Platform')).toHaveValue('pc');
  });

  it('navigates when the platform select changes', async () => {
    const user = userEvent.setup();
    await renderFilter();

    const platformSelect = screen.getByLabelText('Platform');
    await user.selectOptions(platformSelect, 'pc');

    expect(mockPush).toHaveBeenCalledWith('/?platform=pc');
  });

  it('preserves other query params when the platform changes', async () => {
    mockSearchParams = new URLSearchParams('platform=1&sort=date');
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    const user = userEvent.setup();
    await renderFilter();

    const platformSelect = screen.getByLabelText('Platform');
    await user.selectOptions(platformSelect, '2');

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('platform=2'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sort=date'));
  });

  it('loads studios and renders the dropdown', async () => {
    await renderFilter();

    const studioSelect = screen.getByLabelText('Studio');
    expect(studioSelect).toBeInTheDocument();
    expect(await screen.findByText('Studio Alpha')).toBeInTheDocument();
  });

  it('updates search params when selecting a studio', async () => {
    const user = userEvent.setup();
    await renderFilter();

    const studioSelect = screen.getByLabelText('Studio');
    await user.selectOptions(studioSelect, '202');

    expect(mockPush).toHaveBeenCalledWith('/?studio=202');
  });
});
