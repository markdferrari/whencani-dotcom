import nextConfig from '../next.config';

describe('next.config images caching', () => {
  it('sets minimumCacheTTL to 24 hours', () => {
    expect(nextConfig.images?.minimumCacheTTL).toBe(86400);
  });
});
