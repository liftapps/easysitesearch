import { useCallback, useEffect, useReducer, useRef } from 'preact/hooks';
import { Config, SearchResult } from './types';
import { fetchClientIndexIfEnabled, runServerSearch } from './api';
import { SearchResultsPreview } from './components/SearchResultsPreview';

const highlightTerms = (
  text: string,
  items: string[],
  caseSensitive = false,
) => {
  // Make a copy of the original text
  let result = text;

  // Sort items by length (longest first) to handle overlapping terms correctly
  const sortedItems = [...items].sort((a, b) => b.length - a.length);

  // Escape special regex characters in the items
  const escapedItems = sortedItems.map((item) =>
    item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  );

  // Create a regex that matches any of the items
  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(`\\b(${escapedItems.join('|')})\\b`, flags);

  // Replace all occurrences with the same text wrapped in <em> tags
  return result.replace(regex, '<em>$1</em>');
};

const anyToSearchResult = (doc: any): SearchResult => {
  const words = doc.text.split(' ');
  const firstMatch = words.indexOf(doc.terms[0]);
  const baseExcerpt = doc.text.split(' ').slice(firstMatch, 80).join(' ');
  const excerpt = baseExcerpt.length
    ? highlightTerms(baseExcerpt, doc.terms)
    : doc.text.split(' ').slice(0, 80).join(' ');

  return {
    category: doc.category,
    title: highlightTerms(doc.title, doc.terms),
    uri: doc.uri,
    thumbnail: doc.thumbnail,
    excerpt: `${excerpt}...`,
  };
};

const SearchInput = (props: {
  config: Config;
  onChange: (query: string) => void;
}) => {
  return (
    <div class="searchInput">
      <input
        ref={(self) => self?.focus()}
        type="search"
        placeholder={props.config.searchInput?.placeholder ?? 'Search'}
        onInput={(e) => props.onChange(e.currentTarget.value)}
      />
    </div>
  );
};

type LocalIndex = Awaited<ReturnType<typeof fetchClientIndexIfEnabled>>;

type State = {
  phrase: string;
  results: SearchResult[];
  localIndex: LocalIndex;
  status: 'error' | 'ready' | 'initializing';
};

type Actions =
  | {
      type: 'init';
      payload: Awaited<ReturnType<typeof fetchClientIndexIfEnabled>>;
    }
  | { type: 'phraseChange'; payload: string }
  | { type: 'widgetOpen' }
  | { type: 'widgetClose' }
  | { type: 'resultsSet'; payload: SearchResult[] };

const initialState: State = {
  phrase: '',
  results: [],
  localIndex: null,
  status: 'initializing',
};

const reducer = (currentState: State, action: Actions): State => {
  switch (action.type) {
    case 'phraseChange': {
      return {
        ...currentState,
        phrase: action.payload,
      };
    }
    case 'init': {
      return {
        ...currentState,
        status: 'ready',
        localIndex: action.payload,
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

  const { phrase, results, localIndex, status } = state;
  const timeoutRef = useRef<any>(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleCloseDialog = useCallback(() => {
    dialogRef?.current?.close();
    dispatch({ type: 'phraseChange', payload: '' });
    props.onClose();
  }, [props.onClose]);

  useEffect(() => {
    (async () => {
      const index = await fetchClientIndexIfEnabled(props.config);
      dispatch({ type: 'init', payload: index });
    })();
  }, []);

  useEffect(() => {
    if (!phrase.length || status === 'initializing') {
      dispatch({ type: 'resultsSet', payload: [] });
      return;
    }

    const abortController = new AbortController();

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      (async () => {
        // Run client search if server enabled it due to license check
        if (localIndex) {
          const localSearchResults = localIndex.search(phrase, {
            prefix: (term) => term.length > 3,
            fuzzy: (term) => (term.length > 3 ? 0.2 : false),
          });

          return dispatch({
            type: 'resultsSet',
            payload: localSearchResults.map(anyToSearchResult),
          });
        }

        const results = await runServerSearch(
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
            config={props.config}
            onChange={(newPhrase) =>
              dispatch({ type: 'phraseChange', payload: newPhrase })
            }
          />

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

        <SearchResultsPreview
          config={props.config}
          phrase={phrase}
          results={results}
        />
      </div>
    </dialog>
  );
}
