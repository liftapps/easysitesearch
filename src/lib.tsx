import { render } from 'preact';
import { App } from './app.tsx';
import { Config } from './types.ts';

export const setup = (activatorSelector: string | string[], config: Config) => {
  const configWithDefaults: Config = {
    ...config,
    apiUrl: config.apiUrl ?? 'https://api.easysitesearch.com',
    resultBaseUrl: config.resultBaseUrl ?? '',
  };

  const wrapperId = `easy-site-search-wrapper_${config.key}`;

  const existingContainer = document.querySelector(`#${wrapperId}`);
  if (existingContainer) {
    existingContainer.remove();
    console.warn(`[Easy Site Search] Widget setup used more than once`);
  }

  const container = document.createElement('div');
  container.id = wrapperId;
  document.body.appendChild(container);

  const activatorSelectors = Array.isArray(activatorSelector)
    ? activatorSelector
    : [activatorSelector];

  activatorSelectors.forEach((selector) => {
    const elements = Array.from(document.querySelectorAll(selector));

    elements?.forEach((element) => {
      element?.addEventListener('click', (e) => {
        e.preventDefault();

        const openEvent = new CustomEvent('openSearch', {
          detail: {
            config,
          },
        });

        document.dispatchEvent(openEvent);
      });
    });
  });

  render(<App config={configWithDefaults} />, container);
};
