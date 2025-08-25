import React from 'react';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  context?: string;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isDevelopment = import.meta.env.DEV;

  // Start timing an operation
  startTimer(operationName: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(operationName, duration);
    };
  }

  // Measure an async operation
  async measureAsync<T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: string,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      this.recordMetric(operationName, duration, context, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${operationName} (failed)`, duration, context, { ...metadata, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  // Measure a sync operation
  measureSync<T>(
    operationName: string,
    operation: () => T,
    context?: string,
    metadata?: Record<string, any>
  ): T {
    const startTime = performance.now();
    
    try {
      const result = operation();
      const duration = performance.now() - startTime;
      this.recordMetric(operationName, duration, context, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${operationName} (failed)`, duration, context, { ...metadata, error: error instanceof Error ? error.message : 'Unknown error' });
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
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, context, metadata);
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
  return React.forwardRef<React.ElementRef<typeof Component>, P>((props, ref) => {
    usePerformanceMeasure(componentName);
    return <Component {...props} ref={ref} />;
  });
};
