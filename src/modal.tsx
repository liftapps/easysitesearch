import { useCallback, useEffect, useReducer, useRef } from 'preact/hooks';
import { Config, SearchResult } from './types';
import { runSearch } from './api';
import { SearchResultsPreview } from './components/SearchResultsPreview';

const SearchInput = (props: { onChange: (query: string) => void }) => {
  return (
    <div class="searchInput">
      <input
        ref={(self) => self?.focus()}
        type="search"
        placeholder="Type in your query"
        onInput={(e) => props.onChange(e.currentTarget.value)}
      />
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
          <span class="header-text">Search</span>
          <button className="closeButton" onClick={handleCloseDialog}>
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
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

        <search>
          <SearchInput
            onChange={(newPhrase) =>
              dispatch({ type: 'phraseChange', payload: newPhrase })
            }
          />
        </search>

        <SearchResultsPreview
          config={props.config}
          phrase={phrase}
          results={results}
        />
      </div>
    </dialog>
  );
}
