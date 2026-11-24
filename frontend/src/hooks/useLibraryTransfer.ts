import { useState } from "react";
import {
  useImportLibraryMutation,
  useLazyExportLibraryCsvQuery,
  useLazyExportLibraryJsonQuery,
} from "@/store/api/libraryApi";
import type { LibraryImportItem, LibraryImportMergeStrategy } from "@/types";

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function useLibraryTransfer() {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [triggerExportJson, { isFetching: isExportingJson }] = useLazyExportLibraryJsonQuery();
  const [triggerExportCsv, { isFetching: isExportingCsv }] = useLazyExportLibraryCsvQuery();
  const [importLibrary, { isLoading: isImporting }] = useImportLibraryMutation();

  const handleExportJson = async () => {
    setErrorMessage(null);
    try {
      const data = await triggerExportJson().unwrap();
      triggerDownload(JSON.stringify(data, null, 2), "gamelibrary-export.json", "application/json");
      setFeedbackMessage(`Exported ${data.total_entries} library entries to JSON.`);
    } catch {
      setErrorMessage("Failed to export library as JSON.");
    }
  };

  const handleExportCsv = async () => {
    setErrorMessage(null);
    try {
      const csvText = await triggerExportCsv().unwrap();
      triggerDownload(csvText, "gamelibrary-export.csv", "text/csv;charset=utf-8");
      setFeedbackMessage("Exported library to CSV.");
    } catch {
      setErrorMessage("Failed to export library as CSV.");
    }
  };

  const handleImportFile = async (file: File, mergeStrategy: LibraryImportMergeStrategy) => {
    setFeedbackMessage(null);
    setErrorMessage(null);
    try {
      const raw = JSON.parse(await file.text()) as unknown;
      const rawList = Array.isArray(raw)
        ? raw
        : typeof raw === "object" &&
            raw !== null &&
            Array.isArray((raw as { entries?: unknown }).entries)
          ? (raw as { entries: unknown[] }).entries
          : null;
      if (!rawList) {
        setErrorMessage("Invalid JSON format: expected an array or an object with 'entries'.");
        return;
      }
      const result = await importLibrary({
        entries: rawList as LibraryImportItem[],
        merge_strategy: mergeStrategy,
      }).unwrap();
      setFeedbackMessage(
        `Import complete: ${result.imported_count} added, ${result.updated_count} updated, ${result.skipped_count} skipped.`
      );
    } catch {
      setErrorMessage("Failed to import JSON file. Verify file syntax and entry schema.");
    }
  };

  return {
    feedbackMessage,
    errorMessage,
    isExporting: isExportingJson || isExportingCsv,
    isImporting,
    handleExportJson,
    handleExportCsv,
    handleImportFile,
  };
}
