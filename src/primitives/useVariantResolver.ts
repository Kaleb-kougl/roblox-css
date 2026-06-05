import React, { useEffect, useMemo, useRef } from "@rbxts/react";
import { createMotion, Motion, MotionGoal } from "@rbxts/ripple";
import { RunService } from "@rbxts/services";
import { CSSProperties, webStyle } from "../styles/webStyle";

export interface MotionProps {
	initial?: string;
	animate?: string;
	variants?: Record<string, Partial<CSSProperties> & Record<string, unknown>>;
	transition?: TweenInfo;
}

export function isAnimatable(value: unknown): boolean {
	const t = typeOf(value);
	return (
		t === "number" ||
		t === "UDim" ||
		t === "UDim2" ||
		t === "Vector2" ||
		t === "Vector3" ||
		t === "Color3" ||
		t === "CFrame" ||
		t === "Rect"
	);
}

export function useVariantResolver(
	animate?: string,
	initial?: string,
	variants?: Record<string, Partial<CSSProperties> & Record<string, unknown>>,
	transition?: TweenInfo,
	parser: (style: Partial<CSSProperties> & Record<string, unknown>) => Record<string, unknown> = (style) => {
		const result = webStyle(style as CSSProperties).props as Record<string, unknown>;
		for (const [k, v] of pairs(style as unknown as Map<string, unknown>)) {
			if (typeIs(k, "string") && k !== "_parsed" && result[k] === undefined) {
				const firstChar = k.sub(1, 1);
				if (firstChar >= "A" && firstChar <= "Z") {
					result[k] = v;
				}
			}
		}
		return result;
	},
) {
	// Parse all variants once to find animatable vs static keys
	const { animatableKeys, staticKeys } = useMemo(() => {
		const anim = new Set<string>();
		const stat = new Set<string>();
		if (variants) {
			for (const [_, variantStyle] of pairs(variants)) {
				const parsed = parser(variantStyle);
				for (const [key, value] of pairs(parsed)) {
					if (isAnimatable(value)) {
						anim.add(key as string);
					} else {
						stat.add(key as string);
					}
				}
			}
		}
		return { animatableKeys: anim, staticKeys: stat };
	}, [variants, parser]);

	// Maintain independent motions and bindings per property
	// to avoid Ripple's limitation with mixed type dictionaries.
	const motionState = useRef<{
		bindings: Map<string, React.Binding<unknown>>;
		setBindings: Map<string, (val: unknown) => void>;
		motions: Map<string, Motion<MotionGoal>>;
		loopState: Map<string, {
			initialValue: unknown;
			targetValue: unknown;
			options: Record<string, unknown>;
			repeatCount: number;
			reverses: boolean;
			loopsDone: number;
			isReversing: boolean;
		}>;
	}>();

	if (!motionState.current) {
		motionState.current = {
			bindings: new Map(),
			setBindings: new Map(),
			motions: new Map(),
			loopState: new Map(),
		};
	}

	// 1. Initialize bindings for each animatable key
	for (const key of animatableKeys) {
		if (!motionState.current.bindings.has(key)) {
			let initialVal: unknown = undefined;
			
			// Seed priority: explicit `initial` prop → "idle" key → current animate target → first found
			const initialKey = initial;
			if (initialKey && variants && variants[initialKey] && parser(variants[initialKey])[key] !== undefined) {
				initialVal = parser(variants[initialKey])[key];
			} else if (variants && variants["idle"] && parser(variants["idle"])[key] !== undefined) {
				initialVal = parser(variants["idle"])[key];
			} else if (animate && variants && variants[animate]) {
				const parsed = parser(variants[animate]);
				initialVal = parsed[key];
			}

			// If it's missing in the initial variant, grab it from any variant
			// just to know its type for Ripple.
			if (initialVal === undefined && variants) {
				for (const [_, variantStyle] of pairs(variants)) {
					const parsed = parser(variantStyle);
					if (parsed[key] !== undefined) {
						initialVal = parsed[key];
						break;
					}
				}
			}

			if (initialVal !== undefined) {
				const [binding, setBinding] = React.createBinding(initialVal);
				const motion = createMotion(initialVal as MotionGoal);
				motionState.current.bindings.set(key, binding as React.Binding<unknown>);
				motionState.current.setBindings.set(key, setBinding as (val: unknown) => void);
				motionState.current.motions.set(key, motion as Motion<MotionGoal>);
			}
		}
	}

	// Setup Ripple heartbeat update loop
	useEffect(() => {
		const state = motionState.current!;
		const connection = RunService.Heartbeat.Connect((dt) => {
			for (const [key, motion] of state.motions) {
				const value = motion.step(dt) as unknown;
				const binding = state.bindings.get(key)!;
				if (value !== (binding.getValue() as unknown)) {
					state.setBindings.get(key)!(value);
				}

				// Custom loop handling for repeating/reversing animations
				const loopData = state.loopState.get(key);
				if (loopData && motion.isComplete()) {
					if (loopData.isReversing) {
						// We just finished reversing back to initial value.
						loopData.loopsDone++;
						if (loopData.repeatCount === -1 || loopData.loopsDone <= loopData.repeatCount) {
							// Play forward again
							loopData.isReversing = false;
							motion.tween(loopData.targetValue as never, loopData.options as never);
						} else {
							state.loopState.delete(key);
						}
					} else {
						// We just finished playing forward.
						if (loopData.reverses) {
							// Now reverse
							loopData.isReversing = true;
							motion.tween(loopData.initialValue as never, loopData.options as never);
						} else {
							// We don't reverse, so just snap back and play forward
							loopData.loopsDone++;
							if (loopData.repeatCount === -1 || loopData.loopsDone <= loopData.repeatCount) {
								motion.set(loopData.initialValue as never);
								motion.tween(loopData.targetValue as never, loopData.options as never);
							} else {
								state.loopState.delete(key);
							}
						}
					}
				}
			}
		});

		return () => {
			connection.Disconnect();
		};
	}, []);

	// Animate target changes
	useEffect(() => {
		if (animate && variants && variants[animate]) {
			const parsed = parser(variants[animate]);

			let options: Record<string, unknown> = { time: 0.3 };
			let repeatCount = 0;
			let reverses = false;

			if (transition) {
				options = {
					time: transition.Time ?? 0.3,
					style: transition.EasingStyle,
					direction: transition.EasingDirection,
					delayTime: transition.DelayTime,
				};
				repeatCount = transition.RepeatCount ?? 0;
				reverses = transition.Reverses ?? false;
			}

			for (const key of animatableKeys) {
				const targetValue = parsed[key];
				if (targetValue !== undefined) {
					const motion = motionState.current!.motions.get(key);
					if (motion) {
						if (repeatCount !== 0 || reverses) {
							const existingLoop = motionState.current!.loopState.get(key);
							
							// Only reset the loop if we are targeting a new value
							// or if we aren't currently looping this property
							if (!existingLoop || existingLoop.targetValue !== targetValue) {
								motionState.current!.loopState.set(key, {
									initialValue: motionState.current!.bindings.get(key)!.getValue(),
									targetValue: targetValue,
									options: options,
									repeatCount: repeatCount,
									reverses: reverses,
									loopsDone: 0,
									isReversing: false,
								});
								motion.tween(targetValue as never, options as never);
							}
						} else {
							// Clear old loop state for this property to prevent conflicts
							motionState.current!.loopState.delete(key);
							motion.tween(targetValue as never, options as never);
						}
					}
				}
			}
		}
	}, [animate, variants, transition, animatableKeys, parser]);

	// Create a plain object of the bindings to spread onto the component
	const animatedProps = useMemo(() => {
		const props: Record<string, React.Binding<unknown>> = {};
		for (const [key, binding] of motionState.current!.bindings) {
			if (animatableKeys.has(key)) {
				props[key] = binding;
			}
		}
		return props;
	}, [animatableKeys]);

	// Compute current static props
	const staticProps = useMemo(() => {
		const props: Record<string, unknown> = {};
		if (animate && variants && variants[animate]) {
			const parsed = parser(variants[animate]);
			for (const key of staticKeys) {
				if (parsed[key] !== undefined) {
					props[key] = parsed[key];
				}
			}
		}
		return props;
	}, [animate, variants, staticKeys, parser]);

	return { animatedProps, staticProps };
}
