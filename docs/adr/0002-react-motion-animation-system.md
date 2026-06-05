# ADR-0002: React Motion — Declarative Animation System

## Status

Accepted

**Date:** 2025-05-17
**Deciders:** @kalebmon

## Context

ADR-0001 established the React component library and deferred animation to a `useTween` hook that wraps `TweenService.Create()` in a `useEffect`. This was the right call for v1 — it let us ship without designing an animation system upfront.

Now that we're building more animated surfaces, `useTween` has become a bottleneck:

### Current Pain Points

| Problem | Evidence |
|:--------|:---------|
| **Imperative ref juggling.** Every animated property requires a `useRef`, a `useTween` call, and manual initial-value bookkeeping. | A complex UI component maintains 6 separate refs just for animation targets. |
| **No sequencing primitive.** Multi-step animations require hand-rolled state machines with `task.delay` chains and `useEffect` dependency arrays. | A multi-phase modal component implements a 4-phase state machine (`IDLE→FAST→DECEL→RESOLVE→REVEAL`) with ~130 LOC of sequencing that is fragile and hard to modify. |
| **Tween goals are static.** `useTween` accepts a fixed goal object and fires once on mount. Animating to *dynamic* targets requires falling back to raw `TweenService.Create()`. | A responsive component's compact-mode and hover transitions bypass `useTween` entirely, calling `TweenService.Create()` imperatively inside `useEffect`. |
| **No enter/exit animation model.** Components that need mount/unmount transitions must manage their own visibility state — there is no `AnimatePresence` equivalent. | A workaround component exists *solely* to play a scale-from-0 tween on mount. |
| **Duplicate patterns across layers.** Imperative controllers contain 30+ raw `TweenService.Create()` calls with identical shimmer/glow/pop patterns already abstracted in React components. | These are candidates for future React migration. |

### Scale of Affected Code

| Category | Files | `useTween` calls | Raw `TweenService.Create()` calls |
|:---------|:-----:|:----------------:|:---------------------------------:|
| React components | 5 | 7 | 6 |
| Imperative controllers | 4 | 0 | 30+ |
| Imperative utility | 1 | 0 | 9 |
| **Total** | **10** | **7** | **45+** |

## Decision Drivers

* **Declarative parity.** Animation state should be expressed the same way as UI state — through props and variants, not refs and side effects.
* **Composability.** It must be trivial to sequence, stagger, and sequence animations without state machines.
* **Incremental migration.** Must coexist with both `useTween` (React layer) and raw `TweenService` (imperative layer) during the transition.
* **Type safety.** Animated properties must be type-checked against the underlying Roblox instance.

## Considered Options

### Option A: Enhance `useTween` with Sequencing

Extend the existing hook to support chained goals, dynamic targets, and repeat/reverse:
```ts
useTween(ref, [
  { info: new TweenInfo(0.3), goals: { Scale: 1.1 } },
  { info: new TweenInfo(0.2), goals: { Scale: 1.0 } },
]);
```

### Option B: Adopt `@rbxts/react-motion` (Framer Motion for Roblox) — ⚠️ REJECTED

Replace `useTween` with the `motion.*` component wrappers and their variant/transition system:
```tsx
<motion.frame
  initial="hidden"
  animate={isOpen ? "visible" : "hidden"}
  variants={{
    hidden: { Size: UDim2.fromOffset(0, 0) },
    visible: { Size: UDim2.fromOffset(200, 200) },
  }}
  transition={{ duration: 0.3, easingStyle: Enum.EasingStyle.Back }}
/>
```

> **⚠️ Finding (2026-05-17):** `@rbxts/react-motion` has not been updated in approximately 2 years. The npm registry shows no publishes since mid-2024. Given how rapidly the underlying `@rbxts/react` bindings and Roblox engine APIs evolve, an unmaintained animation library carries unacceptable risk of silent incompatibilities, unpatched bugs, and eventual breakage with no upstream fix path. **This option is rejected on maintenance grounds.**

### Option C: Adopt `@rbxts/ripple` + `@rbxts/pretty-react-hooks`

Use littensy's actively maintained animation stack — the same author behind `@rbxts/react` (our React bindings) and `@rbxts/react-reflex` (our state management bindings):

- **`@rbxts/ripple`** — Core animation engine. Creates motion objects that interpolate between values using `TweenService`-backed easing (not spring physics). Lightweight, imperative API.
- **`@rbxts/pretty-react-hooks`** — React hook collection including `useMotion`, which wraps a ripple motion object into a React binding that auto-updates component props.

```tsx
import { useMotion } from "@rbxts/pretty-react-hooks";

function FadeBox(props: { visible: boolean }) {
  const [transparency, transparencyMotion] = useMotion(1);

  useEffect(() => {
    transparencyMotion.tween(props.visible ? 0 : 1, new TweenInfo(0.3));
  }, [props.visible]);

  return <frame BackgroundTransparency={transparency} />;
}
```

