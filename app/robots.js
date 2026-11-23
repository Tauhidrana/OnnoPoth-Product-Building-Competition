import { socialLinks } from '@/lib/config';

/** App Router metadata route — served at /robots.txt */
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: `${socialLinks.siteUrl}/sitemap.xml`,
  };
}
