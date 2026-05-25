import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://thesift.space';

  const staticPages = [
    '',
    '/blog',
    '/faq',
    '/privacy',
    '/terms',
    '/contact',
    '/discover',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return staticPages;
}