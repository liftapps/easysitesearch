import { Config, SearchResult } from './types';

export const runSearch = async (
  options: { config: Config; signal: AbortSignal },
  query: string,
) => {
  if (!query.length) {
    return [];
  }

  const url = new URL(`${options.config.apiUrl}/v1/search`);

  url.searchParams.set('key', options.config.key);
  url.searchParams.set('query', query);

  const response = await fetch(url, {
    signal: options.signal,
  });

  const json = await response.json();

  return json as Array<SearchResult>;
};

export const getRecommendations = async (options: {
  config: Config;
  signal: AbortSignal;
}) => {
  const url = new URL(`${options.config.apiUrl}/v1/recommendations`);

  url.searchParams.set('key', options.config.key);

  const response = await fetch(url, {
    signal: options.signal,
  });

  const json = await response.json();

  return json as Array<SearchResult>;
};

export const sendMetrics = async (
  options: { config: Config; signal: AbortSignal },
  query: string,
  resultsCount: number,
) => {
  const metricsEndpoint = `${options.config.apiUrl}/v1/metrics`;

  const url = new URL(metricsEndpoint);
  url.searchParams.append('key', options.config.key);
  url.searchParams.append('query', query);
  url.searchParams.append('results_count', `${resultsCount}`);

  await fetch(url);
};
