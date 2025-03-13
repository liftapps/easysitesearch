import { DEFAULT_CATEGORIES } from '../constants';
import { Config, SearchResult } from '../types';

export const SearchResultRenderer = (props: {
  result: SearchResult;
  config: Config;
}) => {
  return (
    <a
      className="result"
      target={props.config.resultBaseUrl?.length ? '_blank' : '_self'}
      href={`${props.config.resultBaseUrl ?? ''}${props.result.uri}`}
    >
      <div className="titleWrapper">
        <span
          className="title"
          dangerouslySetInnerHTML={{ __html: props.result.title }}
        ></span>

        <div className="uri">
          {props.result.uri === '/' ? 'homepage' : props.result.uri}
        </div>
      </div>

      <div
        className="excerpt"
        id={props.result.uri}
        dangerouslySetInnerHTML={{ __html: props.result.excerpt }}
      ></div>

      <div className="tags">
        <span className="category">
          {DEFAULT_CATEGORIES[props.result.category ?? ''] ??
            props.result.category}
        </span>
      </div>

      <div className="thumbnailWrapper">
        {props.result.thumbnail && (
          <img className="thumbnail" src={props.result.thumbnail} />
        )}
      </div>
    </a>
  );
};
