'use client';

import { useEffect, useRef, useCallback } from 'react';

export function usePolling(
  callback: () => Promise<void> | void,
  interval: number,
  enabled: boolean = true
) {
  const savedCallback = useRef(callback);
  const isMounted = useRef(true);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    isMounted.current = true;

    if (!enabled) return;

    const tick = async () => {
      if (isMounted.current) {
        try {
          await savedCallback.current();
        } catch {
          // Silently ignore polling errors
        }
      }
    };

    tick(); // Initial call
    const id = setInterval(tick, interval);

    return () => {
      isMounted.current = false;
      clearInterval(id);
    };
  }, [interval, enabled]);
}
