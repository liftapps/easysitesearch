export interface SearchInputConfig {
  placeholder?: string;
}

export interface Config {
  key: string;
  apiUrl?: string;
  resultBaseUrl?: string;
  searchInput?: SearchInputConfig;
}

export type SearchResult = {
  title: string;
  excerpt: string;
  uri: string;
  category: string;
  thumbnail?: string;
};
