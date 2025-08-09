import { useEffect, useRef, useState, useCallback } from 'react';

// This hook triggers a callback once when an element becomes fully visible
export const useMessageVisibility = (
  onVisible: () => void,
  options = { threshold: 1.0 }
) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  const callback = useCallback(() => {
    if (!hasTriggered) {
      onVisible();
      setHasTriggered(true);
    }
  }, [hasTriggered, onVisible]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
        // Once triggered, we can stop observing
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, options, callback]);

  return ref;
};