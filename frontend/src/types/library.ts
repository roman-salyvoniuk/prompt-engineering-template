import type { Game } from "./game";

export type PlayStatus = "want_to_play" | "playing" | "completed";
export type LibraryImportMergeStrategy = "skip_existing" | "overwrite";

export interface LibraryEntry {
  id: string;
  user_id: string;
  game_id: string;
  status: PlayStatus;
  rating: number | null;
  notes: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  game?: Game;
}

export interface AddLibraryEntryRequest {
  game_id: string;
  status?: PlayStatus;
}

export interface UpdateLibraryEntryRequest {
  status?: PlayStatus;
  rating?: number | null;
  notes?: string;
  is_favorite?: boolean;
}

export interface GenreStatItem {
  genre: string;
  count: number;
}

export interface UserStats {
  total_games: number;
  want_to_play_count: number;
  playing_count: number;
  completed_count: number;
  average_rating: number | null;
  favorites_count: number;
  rated_count: number;
  completion_rate: number;
  top_genres: GenreStatItem[];
}

export interface LibraryExportItem {
  game_id: string;
  title: string;
  status: PlayStatus;
  rating: number | null;
  notes: string;
  is_favorite: boolean;
  updated_at: string;
}

export interface LibraryExportResponse {
  exported_at: string;
  total_entries: number;
  entries: LibraryExportItem[];
}

export interface LibraryImportItem {
  game_id: string;
  status?: PlayStatus;
  rating?: number | null;
  notes?: string;
  is_favorite?: boolean;
}

export interface LibraryImportRequest {
  entries: LibraryImportItem[];
  merge_strategy: LibraryImportMergeStrategy;
}

export interface LibraryImportResult {
  imported_count: number;
  updated_count: number;
  skipped_count: number;
}
