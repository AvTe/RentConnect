/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://yoombaa.com',
  generateRobotsTxt: false, // We already have a custom robots.txt
  generateIndexSitemap: false,
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,

  // Exclude all auto-generated routes - we'll manually add only the homepage
  // This is because Yoombaa is a SPA with hash-based routing (/#about, /#contact, etc.)
  exclude: [
    '/admin',
    '/admin/*',
    '/api/*',
    '/private/*',
    '/_next/*',
    '/server-sitemap.xml',
    '/auth/*',
    '/payment/*',
    '/share/*',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
  ],

  // Transform function - only allow homepage
  transform: async (config, path) => {
    // Only include the homepage since it's a SPA
    if (path !== '/') {
      return null; // Exclude this path
    }

    return {
      loc: path,
      changefreq: 'daily',
      priority: 1.0,
      lastmod: new Date().toISOString(),
    };
  },

  // Only include the homepage
  additionalPaths: async (config) => {
    return [
      {
        loc: '/',
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      },
    ];
  },

  // Robots.txt options (if generateRobotsTxt is true)
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/', '/private/', '/auth/', '/payment/'],
      },
    ],
    additionalSitemaps: [
      'https://yoombaa.com/sitemap.xml',
    ],
  },
};

