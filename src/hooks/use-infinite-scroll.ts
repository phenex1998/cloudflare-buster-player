import { useState, useRef, useEffect } from 'react';

export function useInfiniteScroll(totalItems: number, pageSize = 40) {
  const [limit, setLimit] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset when total changes (category switch)
  useEffect(() => {
    setLimit(pageSize);
  }, [totalItems, pageSize]);

  // IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLimit(prev => Math.min(prev + pageSize, totalItems));
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [totalItems, pageSize]);

  return { limit, sentinelRef, hasMore: limit < totalItems };
}
