import { useRef, useState } from "react";
import { Download, LayoutGrid, List, Search, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import type { ViewMode } from "@/store/slices/appSlice";
import type { LibraryImportMergeStrategy } from "@/types";

export type LibrarySortBy = "updated_desc" | "rating_desc" | "title_asc";

interface LibraryActionsBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: LibrarySortBy;
  onSortByChange: (value: LibrarySortBy) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  isExporting: boolean;
  onImportFile: (file: File, mergeStrategy: LibraryImportMergeStrategy) => Promise<void>;
  isImporting: boolean;
  feedbackMessage: string | null;
  errorMessage: string | null;
}

export function LibraryActionsBar({
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
  onExportJson,
  onExportCsv,
  isExporting,
  onImportFile,
  isImporting,
  feedbackMessage,
  errorMessage,
}: LibraryActionsBarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mergeStrategy, setMergeStrategy] = useState<LibraryImportMergeStrategy>("skip_existing");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onImportFile(file, mergeStrategy);
    e.target.value = "";
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between rounded-lg border border-border bg-card p-2.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1">
            <Label htmlFor="library-search" className="sr-only">
              Search your library
            </Label>
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="library-search"
              type="text"
              placeholder="Filter library by title, developer, or notes..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8.5 pr-8 h-9 text-xs rounded-md"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear library search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <SelectField
            id="library-sort"
            label="Sort library"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as LibrarySortBy)}
          >
            <option value="updated_desc">Recently Updated</option>
            <option value="rating_desc">Highest Rated</option>
            <option value="title_asc">Title A–Z</option>
          </SelectField>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={onExportJson}
            className="h-9 text-xs rounded-md"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={onExportCsv}
            className="h-9 text-xs rounded-md"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>

          <SelectField
            id="import-strategy"
            label="Import merge strategy"
            value={mergeStrategy}
            onChange={(e) => setMergeStrategy(e.target.value as LibraryImportMergeStrategy)}
            className="text-muted-foreground"
          >
            <option value="skip_existing">Skip existing</option>
            <option value="overwrite">Overwrite existing</option>
          </SelectField>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isImporting}
            onClick={() => fileInputRef.current?.click()}
            className="h-9 text-xs rounded-md font-semibold"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {isImporting ? "Importing..." : "Import JSON"}
          </Button>

          <div
            role="group"
            aria-label="Library view mode"
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

      {feedbackMessage && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400"
        >
          {feedbackMessage}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive"
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