### Option D: Build Variant Layer In-House (on top of Option C)

Same dependency stack as Option C, but we build our own thin variant/transition abstraction on top of `useMotion` — giving us Framer Motion-style `animate="visible"` syntax without relying on an abandoned library for it.

```tsx
// Our own <MotionBox> wrapping useMotion + our variant resolver
<MotionBox
  animate={isOpen ? "visible" : "hidden"}
  variants={{
    hidden: { BackgroundTransparency: 1, Size: UDim2.new() },
    visible: { BackgroundTransparency: 0, Size: targetSize },
  }}
  transition={TRANSITIONS.pop}
/>
```

### Comparison

| Criteria | A: Enhance `useTween` | B: `react-motion` | C: `ripple` + hooks | D: Variant layer (on C) |
|:---------|:---------------------:|:------------------:|:-------------------:|:-----------------------:|
| **Maintenance status** | N/A (in-house) | ❌ Abandoned (~2yr) | ✅ Active (same author as `@rbxts/react`) | ✅ Active |
| **Dependency risk** | None | High — no upstream fixes | Low — core ecosystem package | Low |
| **Declarative variants** | ❌ Manual refs + effects | ✅ Built-in | ❌ Imperative `motion.tween()` | ✅ We build it |
| **Ref boilerplate** | Still required | Eliminated | Reduced (binding, not ref) | Eliminated |
| **Sequencing / sequencing** | Must hand-roll | Built-in stagger/delay | Must hand-roll in effects | We build it (simpler than A) |
| **Parent→child propagation** | ❌ | ✅ Automatic | ❌ | ✅ We build it |
| **Looping animations** | ✅ via `TweenInfo` | Unverified | ❌ Buggy (physics sleep kills loops) | ✅ Custom Sequencer |
| **Type safety** | Weak (`goals: object`) | Strong | Strong (generic motion values) | Strong |
| **Bundle size** | 0 KB | ~15 KB (unmaintained) | ~5 KB total | ~5 KB + ~200 LOC |
| **Engineering effort** | Low (extend existing) | Low (adopt) | Low (adopt) | Medium (~1–2 days for variant layer) |
| **Spring physics** | ❌ | ❌ | Available but not needed | Available but not needed |

## Decision

We will implement **Option D: Build a variant abstraction layer on top of `@rbxts/ripple` + `@rbxts/pretty-react-hooks`**.

### Rationale

- **Option B is rejected.** `@rbxts/react-motion` is unmaintained for ~2 years. We cannot take a dependency on abandoned software for a core UI concern.
- **Option A is insufficient.** It doesn't solve the fundamental problems (ref juggling, no variants, no sequencing). We'd be polishing the wrong abstraction.
- **Option C alone is not enough.** Raw `useMotion` is better than `useTween` (bindings > refs), but it's still imperative — we'd still need `useEffect` blocks to call `motion.tween()` on state changes, which is what we're trying to escape.
- **Option D gives us the best of both worlds.** We get a Framer Motion-style declarative API (`animate`, `variants`, `transition`) powered by a well-maintained, lightweight engine from the same author as our React bindings. The variant layer is ~200 LOC — a fraction of the complexity we're *removing* from consumer components.

We explicitly **do not need spring physics**. All current animations use `TweenInfo`-based easing (Quad, Back, Sine, Linear, Elastic). Ripple supports `TweenInfo`-backed transitions natively, which maps 1:1 to our existing animation parameters.

## Detailed Design

### 1. Variant Vocabulary

We define a project-wide set of semantic variant names. All motion components use this shared vocabulary so parent→child propagation works automatically.

| Variant | Meaning | Typical Properties |
|:--------|:--------|:-------------------|
| `"hidden"` | Off-screen or fully transparent (pre-mount / exit state) | `BackgroundTransparency: 1`, `Size: UDim2.new()`, `Position: offscreen` |
| `"visible"` | Default on-screen state | `BackgroundTransparency: 0`, `Size: target`, `Position: target` |
| `"hover"` | Mouse-enter interactive feedback | `Scale: 1.1`, stroke color changes |
| `"pressed"` | Click-down interactive feedback | `Scale: 0.95` |
| `"compact"` | Minimized layout state | `Size: COMPACT_SIZE`, `Position: COMPACT_POSITION` |
| `"idle"` | Looping ambient animation (breathing, heartbeat) | `Scale: [1.0, 1.05]` via repeat/reverse |
| `"active"` | Highlighted / selected state | `BackgroundColor3: accent`, glow properties |

Custom per-component variants (e.g., `"fast"`, `"decel"`, `"resolve"`, `"reveal"`) are allowed but should be namespaced to the component.

