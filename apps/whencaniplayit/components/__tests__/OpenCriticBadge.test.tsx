import { render, screen } from '@testing-library/react';
import { OpenCriticBadge } from '../OpenCriticBadge';

describe('OpenCriticBadge', () => {
  it('renders the tier label', () => {
    render(<OpenCriticBadge tier="Mighty" score={87.6} />);
    expect(screen.getByText('Mighty')).toBeInTheDocument();
  });

  it('rounds the score to the nearest whole number', () => {
    render(<OpenCriticBadge tier="Strong" score={75.3} />);
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('does not render score when missing', () => {
    render(<OpenCriticBadge tier="Fair" />);
    expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
  });
});
