import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Moves the page back to the top when the user opens a new page.
// Back and forward navigation (POP) and links to a #section are left alone.
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === 'POP' || hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash, navigationType]);

  return null;
}

export default ScrollToTop;
