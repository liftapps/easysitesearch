import { useCallback, useEffect, useReducer, useRef } from 'preact/hooks';

type SearchResult = {
  title: string;
  excerpt: string;
  uri: string;
};

const runSearch = async (
  config: { key: string; signal: AbortSignal },
  query: string,
) => {
  if (!query.length) {
    return [];
  }

  const url = new URL(`http://localhost:3333/v1/search`);

  url.searchParams.set('key', config.key);
  url.searchParams.set('query', query);

  const response = await fetch(url, {
    signal: config.signal,
  });

  const json = await response.json();

  return json as Array<SearchResult>;
};

const sendMetrics = async (
  config: { key: string; signal: AbortSignal },
  query: string,
  resultsCount: number,
) => {
  const metricsEndpoint = `http://127.0.0.1:3333/v1/metrics`;

  const url = new URL(metricsEndpoint);
  url.searchParams.append('key', config.key);
  url.searchParams.append('query', query);
  url.searchParams.append('results_count', `${resultsCount}`);

  await fetch(url);
};

const SearchInput = (props: { onChange: (query: string) => void }) => {
  return (
    <input
      ref={(self) => self?.focus()}
      type="search"
      placeholder="Search anything"
      onInput={(e) => props.onChange(e.currentTarget.value)}
    />
  );
};

const SearchResultsPreview = (props: {
  results: SearchResult[];
  phrase: string;
}) => {
  const timerRef = useRef(0);

  useEffect(() => {
    if (!props.phrase.length) {
      return;
    }

    const abortController = new AbortController();

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      sendMetrics(
        {
          key: '01bf53f3-5fcf-4da1-ac48-54d89b9f405c',
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

  return (
    <div>
      {props.results.map((result) => (
        <div>
          <a
            style={{ display: 'block' }}
            href={result.uri}
            dangerouslySetInnerHTML={{ __html: result.title }}
          ></a>
          <div
            id={result.uri}
            dangerouslySetInnerHTML={{ __html: result.excerpt }}
          ></div>
        </div>
      ))}
    </div>
  );
};

type State = {
  phrase: string;
  results: SearchResult[];
  open: boolean;
};

type Actions =
  | { type: 'phraseChange'; payload: string }
  | { type: 'widgetOpen' }
  | { type: 'widgetClose' }
  | { type: 'resultsSet'; payload: SearchResult[] };

const initialState: State = { phrase: '', results: [], open: false };

const reducer = (currentState: State, action: Actions): State => {
  switch (action.type) {
    case 'widgetOpen': {
      return {
        ...currentState,
        open: true,
      };
    }
    case 'widgetClose': {
      return initialState;
    }
    case 'phraseChange': {
      return {
        ...currentState,
        phrase: action.payload,
      };
    }
    case 'resultsSet': {
      return {
        ...currentState,
        results: action.payload,
      };
    }
    default: {
      return currentState;
    }
  }
};

export function App() {
  const [state, dispatch] = useReducer<State, Actions>(reducer, initialState);

  const { phrase, results } = state;
  const timeoutRef = useRef(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleCloseDialog = useCallback(() => {
    dialogRef?.current?.close();
    dispatch({ type: 'widgetClose' });
    dispatch({ type: 'phraseChange', payload: '' });
  }, []);

  useEffect(() => {
    if (!phrase.length) {
      dispatch({ type: 'resultsSet', payload: [] });
      return;
    }

    const abortController = new AbortController();

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      (async () => {
        const results = await runSearch(
          {
            key: '01bf53f3-5fcf-4da1-ac48-54d89b9f405c',
            signal: abortController.signal,
          },
          phrase,
        );

        dispatch({ type: 'resultsSet', payload: results });
      })();
    }, 240);

    return () => {
      abortController.abort();
      clearTimeout(timeoutRef.current);
    };
  }, [phrase]);

  useEffect(() => {
    state.open ? dialogRef.current?.showModal() : handleCloseDialog();
  }, [state.open]);

  return (
    <div>
      <button
        style={{
          border: '1px solid black',
          background: 'none',
          cursor: 'pointer',
        }}
        onClick={() => dispatch({ type: 'widgetOpen' })}
      >
        Search...
      </button>

      <dialog
        ref={dialogRef}
        style={{ width: '100vw', height: '100vh' }}
        onClose={handleCloseDialog}
      >
        {state.open && (
          <>
            <SearchInput
              onChange={(newPhrase) =>
                dispatch({ type: 'phraseChange', payload: newPhrase })
              }
            />

            <SearchResultsPreview
              phrase={phrase}
              results={results}
            ></SearchResultsPreview>
          </>
        )}
      </dialog>
    </div>
  );
}
