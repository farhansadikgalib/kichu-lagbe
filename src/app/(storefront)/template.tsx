"use client";

import { useEffect, type ReactNode } from "react";
import { MotionConfig, motion } from "motion/react";
import { DURATION, EASE_MOTION } from "@/lib/motion/tokens";

// The first render is server HTML the visitor can already see. Fading it in
// again after hydration blanks the page mid-read, so the transition only plays
// for client-side navigations (the template remounts on each one).
let hasNavigated = false;

/**
 * Storefront page transition. Remounts per route segment, giving each page a
 * quick fade-in. Opacity only — a transform here would break sticky/fixed
 * descendants and skew ScrollTrigger measurements during the transition.
 */
export default function Template({ children }: { children: ReactNode }) {
  useEffect(() => {
    hasNavigated = true;
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={hasNavigated ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.page, ease: EASE_MOTION.out }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
