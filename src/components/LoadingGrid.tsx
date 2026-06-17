import { motion } from "framer-motion";

/**
 * Skeleton grid using shimmer blocks (not flat pulses) with a stagger.
 * Drop in anywhere a card grid is loading.
 */
export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-border bg-card/60 p-5"
        >
          <div className="shimmer mb-4 h-40 w-full rounded-xl" />
          <div className="shimmer mb-2 h-5 w-2/3 rounded-md" />
          <div className="shimmer h-4 w-1/2 rounded-md" />
        </motion.div>
      ))}
    </div>
  );
}
