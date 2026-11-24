import { LayoutGrid, List, Search, Shuffle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import type { ViewMode } from "@/store/slices/appSlice";
import type { CatalogSortBy } from "@/types";

interface CatalogFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  genre: string;
  onGenreChange: (value: string) => void;
  platform: string;
  onPlatformChange: (value: string) => void;
  sortBy: CatalogSortBy;
  onSortByChange: (value: CatalogSortBy) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  genres: readonly string[];
  platforms: readonly string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onSurpriseMe: () => void;
  isRandomLoading: boolean;
}

const SORT_LABELS: Record<CatalogSortBy, string> = {
  release_year_desc: "Newest First",
  release_year_asc: "Oldest First",
  title: "Title A–Z",
};

export function CatalogFilterBar({
  search,
  onSearchChange,
  genre,
  onGenreChange,
  platform,
  onPlatformChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
  genres,
  platforms,
  hasActiveFilters,
  onClearFilters,
  onSurpriseMe,
  isRandomLoading,
}: CatalogFilterBarProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 rounded-lg border border-border bg-card p-2.5 shadow-2xs">
        <div className="relative flex-1 min-w-[200px]">
          <Label htmlFor="catalog-search" className="sr-only">
            Search games by title or developer
          </Label>
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="catalog-search"
            type="text"
            placeholder="Search by title or developer..."
            className="pl-8.5 pr-8 h-9 text-xs bg-background border-input rounded-md"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search query"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SelectField
            id="catalog-genre"
            label="Filter by genre"
            active={genre !== "All"}
            value={genre}
            onChange={(e) => onGenreChange(e.target.value)}
          >
            {genres.map((g) => (
              <option key={g} value={g}>
                {g === "All" ? "All Genres" : g}
              </option>
            ))}
          </SelectField>

          <SelectField
            id="catalog-platform"
            label="Filter by platform"
            active={platform !== "All"}
            value={platform}
            onChange={(e) => onPlatformChange(e.target.value)}
          >
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p === "All" ? "All Platforms" : p}
              </option>
            ))}
          </SelectField>

          <SelectField
            id="catalog-sort"
            label="Sort catalog"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as CatalogSortBy)}
          >
            <option value="release_year_desc">Newest First</option>
            <option value="release_year_asc">Oldest First</option>
            <option value="title">Title A–Z</option>
          </SelectField>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSurpriseMe}
            disabled={isRandomLoading}
            aria-label="Open a random game from matching filters"
            className="h-9 px-3 rounded-md text-xs font-semibold border-input"
          >
            <Shuffle className="h-3.5 w-3.5 mr-1.5 text-primary" />
            {isRandomLoading ? "Picking..." : "Surprise Me"}
          </Button>

          <div
            role="group"
            aria-label="Catalog view mode"
            className="inline-flex h-9 items-center rounded-md border border-input bg-background p-0.5 ml-auto lg:ml-0"
          >
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              onClick={() => onViewModeChange("grid")}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Compact list view"
              aria-pressed={viewMode === "list"}
              onClick={() => onViewModeChange("list")}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">Active:</span>
          {search.trim() !== "" && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground hover:border-primary/50 cursor-pointer"
            >
              <span>Search: "{search.trim()}"</span>
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
          {genre !== "All" && (
            <button
              type="button"
              onClick={() => onGenreChange("All")}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground hover:border-primary/50 cursor-pointer"
            >
              <span>Genre: {genre}</span>
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
          {platform !== "All" && (
            <button
              type="button"
              onClick={() => onPlatformChange("All")}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground hover:border-primary/50 cursor-pointer"
            >
              <span>Platform: {platform}</span>
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
          {sortBy !== "release_year_desc" && (
            <button
              type="button"
              onClick={() => onSortByChange("release_year_desc")}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground hover:border-primary/50 cursor-pointer"
            >
              <span>Sort: {SORT_LABELS[sortBy]}</span>
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
          <button
            type="button"
            onClick={onClearFilters}
            className="text-[11px] font-semibold text-primary hover:underline ml-1 cursor-pointer"
          >
            Reset all
          </button>
        </div>
      )}
    </div>
  );
}
