import { useEffect, useRef, useState } from 'react';

export default function useInView() {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (isInView) return undefined;
    const element = ref.current;
    if (!element) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

    observer.observe(element);
    return () => observer.disconnect();
  }, [isInView]);

  return [ref, isInView];
}
