import { render } from '@testing-library/react';
import React from 'react';
import { CarouselCard } from '../CarouselCard';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { src: string }) => {
    const { src, alt, ...rest } = props;
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img src={src} alt={alt} {...rest} />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('CarouselCard layout', () => {
  it('allows the card to shrink to its parent size', () => {
    const { container } = render(
      <CarouselCard href="/game/1" name="Test" />,
    );

    const link = container.querySelector('a');
    expect(link).toHaveClass('w-full');
    expect(link).toHaveClass('max-w-full');
    expect(link).toHaveClass('min-w-0');
    expect(link).toHaveClass('flex-shrink');
  });
});
