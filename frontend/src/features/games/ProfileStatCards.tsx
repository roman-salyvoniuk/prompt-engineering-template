import { CheckCircle2, Clock, Gamepad2, Heart, Library } from "lucide-react";

interface ProfileStatCardsProps {
  total: number;
  wantCount: number;
  playingCount: number;
  completedCount: number;
  favoritesCount: number;
}

export function ProfileStatCards({
  total,
  wantCount,
  playingCount,
  completedCount,
  favoritesCount,
}: ProfileStatCardsProps) {
  const statCards = [
    {
      label: "Total",
      value: total,
      caption: "In collection",
      valueClass: "text-foreground",
      icon: <Library className="h-4 w-4 text-primary" />,
      spanClass: "",
    },
    {
      label: "Want to Play",
      value: wantCount,
      caption: "In backlog",
      valueClass: "text-amber-600 dark:text-amber-400",
      icon: <Clock className="h-4 w-4 text-amber-500" />,
      spanClass: "",
    },
    {
      label: "Playing",
      value: playingCount,
      caption: "Active sessions",
      valueClass: "text-blue-600 dark:text-blue-400",
      icon: <Gamepad2 className="h-4 w-4 text-blue-500" />,
      spanClass: "",
    },
    {
      label: "Completed",
      value: completedCount,
      caption: "Finished games",
      valueClass: "text-emerald-600 dark:text-emerald-400",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      spanClass: "",
    },
    {
      label: "Favorites",
      value: favoritesCount,
      caption: "Top picks",
      valueClass: "text-rose-600 dark:text-rose-400",
      icon: <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />,
      spanClass: "col-span-2 sm:col-span-1",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {statCards.map((card) => (
        <div
          key={card.label}
          className={`rounded-lg border border-border bg-card p-4.5 space-y-2 shadow-2xs ${card.spanClass}`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">
              {card.label}
            </span>
            {card.icon}
          </div>
          <div className={`font-mono tabular-nums text-3xl font-bold ${card.valueClass}`}>
            {card.value}
          </div>
          <p className="text-[11px] text-muted-foreground">{card.caption}</p>
        </div>
      ))}
    </div>
  );
}
