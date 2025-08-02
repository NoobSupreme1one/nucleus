import { PrismaClient } from '@prisma/client';

export interface AnalyticsEvent {
  userId?: string;
  event: string;
  properties: Record<string, any>;
  timestamp: Date;
}

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userId?: string;
  timestamp: Date;
}

export interface BusinessMetric {
  metric: string;
  value: number;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export class AnalyticsService {
  private prisma: PrismaClient;
  private events: AnalyticsEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private businessMetrics: BusinessMetric[] = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    
    // Flush events to database every 30 seconds
    setInterval(() => {
      this.flushEvents();
    }, 30000);
  }

  /**
   * Track user events
   */
  trackEvent(userId: string | undefined, event: string, properties: Record<string, any> = {}) {
    const analyticsEvent: AnalyticsEvent = {
      userId,
      event,
      properties,
      timestamp: new Date(),
    };

    this.events.push(analyticsEvent);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${event}:`, properties);
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    userId?: string
  ) {
    const metric: PerformanceMetric = {
      endpoint,
      method,
      responseTime,
      statusCode,
      userId,
      timestamp: new Date(),
    };

    this.performanceMetrics.push(metric);
  }

  /**
   * Track business metrics
   */
  trackBusinessMetric(
    metric: string,
    value: number,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    const businessMetric: BusinessMetric = {
      metric,
      value,
      userId,
      metadata,
      timestamp: new Date(),
    };

    this.businessMetrics.push(businessMetric);
  }

  /**
   * Track pro report generation
   */
  trackProReportGeneration(userId: string, ideaId: string, success: boolean, duration: number) {
    this.trackEvent(userId, 'pro_report_generated', {
      ideaId,
      success,
      duration,
    });

    this.trackBusinessMetric('pro_report_generation', success ? 1 : 0, userId, {
      ideaId,
      duration,
    });
  }

  /**
   * Track user engagement with report sections
   */
  trackReportSectionView(userId: string, section: string, timeSpent: number) {
    this.trackEvent(userId, 'report_section_viewed', {
      section,
      timeSpent,
    });
  }

  /**
   * Track free-to-pro conversions
   */
  trackConversion(userId: string, fromTier: string, toTier: string, trigger?: string) {
    this.trackEvent(userId, 'subscription_conversion', {
      fromTier,
      toTier,
      trigger,
    });

    if (fromTier === 'free' && toTier === 'pro') {
      this.trackBusinessMetric('free_to_pro_conversion', 1, userId, {
        trigger,
      });
    }
  }

  /**
   * Track API errors
   */
  trackError(
    endpoint: string,
    method: string,
    errorCode: string,
    errorMessage: string,
    userId?: string
  ) {
    this.trackEvent(userId, 'api_error', {
      endpoint,
      method,
      errorCode,
      errorMessage,
    });
  }

  /**
   * Get analytics dashboard data
   */
  async getDashboardData(startDate: Date, endDate: Date) {
    try {
      // This would query from a proper analytics database in production
      // For now, we'll return aggregated data from our in-memory storage
      
      const filteredEvents = this.events.filter(
        event => event.timestamp >= startDate && event.timestamp <= endDate
      );

      const filteredPerformance = this.performanceMetrics.filter(
        metric => metric.timestamp >= startDate && metric.timestamp <= endDate
      );

      const filteredBusiness = this.businessMetrics.filter(
        metric => metric.timestamp >= startDate && metric.timestamp <= endDate
      );

      return {
        // Pro report metrics
        proReportGeneration: {
          total: filteredEvents.filter(e => e.event === 'pro_report_generated').length,
          successful: filteredEvents.filter(
            e => e.event === 'pro_report_generated' && e.properties.success
          ).length,
          averageDuration: this.calculateAverageDuration(
            filteredEvents.filter(e => e.event === 'pro_report_generated')
          ),
        },

        // Performance metrics
        performance: {
          averageResponseTime: this.calculateAverageResponseTime(filteredPerformance),
          errorRate: this.calculateErrorRate(filteredPerformance),
          slowestEndpoints: this.getSlowestEndpoints(filteredPerformance),
        },

        // User engagement
        engagement: {
          mostViewedSections: this.getMostViewedSections(filteredEvents),
          averageTimePerSection: this.getAverageTimePerSection(filteredEvents),
        },

        // Business metrics
        business: {
          conversions: filteredBusiness.filter(m => m.metric === 'free_to_pro_conversion').length,
          conversionRate: this.calculateConversionRate(filteredEvents),
          revenueImpact: this.calculateRevenueImpact(filteredBusiness),
        },

        // Error tracking
        errors: {
          totalErrors: filteredEvents.filter(e => e.event === 'api_error').length,
          errorsByEndpoint: this.getErrorsByEndpoint(filteredEvents),
          mostCommonErrors: this.getMostCommonErrors(filteredEvents),
        },
      };
    } catch (error) {
      console.error('Error generating dashboard data:', error);
      throw new Error('Failed to generate analytics dashboard data');
    }
  }

  /**
   * Flush events to database
   */
  private async flushEvents() {
    if (this.events.length === 0 && this.performanceMetrics.length === 0 && this.businessMetrics.length === 0) {
      return;
    }

    try {
      // In production, this would write to a proper analytics database
      // For now, we'll just log the counts
      console.log(`[Analytics] Flushing ${this.events.length} events, ${this.performanceMetrics.length} performance metrics, ${this.businessMetrics.length} business metrics`);

      // Clear the arrays
      this.events = [];
      this.performanceMetrics = [];
      this.businessMetrics = [];
    } catch (error) {
      console.error('Error flushing analytics events:', error);
    }
  }

  // Helper methods for calculations
  private calculateAverageDuration(events: AnalyticsEvent[]): number {
    if (events.length === 0) return 0;
    const totalDuration = events.reduce((sum, event) => sum + (event.properties.duration || 0), 0);
    return totalDuration / events.length;
  }

  private calculateAverageResponseTime(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    const totalTime = metrics.reduce((sum, metric) => sum + metric.responseTime, 0);
    return totalTime / metrics.length;
  }

  private calculateErrorRate(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    const errorCount = metrics.filter(m => m.statusCode >= 400).length;
    return (errorCount / metrics.length) * 100;
  }

  private getSlowestEndpoints(metrics: PerformanceMetric[]): Array<{endpoint: string, averageTime: number}> {
    const endpointTimes: Record<string, number[]> = {};
    
    metrics.forEach(metric => {
      if (!endpointTimes[metric.endpoint]) {
        endpointTimes[metric.endpoint] = [];
      }
      endpointTimes[metric.endpoint].push(metric.responseTime);
    });

    return Object.entries(endpointTimes)
      .map(([endpoint, times]) => ({
        endpoint,
        averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);
  }

  private getMostViewedSections(events: AnalyticsEvent[]): Array<{section: string, views: number}> {
    const sectionViews: Record<string, number> = {};
    
    events
      .filter(e => e.event === 'report_section_viewed')
      .forEach(event => {
        const section = event.properties.section;
        sectionViews[section] = (sectionViews[section] || 0) + 1;
      });

    return Object.entries(sectionViews)
      .map(([section, views]) => ({ section, views }))
      .sort((a, b) => b.views - a.views);
  }

  private getAverageTimePerSection(events: AnalyticsEvent[]): Record<string, number> {
    const sectionTimes: Record<string, number[]> = {};
    
    events
      .filter(e => e.event === 'report_section_viewed')
      .forEach(event => {
        const section = event.properties.section;
        const timeSpent = event.properties.timeSpent || 0;
        
        if (!sectionTimes[section]) {
          sectionTimes[section] = [];
        }
        sectionTimes[section].push(timeSpent);
      });

    const averages: Record<string, number> = {};
    Object.entries(sectionTimes).forEach(([section, times]) => {
      averages[section] = times.reduce((sum, time) => sum + time, 0) / times.length;
    });

    return averages;
  }

  private calculateConversionRate(events: AnalyticsEvent[]): number {
    const conversions = events.filter(e => e.event === 'subscription_conversion').length;
    const totalUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;
    
    if (totalUsers === 0) return 0;
    return (conversions / totalUsers) * 100;
  }

  private calculateRevenueImpact(metrics: BusinessMetric[]): number {
    // Assuming $29/month for pro subscription
    const proPrice = 29;
    const conversions = metrics.filter(m => m.metric === 'free_to_pro_conversion').length;
    return conversions * proPrice;
  }

  private getErrorsByEndpoint(events: AnalyticsEvent[]): Record<string, number> {
    const errorsByEndpoint: Record<string, number> = {};
    
    events
      .filter(e => e.event === 'api_error')
      .forEach(event => {
        const endpoint = event.properties.endpoint;
        errorsByEndpoint[endpoint] = (errorsByEndpoint[endpoint] || 0) + 1;
      });

    return errorsByEndpoint;
  }

  private getMostCommonErrors(events: AnalyticsEvent[]): Array<{error: string, count: number}> {
    const errorCounts: Record<string, number> = {};
    
    events
      .filter(e => e.event === 'api_error')
      .forEach(event => {
        const errorCode = event.properties.errorCode;
        errorCounts[errorCode] = (errorCounts[errorCode] || 0) + 1;
      });

    return Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

// Middleware for tracking API performance
export function createPerformanceMiddleware(analytics: AnalyticsService) {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const userId = req.user?.id;
      
      analytics.trackPerformance(
        req.path,
        req.method,
        responseTime,
        res.statusCode,
        userId
      );

      // Track slow requests
      if (responseTime > 5000) { // 5 seconds
        analytics.trackEvent(userId, 'slow_request', {
          endpoint: req.path,
          method: req.method,
          responseTime,
          statusCode: res.statusCode,
        });
      }
    });
    
    next();
  };
}
