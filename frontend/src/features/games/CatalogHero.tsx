interface CatalogHeroProps {
  gamesCount: number;
  isLoading: boolean;
  isError: boolean;
}

export function CatalogHero({ gamesCount, isLoading, isError }: CatalogHeroProps) {
  return (
    <header className="border-b border-border pb-5 space-y-2">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
        Game Archive & Tracker
      </p>

      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Catalog Index
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse, filter, and log titles across PC and console platforms.
          </p>
        </div>

        {!isLoading && !isError && gamesCount > 0 && (
          <div className="inline-flex items-center self-start sm:self-auto rounded-md border border-border bg-card px-2.5 py-1 font-mono tabular-nums text-xs font-semibold text-foreground">
            {gamesCount.toLocaleString("en-US")} titles
          </div>
        )}
      </div>
    </header>
  );
}
