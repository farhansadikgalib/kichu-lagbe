"use client";

import type { ReactNode } from "react";
import { MotionConfig, motion } from "motion/react";
import { DURATION, EASE_MOTION } from "@/lib/motion/tokens";

/**
 * Storefront page transition. Remounts per route segment, giving each page a
 * quick fade-in. Opacity only — a transform here would break sticky/fixed
 * descendants and skew ScrollTrigger measurements during the transition.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.page, ease: EASE_MOTION.out }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
