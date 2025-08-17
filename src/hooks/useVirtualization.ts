import { useMemo, useState, useCallback } from 'react';

interface UseVirtualizationProps {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualization({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5
}: UseVirtualizationProps) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, itemCount, overscan]);

  const totalHeight = itemCount * itemHeight;

  const getItemStyle = useCallback(
    (index: number) => ({
      position: 'absolute' as const,
      top: index * itemHeight,
      height: itemHeight,
      width: '100%',
    }),
    [itemHeight]
  );

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleRange,
    totalHeight,
    getItemStyle,
    handleScroll,
  };
}