### 2. Declarative Loop Sequencing

A known limitation of `@rbxts/ripple` is its underlying physics-based sleep optimization. When an animation value stops changing drastically (e.g., reaching the boundary of a `TweenInfo` reversing tween), Ripple assumes the target has settled and prematurely terminates calculation, effectively killing `RepeatCount: -1` (infinite) loops.

To maintain a **purely declarative DX**, our `useVariantResolver` includes a custom `RunService.Heartbeat` sequencer. It intercepts `TweenInfo.RepeatCount` and `TweenInfo.Reverses` natively. Instead of relying on Ripple's buggy repeating solver, the resolver actively monitors `.isComplete()` and seamlessly bounces targets back and forth, enabling truly continuous looping animations (like `transitions.breathe`) without forcing developers to write manual `useEffect` timers in consumer components.

### 3. Motion Primitives — `<MotionBox>`, `<MotionText>`, `<MotionButton>`, `<MotionImage>`

We will **wrap** our existing primitives rather than replacing them. Each motion primitive:
1. Inherits the full props interface of its base primitive (`Box`, `Text`, `Button`, `Image`).
2. Adds the `motion.*` animation props (`animate`, `initial`, `variants`, `transition`).
3. Internally renders a `motion.frame` (or `motion.textlabel`, etc.) with the `webStyle()` translation applied.

```
┌──────────────────────────────────────────────────────────────┐
│  Consumer Code                                               │
│  <MotionBox animate="visible" variants={...} style={...} />  │
└─────────────────────┬────────────────────────────────────────┘
                      │ props
┌─────────────────────▼────────────────────────────────────────┐
│  MotionBox.tsx                                               │
│  - Merges webStyle(style) output with motion props           │
│  - Injects UIListLayout/UICorner/UIPadding as children       │
│  - Renders: <motion.frame {...mergedProps} />                │
└──────────────────────────────────────────────────────────────┘
```

**Why wrap instead of replace?**
- Non-animated components (static layout frames, labels) should not pay the motion runtime cost.
- Existing `<Box>` consumers remain untouched — zero-risk to stable code.
- The naming convention (`MotionBox` vs `Box`) makes animation intent explicit at the call site.

### 4. Transition Defaults

We define project-wide transition presets to ensure visual consistency:

```ts
// src/styles/transitions.ts

export const TRANSITIONS = {
  /** Standard enter/exit — used for most show/hide. */
  default: { duration: 0.3, easingStyle: Enum.EasingStyle.Quad, easingDirection: Enum.EasingDirection.Out },

  /** Springy pop — used for buttons, badges, modals. */
  pop: { duration: 0.4, easingStyle: Enum.EasingStyle.Back, easingDirection: Enum.EasingDirection.Out },

  /** Smooth ambient loop — used for breathing/heartbeat. */
  breathe: { duration: 1.5, easingStyle: Enum.EasingStyle.Sine, easingDirection: Enum.EasingDirection.InOut, repeatCount: -1, reverses: true },

  /** Quick snap — used for hover feedback. */
  snap: { duration: 0.15, easingStyle: Enum.EasingStyle.Quad, easingDirection: Enum.EasingDirection.Out },

  /** Shimmer sweep — used for gradient offset animations. */
  shimmer: { duration: 1.0, easingStyle: Enum.EasingStyle.Quad, easingDirection: Enum.EasingDirection.InOut },
} as const;
```

### 5. Complex Case Study — Multi-Phase Modal

A multi-phase modal is a hard migration target. Today it uses a `useEffect` state machine with 4 phases. Here is the migration strategy:

**Before (current):** State machine in `useEffect` + `task.delay` chains + `useTween` calls:
```
IDLE → (onDataResult) → FAST → (10 spins) → DECEL → (5 spins) → RESOLVE → REVEAL
```

**After (react-motion):** Phase state drives variant names directly:

```tsx
// Conceptual — not final implementation code
<MotionBox
  animate={phase}           // "hidden" | "fast" | "decel" | "resolve" | "reveal"
  variants={{
    hidden:  { BackgroundTransparency: 1 },
    fast:    { BackgroundColor3: bgColor },
    decel:   { BackgroundColor3: bgColor },
    resolve: { BackgroundColor3: bgColor },
    reveal:  { BackgroundColor3: rarityColor },
  }}
  transition={TRANSITIONS.default}
>
  <MotionImage
    animate={phase}
    variants={{
      fast:    { Position: goalPos, ImageTransparency: 0 },
      reveal:  { Position: centerPos, ImageTransparency: 0 },
    }}
    transition={{ duration: intervalDuration }}
  />
</MotionBox>
```

