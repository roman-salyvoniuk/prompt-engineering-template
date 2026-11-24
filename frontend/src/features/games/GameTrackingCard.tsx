import { useState } from "react";
import { Gamepad2, Heart, Save, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LibraryEntry, PlayStatus } from "@/types";

interface TrackingNotesEditorProps {
  initialNotes: string;
  isMutating: boolean;
  onNotesSave: (notes: string) => Promise<void>;
}

function TrackingNotesEditor({ initialNotes, isMutating, onNotesSave }: TrackingNotesEditorProps) {
  const [notesDraft, setNotesDraft] = useState(initialNotes);
  const [notesSaved, setNotesSaved] = useState(false);

  const handleSaveNotes = async () => {
    await onNotesSave(notesDraft);
    setNotesSaved(true);
  };

  return (
    <div className="space-y-2.5 border-t border-border pt-5">
      <div className="flex items-center justify-between">
        <Label
          htmlFor="tracking-notes"
          className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
        >
          Journal Notes
        </Label>
        <span className="font-mono tabular-nums text-[11px] text-muted-foreground">
          {notesDraft.length} / 1000
        </span>
      </div>
      <Textarea
        id="tracking-notes"
        maxLength={1000}
        rows={3}
        placeholder="Add notes, build ideas, or thoughts..."
        value={notesDraft}
        onChange={(e) => {
          setNotesDraft(e.target.value);
          setNotesSaved(false);
        }}
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
          {notesSaved ? "Notes saved" : ""}
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isMutating || notesDraft.trim() === initialNotes.trim()}
          onClick={handleSaveNotes}
          className="h-8 text-xs"
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          Save Notes
        </Button>
      </div>
    </div>
  );
}

interface GameTrackingCardProps {
  isAuthenticated: boolean;
  inLibrary: boolean;
  entry?: LibraryEntry;
  isMutating: boolean;
  onStatusChange: (newStatus: PlayStatus) => Promise<void>;
  onRatingChange: (newRating: number | null) => Promise<void>;
  onFavoriteToggle: () => Promise<void>;
  onNotesSave: (notes: string) => Promise<void>;
  onRequestRemove: () => void;
}

export function GameTrackingCard({
  isAuthenticated,
  inLibrary,
  entry,
  isMutating,
  onStatusChange,
  onRatingChange,
  onFavoriteToggle,
  onNotesSave,
  onRequestRemove,
}: GameTrackingCardProps) {
  if (isAuthenticated && inLibrary && entry) {
    return (
      <div className="rounded-xl border border-primary/35 bg-card p-6 space-y-6 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-serif font-bold text-lg flex items-center gap-2 text-foreground">
            <Gamepad2 className="h-4.5 w-4.5 text-primary" />
            Your Log
          </h3>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant={entry.is_favorite ? "default" : "outline"}
              size="sm"
              aria-pressed={entry.is_favorite}
              aria-label={entry.is_favorite ? "Remove from favorites" : "Mark as favorite"}
              onClick={onFavoriteToggle}
              disabled={isMutating}
              className={`h-8 px-2.5 rounded-md text-xs ${
                entry.is_favorite ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600" : ""
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${entry.is_favorite ? "fill-current" : ""}`} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRequestRemove}
              className="text-xs text-destructive hover:bg-destructive/10 h-8 px-2 rounded-md"
              disabled={isMutating}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <span className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Play Status
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            {(
              [
                { id: "want_to_play", label: "Want to Play" },
                { id: "playing", label: "Currently Playing" },
                { id: "completed", label: "Completed" },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={isMutating}
                onClick={() => onStatusChange(s.id)}
                className={`rounded-md border p-2.5 text-left text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  entry.status === s.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Personal Rating (1–10)
            </span>
            {entry.rating !== null && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 font-mono tabular-nums text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {entry.rating}/10
                </span>
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => onRatingChange(null)}
                  className="text-[11px] text-muted-foreground hover:text-destructive underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <button
                key={score}
                type="button"
                disabled={isMutating}
                onClick={() => onRatingChange(entry.rating === score ? null : score)}
                aria-label={`Rate ${score} out of 10`}
                className={`flex h-8 items-center justify-center rounded-md border font-mono tabular-nums text-xs font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  entry.rating === score
                    ? "border-amber-500 bg-amber-500 text-white shadow-2xs"
                    : "border-border bg-background/60 text-foreground hover:bg-muted"
                }`}
              >
                {score}
              </button>
            ))}
          </div>
        </div>

        <TrackingNotesEditor
          key={`${entry.id}:${entry.notes ?? ""}`}
          initialNotes={entry.notes ?? ""}
          isMutating={isMutating}
          onNotesSave={onNotesSave}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-2xs">
      <h3 className="font-serif font-bold text-lg text-foreground">Why log this game?</h3>
      <ul className="space-y-2.5 text-xs text-muted-foreground">
        <li className="flex items-start gap-2">
          <span className="text-primary font-bold">✓</span>
          <span>Organize your backlog and queue upcoming playthroughs.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary font-bold">✓</span>
          <span>Record personal scores (1–10), favorites, and review notes.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary font-bold">✓</span>
          <span>Export and back up your collection in JSON or CSV formats.</span>
        </li>
      </ul>
    </div>
  );
}
