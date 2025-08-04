// Performance optimization utilities for production

/**
 * Lazy load images with IntersectionObserver
 */
export function initializeLazyLoading() {
  if (!('IntersectionObserver' in window)) {
    // Fallback for older browsers
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src || '';
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  // Preload critical fonts
  const fontUrls = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
  ];

  fontUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = 'style';
    link.onload = () => {
      link.rel = 'stylesheet';
    };
    document.head.appendChild(link);
  });

  // Preload critical API endpoints
  if ('serviceWorker' in navigator) {
    const criticalEndpoints = [
      '/api/auth/user',
      '/api/leaderboard'
    ];

    criticalEndpoints.forEach(endpoint => {
      fetch(endpoint, { credentials: 'include' }).catch(() => {
        // Silently fail - this is just a preload
      });
    });
  }
}

/**
 * Implement resource hints for better loading
 */
export function addResourceHints() {
  const hints = [
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
    { rel: 'dns-prefetch', href: '//bedrock.us-west-1.amazonaws.com' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com', crossorigin: true },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true }
  ];

  hints.forEach(hint => {
    if (!document.querySelector(`link[rel="${hint.rel}"][href="${hint.href}"]`)) {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if ('crossorigin' in hint) {
        link.crossOrigin = '';
      }
      document.head.appendChild(link);
    }
  });
}

/**
 * Optimize Core Web Vitals
 */
export function optimizeWebVitals() {
  // Reduce CLS by setting image dimensions
  const images = document.querySelectorAll('img:not([width]):not([height])');
  images.forEach(img => {
    const imgElement = img as HTMLImageElement;
    if (!imgElement.getAttribute('width') && !imgElement.getAttribute('height')) {
      imgElement.style.aspectRatio = '16/9'; // Default aspect ratio
    }
  });

  // Optimize LCP by prioritizing hero images
  const heroImages = document.querySelectorAll('.hero img, .banner img');
  heroImages.forEach(img => {
    (img as HTMLImageElement).loading = 'eager';
    (img as HTMLImageElement).fetchPriority = 'high';
  });
}

/**
 * Service Worker registration for caching
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

/**
 * Initialize all performance optimizations
 */
export function initializePerformanceOptimizations() {
  // Run immediately
  addResourceHints();
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeLazyLoading();
      optimizeWebVitals();
      preloadCriticalResources();
    });
  } else {
    initializeLazyLoading();
    optimizeWebVitals();
    preloadCriticalResources();
  }
  
  // Register service worker
  registerServiceWorker();
}

/**
 * Monitor performance metrics using native Performance API
 */
export function trackPerformanceMetrics() {
  if (!import.meta.env.PROD) return;

  // Track performance using native APIs
  if ('performance' in window && 'getEntriesByType' in performance) {
    // Track navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      console.log('Navigation metrics:', {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalPageLoad: navigation.loadEventEnd - navigation.fetchStart
      });
    }

    // Track paint metrics
    const paintMetrics = performance.getEntriesByType('paint');
    paintMetrics.forEach(metric => {
      console.log(`${metric.name}: ${metric.startTime}ms`);
    });

    // Track largest contentful paint if available
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('LCP:', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // PerformanceObserver not supported
      }
    }
  }
}