import { useEffect, useReducer, useRef } from 'preact/hooks';
import { getRecommendations } from '../api';
import { Config, SearchResult } from '../types';
import { SearchResultRenderer } from './SearchResultRenderer';

type State = {
  status: 'loading' | 'done' | 'error';
  results: SearchResult[];
};

type Actions =
  | { type: 'resultsSet'; payload: SearchResult[] }
  | { type: 'error' };

const initialState: State = { status: 'loading', results: [] };

const reducer = (currentState: State, action: Actions): State => {
  switch (action.type) {
    case 'resultsSet': {
      return {
        ...currentState,
        status: 'done',
        results: action.payload,
      };
    }
    case 'error': {
      return {
        ...currentState,
        status: 'error',
      };
    }
    default: {
      return currentState;
    }
  }
};

export const Recommendations = (props: { config: Config }) => {
  const [state, dispatch] = useReducer<State, Actions>(reducer, initialState);

  useEffect(() => {
    const abortController = new AbortController();

    (async () => {
      try {
        const results = await getRecommendations({
          config: props.config,
          signal: abortController.signal,
        });
        dispatch({ type: 'resultsSet', payload: results });
      } catch (error) {
        console.error(error);
        dispatch({ type: 'error' });
      }
    })();

    return () => abortController.abort();
  }, []);

  if (!state.results.length) {
    return null;
  }

  return (
    <div className="recommendations">
      <h4 className="header-text">Recommended</h4>
      {state.results.map((result) => (
        <SearchResultRenderer key={result.uri} result={result} />
      ))}
    </div>
  );
};
