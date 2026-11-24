export type CatalogSortBy = "release_year_desc" | "release_year_asc" | "title";

export interface Game {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  genres: string[];
  platforms: string[];
  release_year: number;
  developer: string;
}

export interface GameFilterParams {
  search?: string;
  genre?: string;
  platform?: string;
  sort_by?: CatalogSortBy;
  page?: number;
  page_size?: number;
}

export interface PaginatedGamesResponse {
  items: Game[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
