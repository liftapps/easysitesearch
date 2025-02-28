import { DEFAULT_CATEGORIES } from '../constants';
import { SearchResult } from '../types';

export const SearchResultRenderer = (props: { result: SearchResult }) => {
  return (
    <a className="result" style={{ display: 'block' }} href={props.result.uri}>
      <div>
        <div class="titleWrapper">
          <span
            className="title"
            dangerouslySetInnerHTML={{ __html: props.result.title }}
          ></span>
        </div>
        <div className="uri">
          {props.result.uri === '/' ? 'homepage' : props.result.uri}
        </div>
        <div
          className="excerpt"
          id={props.result.uri}
          dangerouslySetInnerHTML={{ __html: props.result.excerpt }}
        ></div>
        <div class="tags">
          <span class="category">
            {DEFAULT_CATEGORIES[props.result.category ?? ''] ??
              props.result.category}
          </span>
        </div>
      </div>
    </a>
  );
};
