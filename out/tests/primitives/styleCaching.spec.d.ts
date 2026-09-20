/**
 * styleCaching.spec.tsx — Regression tests for the useWebStyle parse cache.
 *
 * The primitives reuse a cached webStyle() result across renders. Text and
 * Image post-process that result (multiplying transparency by `opacity`), so
 * these tests pin the behaviour that would break if the cached table were
 * mutated in place: the value must be identical after a re-render, not
 * compounded.
 */
export {};
