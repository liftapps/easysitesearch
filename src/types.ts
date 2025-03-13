export interface Config {
  key: string;
  apiUrl?: string;
  resultBaseUrl?: string;
}

export type SearchResult = {
  title: string;
  excerpt: string;
  uri: string;
  category: string;
  thumbnail?: string;
};
