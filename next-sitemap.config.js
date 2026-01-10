/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://yoombaa.com',
  generateRobotsTxt: false, // We already have a custom robots.txt
  generateIndexSitemap: false,
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  
  // Exclude private/admin routes from sitemap
  exclude: [
    '/admin',
    '/admin/*',
    '/api/*',
    '/private/*',
    '/_next/*',
    '/server-sitemap.xml',
  ],
  
  // Transform function to customize sitemap entries
  transform: async (config, path) => {
    // Set higher priority for important pages
    let priority = config.priority;
    let changefreq = config.changefreq;
    
    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (path === '/about' || path === '/contact') {
      priority = 0.8;
      changefreq = 'weekly';
    } else if (path.startsWith('/properties') || path.startsWith('/agents')) {
      priority = 0.9;
      changefreq = 'daily';
    }
    
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },
  
  // Additional paths to include
  additionalPaths: async (config) => {
    const result = [];
    
    // Add static pages
    const staticPages = [
      '/',
      '/about',
      '/contact',
      '/privacy',
      '/terms',
    ];
    
    for (const page of staticPages) {
      result.push({
        loc: page,
        changefreq: 'weekly',
        priority: page === '/' ? 1.0 : 0.8,
        lastmod: new Date().toISOString(),
      });
    }
    
    return result;
  },
  
  // Robots.txt options (if generateRobotsTxt is true)
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/', '/private/'],
      },
    ],
    additionalSitemaps: [
      'https://yoombaa.com/sitemap.xml',
    ],
  },
};

