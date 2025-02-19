import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'preact/hooks';
import { Config } from './types';

type SearchResult = {
  title: string;
  excerpt: string;
  uri: string;
};

const runSearch = async (
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

const sendMetrics = async (
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

const SearchInput = (props: { onChange: (query: string) => void }) => {
  return (
    <div class="searchInput">
      <svg
        class="w-6 h-6 text-gray-800"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke="currentColor"
          stroke-linecap="round"
          stroke-width="2"
          d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
        />
      </svg>

      <input
        ref={(self) => self?.focus()}
        type="search"
        placeholder="Search anything"
        onInput={(e) => props.onChange(e.currentTarget.value)}
      />
    </div>
  );
};

const SearchResultsPreview = (props: {
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
      <a className="result" style={{ display: 'block' }} href={result.uri}>
        <div>
          <span
            className="title"
            dangerouslySetInnerHTML={{ __html: result.title }}
          ></span>
          <div
            id={result.uri}
            dangerouslySetInnerHTML={{ __html: result.excerpt }}
          ></div>
        </div>
      </a>
    ));
  }, [props.results]);

  return (
    <div className="resultsWrapper">
      {props.phrase.length ? resultsFragment : null}
    </div>
  );
};

type State = {
  phrase: string;
  results: SearchResult[];
};

type Actions =
  | { type: 'phraseChange'; payload: string }
  | { type: 'widgetOpen' }
  | { type: 'widgetClose' }
  | { type: 'resultsSet'; payload: SearchResult[] };

const initialState: State = { phrase: '', results: [] };

const reducer = (currentState: State, action: Actions): State => {
  switch (action.type) {
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

export default function Modal(props: {
  onClose: VoidFunction;
  config: Config;
}) {
  const [state, dispatch] = useReducer<State, Actions>(reducer, initialState);

  const { phrase, results } = state;
  const timeoutRef = useRef<any>(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleCloseDialog = useCallback(() => {
    dialogRef?.current?.close();
    dispatch({ type: 'phraseChange', payload: '' });
    props.onClose();
  }, [props.onClose]);

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
            config: props.config,
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
    dialogRef.current?.showModal();

    const handleClickOutside = (e: MouseEvent) => {
      if (e?.target === dialogRef.current) {
        handleCloseDialog();
      }
    };

    dialogRef.current?.addEventListener('click', handleClickOutside);

    return () =>
      dialogRef.current?.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <dialog className="modal" ref={dialogRef} onClose={handleCloseDialog}>
      <div class="inner">
        <header>
          <SearchInput
            onChange={(newPhrase) =>
              dispatch({ type: 'phraseChange', payload: newPhrase })
            }
          />
          <button className="closeButton" onClick={handleCloseDialog}>
            <svg
              class="w-6 h-6 text-gray-800"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18 17.94 6M18 18 6.06 6"
              />
            </svg>
          </button>
        </header>

        <SearchResultsPreview
          config={props.config}
          phrase={phrase}
          results={results}
        />
      </div>
    </dialog>
  );
}
