/**
 * Motion tokens — the single source of truth for durations, easings,
 * distances, and staggers. Consumed by both GSAP and Motion so the whole
 * app animates as one coherent product.
 */

export const DURATION = {
  /** Micro-interactions: hover, tap, toggles. */
  micro: 0.2,
  /** Content reveals on scroll / mount. */
  reveal: 0.7,
  /** Page transitions — keep under 400ms. */
  page: 0.35,
} as const;

/** GSAP easing strings. */
export const EASE_GSAP = {
  out: "power2.out",
  inOut: "power2.inOut",
} as const;

/** Motion cubic-bezier equivalents. */
export const EASE_MOTION = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
};

export const REVEAL = {
  /** Translate distance in px for fade-up reveals. */
  distance: 28,
  /** Stagger between sibling reveals in seconds. */
  stagger: 0.08,
  /** ScrollTrigger start position for content reveals. */
  start: "top 80%",
} as const;
