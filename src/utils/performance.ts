// src/utils/performance.ts - Performance monitoring utilities
import { logger } from './logger';

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  context?: string;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isDevelopment = import.meta.env.VITE_IS_DEVELOPMENT === 'true';

  // Measure function execution time
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    context?: string,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.recordMetric(name, duration, context, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, context, { ...metadata, error: true });
      throw error;
    }
  }

  // Measure synchronous function execution time
  measureSync<T>(
    name: string,
    fn: () => T,
    context?: string,
    metadata?: Record<string, any>
  ): T {
    const start = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - start;
      
      this.recordMetric(name, duration, context, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, context, { ...metadata, error: true });
      throw error;
    }
  }

  // Record a performance metric
  private recordMetric(
    name: string,
    duration: number,
    context?: string,
    metadata?: Record<string, any>
  ) {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date(),
      context,
      metadata
    };

    this.metrics.push(metric);

    // Log slow operations in development
    if (this.isDevelopment && duration > 1000) {
      logger.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, context, metadata);
    }

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Get performance summary
  getSummary(): {
    totalOperations: number;
    averageDuration: number;
    slowestOperation: PerformanceMetric | null;
    fastestOperation: PerformanceMetric | null;
  } {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowestOperation: null,
        fastestOperation: null
      };
    }

    const durations = this.metrics.map(m => m.duration);
    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    const slowestOperation = this.metrics.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest
    );
    
    const fastestOperation = this.metrics.reduce((fastest, current) => 
      current.duration < fastest.duration ? current : fastest
    );

    return {
      totalOperations: this.metrics.length,
      averageDuration,
      slowestOperation,
      fastestOperation
    };
  }

  // Clear metrics
  clear() {
    this.metrics = [];
  }

  // Export metrics for analysis
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React hook for measuring component render time
export const usePerformanceMeasure = (componentName: string) => {
  const startTime = React.useRef(performance.now());
  
  React.useEffect(() => {
    const duration = performance.now() - startTime.current;
    performanceMonitor.recordMetric(`${componentName} render`, duration, 'React');
  });
};

// Higher-order component for measuring render performance
export const withPerformanceMeasure = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    usePerformanceMeasure(componentName);
    return <Component {...props} ref={ref} />;
  });
};
