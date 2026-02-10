import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://whencaniplayit.com';
  
  // Core pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/?view=recent`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Platform filter pages
  const platforms = [
    { id: '1', name: 'PlayStation' },
    { id: '2', name: 'Xbox' },
    { id: '5', name: 'Nintendo' },
    { id: '6', name: 'PC' },
  ];

  const platformRoutes: MetadataRoute.Sitemap = platforms.flatMap((platform) => [
    {
      url: `${baseUrl}/?platform=${platform.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/?platform=${platform.id}&view=recent`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
  ]);

  return [...staticRoutes, ...platformRoutes];
}
