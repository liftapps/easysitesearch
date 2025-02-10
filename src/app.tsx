import { useEffect, useState } from 'preact/hooks';
import { lazy, Suspense } from 'preact/compat';
import { Config } from './types';

const LazyModal = lazy(() => import('./modal'));

export function App(props: { config: Config }) {
  const [open, setIsOpen] = useState(false);

  useEffect(() => {
    const openEventListener = () => {
      setIsOpen(true);
    };

    document.addEventListener('openSearch', openEventListener);
    return () => document.removeEventListener('openSearch', openEventListener);
  }, []);

  return (
    <div class="searchWidget">
      {open && (
        <Suspense fallback={null}>
          <LazyModal onClose={() => setIsOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
