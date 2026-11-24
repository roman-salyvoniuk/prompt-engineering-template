import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { LibraryEntry, PlayStatus } from "@/types";

export type AppView = "catalog" | "details" | "library" | "profile";
export type LibraryFilter = "all" | "favorites" | PlayStatus;
export type ViewMode = "grid" | "list";

const VIEW_MODE_KEY = "gamelibrary_view_mode";

function loadInitialViewMode(): ViewMode {
  try {
    return localStorage.getItem(VIEW_MODE_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

interface AppState {
  currentView: AppView;
  selectedGameId: string | null;
  libraryFilter: LibraryFilter;
  viewMode: ViewMode;
  isStatusDialogOpen: boolean;
  statusDialogEntry: LibraryEntry | null;
}

const initialState: AppState = {
  currentView: "catalog",
  selectedGameId: null,
  libraryFilter: "all",
  viewMode: loadInitialViewMode(),
  isStatusDialogOpen: false,
  statusDialogEntry: null,
};

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setCurrentView(state, action: PayloadAction<AppView>) {
      state.currentView = action.payload;
      if (action.payload !== "details") {
        state.selectedGameId = null;
      }
    },
    openGameDetails(state, action: PayloadAction<string>) {
      state.selectedGameId = action.payload;
      state.currentView = "details";
    },
    setLibraryFilter(state, action: PayloadAction<LibraryFilter>) {
      state.libraryFilter = action.payload;
    },
    setViewMode(state, action: PayloadAction<ViewMode>) {
      state.viewMode = action.payload;
      try {
        localStorage.setItem(VIEW_MODE_KEY, action.payload);
      } catch {
        // Ignore storage restrictions
      }
    },
    openStatusDialog(state, action: PayloadAction<LibraryEntry>) {
      state.isStatusDialogOpen = true;
      state.statusDialogEntry = action.payload;
    },
    closeStatusDialog(state) {
      state.isStatusDialogOpen = false;
      state.statusDialogEntry = null;
    },
  },
});

export const {
  setCurrentView,
  openGameDetails,
  setLibraryFilter,
  setViewMode,
  openStatusDialog,
  closeStatusDialog,
} = appSlice.actions;

export default appSlice.reducer;
