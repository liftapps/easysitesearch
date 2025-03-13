import { useEffect, useMemo, useRef } from 'preact/hooks';
import { Config, SearchResult } from '../types';
import { sendMetrics } from '../api';
import { SearchResultRenderer } from './SearchResultRenderer';
import { Recommendations } from './RecommendationsPreview';

export const SearchResultsPreview = (props: {
  results: SearchResult[];
  phrase: string;
  config: Config;
}) => {
  const timerRef = useRef<any>(0);

  useEffect(() => {
    if (!props.phrase.length) {
      return;
    }

    const abortController = new AbortController();

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      sendMetrics(
        {
          config: props.config,
          signal: abortController.signal,
        },
        props.phrase,
        props.results.length,
      );
    }, 1000);

    return () => {
      abortController.abort();
      clearTimeout(timerRef.current);
    };
  }, [props.results, props.phrase]);

  const resultsFragment = useMemo(() => {
    return props.results.map((result) => (
      <SearchResultRenderer
        config={props.config}
        key={result.uri}
        result={result}
      />
    ));
  }, [props.results]);

  return (
    <div className="resultsPreview">
      {props.phrase.length ? (
        resultsFragment
      ) : (
        <Recommendations config={props.config} />
      )}
    </div>
  );
};
