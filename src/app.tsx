import { useEffect, useState } from 'preact/hooks';
import { Config } from './types';
import Modal from './modal';
import './index.css';

export function App(props: { config: Config }) {
  const [open, setIsOpen] = useState(false);

  useEffect(() => {
    const openEventListener = (event: any) => {
      if (event.detail.config.key !== props.config.key) {
        setIsOpen(false);
        return;
      }

      setIsOpen(true);
    };

    document.addEventListener('openSearch', openEventListener);
    return () => document.removeEventListener('openSearch', openEventListener);
  }, [props.config]);

  return (
    <div class="searchWidget">
      {open && <Modal config={props.config} onClose={() => setIsOpen(false)} />}
    </div>
  );
}
