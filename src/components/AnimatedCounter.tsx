import { useEffect, useRef } from "react";
import { animate, useInView, useMotionValue, useTransform } from "framer-motion";
import { motion } from "framer-motion";

export function AnimatedCounter({
  to,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 2,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) =>
    prefix + v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix,
  );

  useEffect(() => {
    if (inView) {
      const controls = animate(count, to, { duration, ease: [0.22, 1, 0.36, 1] });
      return () => controls.stop();
    }
  }, [inView, to, duration, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}