import { useDispatch, useSelector } from "react-redux";
import { Gamepad2, Lock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/features/auth/AuthModal";
import { CatalogPage } from "@/features/games/CatalogPage";
import { GameDetailsPage } from "@/features/games/GameDetailsPage";
import { MyLibraryPage } from "@/features/games/MyLibraryPage";
import { ProfilePage } from "@/features/games/ProfilePage";
import { StatusRatingDialog } from "@/features/games/StatusRatingDialog";
import { useAuth } from "@/hooks/useAuth";
import { setCurrentView } from "@/store/slices/appSlice";
import type { AppDispatch, RootState } from "@/store/store";

function GuestProtectedView() {
  const dispatch = useDispatch<AppDispatch>();
  const { openLoginModal, openRegisterModal } = useAuth();

  return (
    <div className="container mx-auto px-4 py-16 sm:px-8 max-w-lg">
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-5 shadow-xs">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold tracking-tight">Sign in required</h2>
          <p className="text-sm text-muted-foreground">
            Log in or create an account to access your personal game library, favorites, notes, and
            profile analytics.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <Button type="button" onClick={openLoginModal}>
            Log In
          </Button>
          <Button type="button" variant="secondary" onClick={openRegisterModal}>
            Sign Up
          </Button>
          <Button type="button" variant="ghost" onClick={() => dispatch(setCurrentView("catalog"))}>
            Back to Catalog
          </Button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const currentView = useSelector((state: RootState) => state.app.currentView);
  const { isAuthenticated } = useAuth();

  const renderMainView = () => {
    if (currentView === "details") return <GameDetailsPage />;
    if (currentView === "library") {
      return isAuthenticated ? <MyLibraryPage /> : <GuestProtectedView />;
    }
    if (currentView === "profile") {
      return isAuthenticated ? <ProfilePage /> : <GuestProtectedView />;
    }
    return <CatalogPage />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1">{renderMainView()}</main>

      <footer className="border-t border-border bg-card/50 py-6 text-xs text-muted-foreground transition-colors">
        <div className="container mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
              <Gamepad2 className="h-3.5 w-3.5" />
            </div>
            <span className="font-serif font-bold text-foreground">GameLibrary</span>
            <span className="hidden md:inline text-muted-foreground">
              — Personal Video Game Index & Backlog Journal
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs font-medium">
            <button
              type="button"
              onClick={() => dispatch(setCurrentView("catalog"))}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Catalog
            </button>
            <button
              type="button"
              onClick={() => dispatch(setCurrentView("library"))}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              My Library
            </button>
            <button
              type="button"
              onClick={() => dispatch(setCurrentView("profile"))}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Profile
            </button>
          </div>

          <span className="font-mono tabular-nums text-[11px] uppercase tracking-wider text-muted-foreground">
            2,279 Cataloged Titles
          </span>
        </div>
      </footer>

      <AuthModal />
      <StatusRatingDialog />
    </div>
  );
}

export default App;
