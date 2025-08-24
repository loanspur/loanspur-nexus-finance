export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, []);
      }
      
      this.metrics.get(operation)!.push(duration);
      
      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  getMetrics(operation: string): PerformanceMetrics {
    const durations = this.metrics.get(operation) || [];
    
    if (durations.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0 };
    }
    
    const sum = durations.reduce((a, b) => a + b, 0);
    const average = sum / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    return {
      count: durations.length,
      average,
      min,
      max,
    };
  }
}

interface PerformanceMetrics {
  count: number;
  average: number;
  min: number;
  max: number;
}
