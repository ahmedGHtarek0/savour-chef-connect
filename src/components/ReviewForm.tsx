import { useState } from "react";
import { Star } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitReview } from "@/lib/reviews.functions";

export function ReviewForm({ orderId, onSubmitted }: { orderId: string; onSubmitted?: () => void }) {
  const submit = useServerFn(submitReview);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      await submit({ data: { orderId, rating, comment: comment.trim() || null } });
      toast.success("Thanks for your review!");
      onSubmitted?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not submit review");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-sm font-medium">Rate your meal</p>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className="transition-transform hover:scale-110"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              className={`h-7 w-7 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
            />
          </button>
        ))}
      </div>
      <Textarea
        className="mt-3"
        placeholder="Tell others how it was…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
      />
      <Button className="mt-3 w-full" disabled={busy} onClick={send}>
        {busy ? "Submitting…" : "Submit review"}
      </Button>
    </div>
  );
}