/**
 * transitions.ts — Pre-configured animation transitions for Motion primitives.
 *
 * Provides a standardized set of TweenInfo configurations to ensure consistency
 * across all declarative animations, per ADR-0002.
 */

export const transitions = {
	/** Standard UI state change, smooth and subtle */
	default: new TweenInfo(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
	
	/** Bouncy, energetic pop-in for modals or badges */
	pop: new TweenInfo(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
	
	/** Slow, looping breathing effect for idle states */
	breathe: new TweenInfo(2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true),
	
	/** Fast, immediate snap for extremely snappy interactions */
	snap: new TweenInfo(0.1, Enum.EasingStyle.Linear),
	
	/** Looping shimmer or slide effect */
	shimmer: new TweenInfo(1, Enum.EasingStyle.Linear, Enum.EasingDirection.InOut, -1),
};
