import { useDispatch } from "react-redux";
import { BarChart3, Gamepad2, Library, RefreshCw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileStatCards } from "@/features/games/ProfileStatCards";
import { useAuth } from "@/hooks/useAuth";
import { useLibrary } from "@/hooks/useLibrary";
import { setCurrentView } from "@/store/slices/appSlice";
import type { AppDispatch } from "@/store/store";

export function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const { stats, isLoading, isError, refetchLibrary } = useLibrary();

  if (!user) return null;

  const total = stats?.total_games ?? 0;
  const completedCount = stats?.completed_count ?? 0;
  const playingCount = stats?.playing_count ?? 0;
  const wantCount = stats?.want_to_play_count ?? 0;
  const topGenres = stats?.top_genres ?? [];
  const maxGenreCount = topGenres.length > 0 ? Math.max(...topGenres.map((g) => g.count), 1) : 1;

  const pct = (value: number) => (total > 0 ? `${(value / total) * 100}%` : "0%");

  return (
    <div className="container mx-auto px-4 py-6 sm:px-8 max-w-5xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-6 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary font-serif font-bold text-2xl border border-primary/25">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-0.5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              Player Profile
            </p>
            <h1 className="font-serif text-2xl font-bold tracking-tight">{user.username}</h1>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => dispatch(setCurrentView("library"))}
          className="rounded-md"
        >
          <Library className="mr-2 h-4 w-4" />
          Go to My Library
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="font-serif text-xl font-bold tracking-tight flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          Gaming Statistics
        </h2>

        {isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center text-destructive space-y-3">
            <p className="font-semibold text-sm">Failed to load profile statistics.</p>
            <Button type="button" variant="outline" size="sm" onClick={refetchLibrary}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 rounded-lg bg-muted/50 animate-pulse border" />
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <ProfileStatCards
              total={total}
              wantCount={wantCount}
              playingCount={playingCount}
              completedCount={completedCount}
              favoritesCount={stats?.favorites_count ?? 0}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-base">Completion Progress</h3>
                    <p className="font-mono tabular-nums text-xs text-muted-foreground">
                      {stats?.rated_count ?? 0} of {total} games rated
                    </p>
                  </div>
                  <span className="font-mono tabular-nums text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {(stats?.completion_rate ?? 0).toFixed(1)}%
                  </span>
                </div>

                <div
                  className="h-2.5 w-full overflow-hidden rounded-sm bg-muted flex"
                  aria-label="Library status distribution"
                >
                  <div
                    className="h-full bg-emerald-500 transition-[width] duration-300"
                    style={{ width: pct(completedCount) }}
                  />
                  <div
                    className="h-full bg-blue-500 transition-[width] duration-300"
                    style={{ width: pct(playingCount) }}
                  />
                  <div
                    className="h-full bg-amber-500 transition-[width] duration-300"
                    style={{ width: pct(wantCount) }}
                  />
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-xs bg-emerald-500" />
                    <span className="font-mono tabular-nums">Completed ({completedCount})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-xs bg-blue-500" />
                    <span className="font-mono tabular-nums">Playing ({playingCount})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-xs bg-amber-500" />
                    <span className="font-mono tabular-nums">Want to Play ({wantCount})</span>
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-center shadow-2xs">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-base flex items-center gap-2">
                      <Star className="h-4.5 w-4.5 text-amber-500 fill-amber-500" />
                      Average Personal Rating
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Calculated across{" "}
                      <span className="font-mono tabular-nums font-semibold">
                        {stats?.rated_count ?? 0}
                      </span>{" "}
                      rated titles in your library.
                    </p>
                  </div>
                  <div className="flex items-baseline gap-1 bg-muted/50 border border-border rounded-lg px-4 py-2 shrink-0">
                    <span className="font-mono tabular-nums text-3xl font-bold text-amber-600 dark:text-amber-400">
                      {stats?.average_rating !== null && stats?.average_rating !== undefined
                        ? stats.average_rating.toFixed(1)
                        : "—"}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground font-semibold">
                      / 10
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-2xs">
              <h3 className="font-serif font-bold text-base flex items-center gap-2">
                <BarChart3 className="h-4.5 w-4.5 text-primary" />
                Top Genres in Your Library
              </h3>

              {topGenres.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Log games to your library to see your favorite genre breakdown.
                </p>
              ) : (
                <div className="space-y-3">
                  {topGenres.map((item) => (
                    <div key={item.genre} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">{item.genre}</span>
                        <span className="font-mono tabular-nums text-muted-foreground font-medium">
                          {item.count} {item.count === 1 ? "game" : "games"}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-sm bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-sm bg-primary transition-[width] duration-300"
                          style={{ width: `${(item.count / maxGenreCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
