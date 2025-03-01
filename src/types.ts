export interface Config {
  key: string;
  apiUrl?: string;
}

export type SearchResult = {
  title: string;
  excerpt: string;
  uri: string;
  category: string;
  thumbnail?: string;
};