**What changes:**
- Subcomponents are eliminated — their animation behavior is expressed as variants on standard motion primitives.
- The phase state machine (`useEffect` + `task.delay`) remains, but it only sets `phase` — all visual transitions are derived declaratively from the variant.
- Sound effects stay imperative (they are side effects, not animation state).

**What stays the same:**
- The `IDLE→FAST→DECEL→RESOLVE→REVEAL` phase model is preserved.
- `spinCount` state tracking for timing remains.
- Network event handling is unchanged.

### 6. Deprecation Plan for `useTween`

| Phase | Action | Timeline |
|:------|:-------|:---------|
| **Phase 0** | `npm install @rbxts/ripple @rbxts/pretty-react-hooks`. Build variant resolver + primitives. Add `transitions.ts` presets. | Sprint 1 |
| **Phase 1** | Migrate simple, single-tween components. Mark `useTween` as `@deprecated` with a TSDoc notice. | Sprint 1 |
| **Phase 2** | Migrate complex UI components — replace refs + imperative calls with variants. | Sprint 2 |
| **Phase 3** | Migrate multi-phase modal components — replace state machine tween sequencing with phase-driven variants. | Sprint 2–3 |
| **Phase 4** | Delete `useTween.ts` and its test file. Remove `TweenService` import from all React components. | Sprint 3 |

> **Note:** Imperative controllers are *out of scope*. They use raw `TweenService` without React and will be addressed when/if they are migrated to React components per ADR-0001's scope expansion.

## Consequences

### Positive

* **Elimination of ref boilerplate.** UI drops from 6 animation refs to 0 — animation targets are implicit via `motion.*` components.
* **Readable animation intent.** `animate="compact"` is self-documenting; `TweenService:Create(...)` is not.
* **Parent→child propagation.** A parent `<MotionBox animate="visible">` automatically cascades the `"visible"` variant to all motion children, eliminating manual synchronization.
* **Consistent timing.** Shared `TRANSITIONS` presets ensure all animations use the same easing curves and durations, preventing visual inconsistency.
* **Simplified testing.** Variant state can be asserted via props (`expect(animate).toBe("visible")`) instead of inspecting `TweenService` mock calls.

### Negative

* **New dependencies.** `@rbxts/ripple` + `@rbxts/pretty-react-hooks` add ~5KB to the client bundle.
  * *Mitigation:* Both are maintained by littensy, the same author as `@rbxts/react` and `@rbxts/react-reflex` — packages we already depend on. Ecosystem alignment is maximal.
* **In-house variant layer is our code to maintain.** The ~200 LOC variant resolver is not a library — we own the bugs.
  * *Mitigation:* The variant resolver is a thin state→props mapper with no complex logic. It is straightforward to test and unlikely to need frequent changes.
* **Two animation paradigms during migration.** For 2–3 sprints, some components will use `useTween` while others use `MotionBox`.
  * *Mitigation:* `useTween` is marked `@deprecated` immediately in Phase 0. The migration order is designed to eliminate it within 3 sprints.

### Risks

| Risk | Likelihood | Impact | Mitigation |
|:-----|:----------:|:------:|:-----------|
| **Variant resolver complexity creeps.** Our in-house layer may grow beyond ~200 LOC as edge cases emerge. | Medium | Low | Hard cap: if it exceeds 400 LOC, revisit whether a maintained library has emerged. Keep the API surface minimal — no stagger/sequencing in v1. |
| **Performance regression on rapid multi-phase animations.** The modal cycles through rapid re-renders during the FAST phase. `useMotion` bindings may add overhead vs raw `TweenService`. | Medium | Medium | Profile before/after in Phase 3. If FPS drops below 55, batch state updates or use `key` remounting to skip interpolation during FAST phase. |
| **Gradient/UIStroke animations unsupported by motion bindings.** `useMotion` targets single numeric/Color3/UDim2 values; child instance properties (`UIGradient.Offset`, `UIStroke.Thickness`) may not map cleanly. | Medium | Low | These remain as imperative `useEffect` + `TweenService` calls. Not a blocker for `useTween` deletion. |

## References

* [`@rbxts/ripple`](https://www.npmjs.com/package/@rbxts/ripple) — Lightweight animation engine by littensy
* [`@rbxts/pretty-react-hooks`](https://www.npmjs.com/package/@rbxts/pretty-react-hooks) — React hooks including `useMotion`, by littensy
* [`@rbxts/react-motion`](https://www.npmjs.com/package/@rbxts/react-motion) — ⚠️ Abandoned (~2yr unmaintained). Evaluated and rejected.
* [Framer Motion — Variants](https://motion.dev/docs/react-animation#variants) — Design inspiration for variant model
* Internal: [ADR-0001](./0001-react-to-roblox-ui-middleware.md) — React to Roblox UI Middleware Architecture
