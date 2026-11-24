import { useDispatch, useSelector } from "react-redux";
import { Gamepad2, Library, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLibrary } from "@/hooks/useLibrary";
import { setCurrentView, type AppView } from "@/store/slices/appSlice";
import type { AppDispatch, RootState } from "@/store/store";

export function Navbar() {
  const dispatch = useDispatch<AppDispatch>();
  const currentView = useSelector((state: RootState) => state.app.currentView);
  const { user, isAuthenticated, logout, openLoginModal, openRegisterModal } = useAuth();
  const { stats } = useLibrary();

  const handleNav = (view: AppView) => {
    dispatch(setCurrentView(view));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm transition-colors">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-8">
        <button
          type="button"
          onClick={() => handleNav("catalog")}
          className="flex cursor-pointer items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/35 bg-primary/10 text-primary">
            <Gamepad2 className="h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-lg tracking-tight text-foreground">
              GameLibrary
            </span>
            <span className="hidden sm:inline font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Index
            </span>
          </div>
        </button>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-1 bg-muted/60 p-1 rounded-md border border-border/80"
        >
          <button
            type="button"
            onClick={() => handleNav("catalog")}
            className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              currentView === "catalog" || currentView === "details"
                ? "bg-background text-foreground shadow-2xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Catalog
          </button>

          {isAuthenticated && (
            <>
              <button
                type="button"
                onClick={() => handleNav("library")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  currentView === "library"
                    ? "bg-background text-foreground shadow-2xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Library className="h-3.5 w-3.5" />
                <span>My Library</span>
                {stats && stats.total_games > 0 && (
                  <span className="ml-0.5 rounded-sm bg-primary/15 text-primary px-1.5 py-0.2 font-mono tabular-nums text-[10px] font-bold">
                    {stats.total_games}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleNav("profile")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  currentView === "profile"
                    ? "bg-background text-foreground shadow-2xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span>Profile</span>
              </button>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="h-4 w-px bg-border hidden sm:block" />

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleNav("profile")}
                className="hidden sm:flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold hover:border-primary/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-primary/15 font-mono text-[11px] font-bold text-primary">
                  {user?.username.charAt(0).toUpperCase()}
                </span>
                <span>{user?.username}</span>
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                title="Log out"
                className="h-8 px-2.5 text-xs border-border"
              >
                <LogOut className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Log Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={openLoginModal} className="h-8 text-xs">
                <LogIn className="h-3.5 w-3.5 mr-1.5" />
                Log In
              </Button>
              <Button size="sm" onClick={openRegisterModal} className="h-8 text-xs font-semibold">
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex md:hidden items-center justify-around border-t border-border bg-card/80 px-2 py-1.5 text-xs font-medium">
        <button
          type="button"
          onClick={() => handleNav("catalog")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors cursor-pointer ${
            currentView === "catalog" || currentView === "details"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Gamepad2 className="h-4 w-4" />
          <span>Catalog</span>
        </button>

        {isAuthenticated && (
          <>
            <button
              type="button"
              onClick={() => handleNav("library")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors cursor-pointer ${
                currentView === "library"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Library className="h-4 w-4" />
              <span>Library</span>
              {stats && stats.total_games > 0 && (
                <span className="ml-0.5 rounded-sm bg-primary-foreground/20 px-1.5 py-0.2 font-mono tabular-nums text-[10px] font-bold">
                  {stats.total_games}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleNav("profile")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors cursor-pointer ${
                currentView === "profile"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserIcon className="h-4 w-4" />
              <span>Profile</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
