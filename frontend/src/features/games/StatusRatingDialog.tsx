import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Heart, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLibrary } from "@/hooks/useLibrary";
import { closeStatusDialog } from "@/store/slices/appSlice";
import type { AppDispatch, RootState } from "@/store/store";
import type { LibraryEntry, PlayStatus } from "@/types";

interface DialogFormProps {
  entry: LibraryEntry;
  onClose: () => void;
}

function StatusRatingDialogForm({ entry, onClose }: DialogFormProps) {
  const { updateEntry, removeEntry, isMutating } = useLibrary();
  const [status, setStatus] = useState<PlayStatus>(entry.status);
  const [rating, setRating] = useState<number | null>(entry.rating);
  const [notes, setNotes] = useState<string>(entry.notes ?? "");
  const [isFavorite, setIsFavorite] = useState<boolean>(entry.is_favorite ?? false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSave = async () => {
    await updateEntry(entry.id, {
      status,
      rating,
      notes,
      is_favorite: isFavorite,
    });
    onClose();
  };

  const handleConfirmedRemove = async () => {
    await removeEntry(entry.id);
    onClose();
  };

  return (
    <>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl pr-6">
            Update {entry.game?.title ?? "Game"}
          </DialogTitle>
          <DialogDescription>
            Modify play status, personal rating, favorite flag, and journal notes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3.5 py-2.5">
            <span className="text-xs font-semibold text-foreground">Favorite Game</span>
            <Button
              type="button"
              size="sm"
              variant={isFavorite ? "default" : "outline"}
              aria-pressed={isFavorite}
              onClick={() => setIsFavorite((prev) => !prev)}
              className={`h-8 text-xs ${
                isFavorite ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600" : ""
              }`}
            >
              <Heart className={`h-3.5 w-3.5 mr-1.5 ${isFavorite ? "fill-current" : ""}`} />
              {isFavorite ? "Favorited" : "Add to Favorites"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Play Status</Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "want_to_play", label: "Want to Play" },
                  { id: "playing", label: "Playing" },
                  { id: "completed", label: "Completed" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStatus(item.id)}
                  className={`rounded-md border p-2.5 text-center text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    status === item.id
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Personal Rating (1–10)</Label>
              {rating !== null && (
                <button
                  type="button"
                  onClick={() => setRating(null)}
                  className="text-xs text-muted-foreground hover:text-destructive underline cursor-pointer"
                >
                  Clear Rating
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 justify-between">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setRating(rating === score ? null : score)}
                  aria-label={`Rate ${score} out of 10`}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border font-mono tabular-nums text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    rating === score
                      ? "border-amber-500 bg-amber-500 text-white shadow-2xs"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
            {rating !== null && (
              <p className="flex items-center gap-1 font-mono tabular-nums text-xs text-amber-600 dark:text-amber-400 font-semibold pt-1">
                <Star className="h-3.5 w-3.5 fill-current" />
                Rated {rating}/10
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="dialog-notes">Personal Notes</Label>
              <span className="font-mono tabular-nums text-[11px] text-muted-foreground">
                {notes.length} / 1000
              </span>
            </div>
            <Textarea
              id="dialog-notes"
              maxLength={1000}
              rows={3}
              placeholder="Write your thoughts, progress checkpoints, or mini review..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmOpen(true)}
              disabled={isMutating}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Remove
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isMutating}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={isMutating}>
                {isMutating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remove from library?"
        description={`Remove "${entry.game?.title ?? "this game"}" from your personal library? The global catalog entry will not be affected.`}
        confirmLabel="Remove Game"
        isLoading={isMutating}
        onConfirm={handleConfirmedRemove}
      />
    </>
  );
}

export function StatusRatingDialog() {
  const dispatch = useDispatch<AppDispatch>();
  const { isStatusDialogOpen, statusDialogEntry } = useSelector((state: RootState) => state.app);

  const handleClose = () => {
    dispatch(closeStatusDialog());
  };

  if (!statusDialogEntry) return null;

  return (
    <Dialog open={isStatusDialogOpen} onOpenChange={(open) => !open && handleClose()}>
      <StatusRatingDialogForm
        key={statusDialogEntry.id}
        entry={statusDialogEntry}
        onClose={handleClose}
      />
    </Dialog>
  );
}
