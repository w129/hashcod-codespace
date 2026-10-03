export const motionTokens = Object.freeze({
  duration: Object.freeze({
    instant: 0.1,
    fast: 0.16,
    standard: 0.28,
  }),
  ease: Object.freeze({
    standard: Object.freeze([0.4, 0, 0.2, 1]),
    enter: Object.freeze([0.16, 1, 0.3, 1]),
  }),
  blur: Object.freeze({
    subtle: 4,
    soft: 8,
  }),
  spring: Object.freeze({
    smooth: Object.freeze({
      type: "spring",
      stiffness: 320,
      damping: 30,
      mass: 0.8,
    }),
    snappy: Object.freeze({
      type: "spring",
      stiffness: 520,
      damping: 32,
      mass: 0.65,
    }),
  }),
});
