// Performance utilities for Next.js

/**
 * Preload images for better perceived performance
 */
export const preloadImage = (src) => {
  if (typeof window === 'undefined') return;
  const img = new Image();
  img.src = src;
};

/**
 * Prefetch dynamic components for faster navigation
 */
export const prefetchComponent = (componentPath) => {
  if (typeof window === 'undefined') return;
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'script';
  link.href = componentPath;
  document.head.appendChild(link);
};

/**
 * Report Web Vitals for monitoring
 */
export const reportWebVitals = (metric) => {
  // Send to analytics service
  console.log(`${metric.name}: ${metric.value}`);
};

/**
 * Optimize bundle size with dynamic imports
 */
export const dynamicImport = (importFn) => {
  return import(
    /* webpackChunkName: "[request]" */
    /* webpackPrefetch: true */
    importFn
  );
};

/**
 * Create intersection observer for lazy loading
 */
export const createLazyObserver = (callback, options = {}) => {
  if (typeof window === 'undefined') return null;
  
  const defaultOptions = {
    rootMargin: '50px',
    threshold: 0.01,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
};

/**
 * Debounce function for performance optimization
 */
export const debounce = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function for high-frequency events
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Performance measurement utility
 */
export const measurePerformance = (label) => {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(`${label}-start`);
    return () => {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      const measure = performance.getEntriesByName(label)[0];
      console.log(`${label}: ${measure.duration.toFixed(2)}ms`);
    };
  }
  return () => {};
};
