/**
 * transitions.ts — Pre-configured animation transitions for Motion primitives.
 *
 * Provides a standardized set of TweenInfo configurations to ensure consistency
 * across all declarative animations, per ADR-0002.
 */
export declare const transitions: {
    /** Standard UI state change, smooth and subtle */
    default: TweenInfo;
    /** Bouncy, energetic pop-in for modals or badges */
    pop: TweenInfo;
    /** Slow, looping breathing effect for idle states */
    breathe: TweenInfo;
    /** Fast, immediate snap for extremely snappy interactions */
    snap: TweenInfo;
    /** Looping shimmer or slide effect */
    shimmer: TweenInfo;
};
