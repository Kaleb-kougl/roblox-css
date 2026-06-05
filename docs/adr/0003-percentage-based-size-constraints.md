# ADR-0003: Percentage-Based Size Constraints

## Status

Accepted

**Date:** 2026-05-18
**Deciders:** @kalebmon
**Relates to:** [ADR-0001: React to Roblox UI Middleware](./0001-react-to-roblox-ui-middleware.md)

## Context

Our CSS middleware (`webStyle.ts`) currently supports `minWidth`, `maxWidth`, `minHeight`, and `maxHeight` — but only for **absolute pixel values**. The current implementation extracts the `.Offset` component from `parseDimension()` and feeds it directly into `UISizeConstraint.MinSize` / `MaxSize` as a `Vector2`:

```typescript
const minW = style.minWidth !== undefined ? (parseDimension(style.minWidth) ?? new UDim(0, 0)).Offset : 0;
// ...
children.push(React.createElement("uisizeconstraint", {
    MinSize: new Vector2(minW, minH),
    MaxSize: new Vector2(maxW, maxH),
}));
```

This works perfectly for `maxWidth: 400` or `minHeight: "200px"`, but **silently drops the `.Scale` component**. If a developer writes `maxWidth: "50%"`, `parseDimension` correctly returns `UDim(0.5, 0)`, but the middleware extracts only `.Offset` (which is `0`), producing a broken `MaxSize` of `Vector2(0, ...)`. This is a silent, hard-to-debug failure.

The root cause is Roblox's `UISizeConstraint` API: `MinSize` and `MaxSize` are `Vector2` — **absolute pixel values only**. There is no native way to express "50% of parent" in a size constraint.

### Why This Matters

Standard CSS makes heavy use of percentage-based limits. Common patterns like `maxWidth: "50%"` for responsive layouts, modal caps, or sidebar constraints are foundational. Without support, developers must manually compute pixel values or avoid percentage constraints entirely — undermining the middleware's goal of familiar web-like authoring.

## Considered Options

### Option A: Reactive Bindings (`AbsoluteSize` Tracking)

**Concept:** Track the parent's `AbsoluteSize` via the `Change` JSX prop (e.g., `Change={{ AbsoluteSize: ... }}`) and dynamically compute the pixel equivalent of the percentage constraint. Use `React.createBinding` to keep this out of the React render cycle.

**Mechanism:**
```tsx
// Pseudocode — inside a hypothetical <ConstrainedBox>
const [parentSize, setParentSize] = React.createBinding(new Vector2(0, 0));

// Attach to a wrapper or use ref to the actual parent
<frame Change={{ AbsoluteSize: (rbx) => setParentSize(rbx.AbsoluteSize) }}>
  <uisizeconstraint
    MaxSize={parentSize.map((ps) => new Vector2(ps.X * 0.5, math.huge))}
  />
  {children}
</frame>
```

**Pros:**
- **Accurate:** Dynamically resolves the true pixel size from the percentage at runtime.
- **Binding-performant:** `React.createBinding` + `.map()` updates the `UISizeConstraint.MaxSize` property **directly** on the Roblox instance, bypassing React's reconciler.
- **Composable:** Works with any layout.
- **Familiar mental model:** Developers write `maxWidth: "50%"` and it "just works."

**Cons:**
- **Requires parent context:** The `Change={{ AbsoluteSize }}` listener must be on the **parent** container, but the size constraint lives on the **child**.
- **Initial frame flash:** On the first render, `AbsoluteSize` is `(0, 0)` until the instance joins the DataModel.
- **Cascading updates:** If multiple nested elements all use percentage constraints, an ancestor resize triggers a chain of `AbsoluteSize` change events down the tree.

**Performance Profile:** ★★★★☆

---

### Option B: Structural Wrapper Frames

**Concept:** Instead of constraining the child with a `UISizeConstraint`, the middleware wraps the element in an invisible parent `<frame>` whose `Size` is set to the percentage limit.

**Mechanism:**
```tsx
// Middleware would emit something like:
<frame Size={UDim2.fromScale(0.5, 1)} BackgroundTransparency={1}>
  <frame Size={UDim2.fromScale(1, 1)} {...originalProps}>
    {originalChildren}
  </frame>
</frame>
```

**Pros:**
- **Zero runtime cost:** No event listeners, no bindings, no scripting.
- **Immediate correctness:** No initial-frame pop.
- **Simple implementation.**

**Cons:**
- **Breaks `UIListLayout` and `UIGridLayout`:** This is the **critical flaw**. Layout modifiers in Roblox operate on immediate children.
- **Breaks `maxWidth` semantics:** A wrapper frame with `Size = {0.5, 0}` sets the element's **size**, not its **maximum**.
- **Double node overhead:** Every percentage-constrained element gets an extra `Instance`. For a grid with 20 items, that's 20 phantom frames.
- **Breaks `ref` forwarding.**

**Performance Profile:** ★★★★★ — Zero runtime cost. But the correctness issues make it impractical.

> **⚠️ CAUTION:**
> This option fundamentally conflicts with the middleware's flex/grid layout injection.

---

### Option C: UIFlexItem Properties (Native Flex Constraints)

**Concept:** When the constrained element is inside a flex container, use `UIFlexItem` with `FlexMode`, `GrowRatio`, and `ShrinkRatio` to emulate min/max behavior natively.

**Mechanism:**
```tsx
// For an element with maxWidth: "50%" inside a flex row:
<frame Size={UDim2.fromScale(0.5, 1)}>
  <uiflexitem FlexMode={Enum.UIFlexMode.Shrink} />
</frame>
```

**Pros:**
- **Native flex integration:** `UIFlexItem` is the engine's purpose-built tool.
- **Performant:** Zero scripting cost.
- **Semantically correct in flex context.**

**Cons:**
- **Only works in flex containers:** `UIFlexItem` requires a parent with `UIListLayout`.
- **Imprecise semantics:** CSS `max-width` means "never exceed this width." Flex shrink/grow ratios are about distributing available space.
- **Doesn't map to `UISizeConstraint`:** We'd be replacing the `<uisizeconstraint>` injection with `<uiflexitem>` injection.
- **No existing usage:** Most existing projects have few `UIFlexItem` instances.

**Performance Profile:** ★★★★★ — Native engine, zero cost. But the semantic mismatch disqualifies it.

---

## Decision

**Recommended: Option A — Reactive Bindings via `React.createBinding` + `ParentSizeContext`.**

Option A is the only approach that provides **correct CSS semantics** across all layout contexts without introducing structural side-effects. The cons are manageable:

| Concern | Mitigation |
|:--------|:-----------|
| **Parent context** | Introduce a lightweight `ParentSizeContext` React Context. Every `<Box>` provides its `AbsoluteSize` binding to children via an always-attached `Change={{ AbsoluteSize }}` listener. |
| **Initial frame flash** | Default the binding to `math.huge` (unconstrained) instead of `0`. |
| **Cascade depth** | Acceptable for most UI scopes (max nesting ~4-5 levels). If profiling shows issues, we can batch updates via `RunService.RenderStepped`. |

### Implementation Sketch

#### Box.tsx Integration

The hook is called inside `<Box>` and its returned element (if any) is inserted as a sibling of `webStyle`'s children.

```tsx
const bindingRef = useRef<{ binding: React.Binding<Vector2>; set: (v: Vector2) => void }>();
if (!bindingRef.current) {
    const [binding, setBinding] = React.createBinding(new Vector2(math.huge, math.huge));
    bindingRef.current = { binding, set: setBinding };
}
const { binding: absSize, set: setAbsSize } = bindingRef.current;

const percentageConstraint = usePercentageConstraints(style);

if (style) {
    const parsedStyle = webStyle(style);
    return (
        <ParentSizeContext.Provider value={absSize}>
            <frame
                ref={ref}
                {...defaultProps}
                {...parsedStyle.props}
                {...explicitProps}
                Change={{ AbsoluteSize: (rbx) => setAbsSize(rbx.AbsoluteSize) }}
            >
                {parsedStyle.children}
                {percentageConstraint}
                {children}
            </frame>
        </ParentSizeContext.Provider>
    );
}
```

The implementation splits into three layers:

**Layer 1: `ParentSizeContext` (new file)**
```typescript
export const ParentSizeContext = React.createContext<React.Binding<Vector2> | undefined>(undefined);
```

**Layer 2: `<Box>` provides the context**

**Layer 3: `usePercentageConstraints` hook (new file)**
A dedicated hook called inside `<Box>` that reads the parent context and produces a binding-driven `<uisizeconstraint>`.

### Mixed Pixel + Percentage Constraints

When a developer mixes pixel and percentage constraints on the same element (e.g., `minWidth: "200px", maxWidth: "50%"`), the hook takes **exclusive ownership** of the entire `<uisizeconstraint>`. It reads pixel values from `parseDimension()` as fallback defaults for any axis that doesn't use a percentage.

When the hook activates, `webStyle()` must **skip** its own `<uisizeconstraint>` injection to avoid emitting two competing constraints.

```typescript
function hasPercentageScale(style: CSSProperties): boolean {
    const check = (v: string | number | undefined) => {
        if (v === undefined) return false;
        const dim = parseDimension(v);
        return dim !== undefined && dim.Scale > 0;
    };
    return check(style.minWidth) || check(style.maxWidth)
        || check(style.minHeight) || check(style.maxHeight);
}
```

### What This Does NOT Change

- **Pixel-only constraints continue to work as-is.**
- **No changes to `dimensionParser.ts`.**
- **No changes to `CSSTypes.d.ts`.**
- **`width`/`height` percentages are unaffected.**

### Testing Strategy

`Change.AbsoluteSize` never fires in the headless Edit-mode Jest environment. To verify percentage constraint math, tests **mock `ParentSizeContext`** with a static `Vector2`.

## Consequences

### Positive
- Developers can write `maxWidth: "50%"` and get correct, responsive behavior.
- The binding-based approach is consistent with the project's existing animation system.
- No phantom DOM nodes.

### Negative
- Adds a React Context (`ParentSizeContext`) to the primitive tree.
- Every `<Box>` unconditionally attaches a `Change={{ AbsoluteSize }}` listener. For a UI with ~50 `<Box>` instances, that's ~50 binding updates per resize frame (~0.05ms total — negligible).

#### Lazy Activation (Phase 1 Requirement)

The strategy: **always provide the context, gate the listener.**

##### Evaluated Lazy Activation Strategies

**Strategy L1: Always Attach (Recommended)**
Every `<Box>` unconditionally attaches the `Change.AbsoluteSize` listener.

**Strategy L2: Child Registration via Context Callback**
The parent provides a `register()` callback via a second context.

**Strategy L3: Explicit `provideSize` Prop**
The developer manually opts in.

##### Decision: Strategy L1 (Always Attach)
The cost of 50 binding updates per resize frame (~0.05ms) is well below the 1ms budget for input responsiveness. The simplicity advantage is decisive.

### Risks

| Risk | Likelihood | Impact | Mitigation |
|:-----|:----------:|:------:|:-----------|
| **Initial render flash** (constraint is `math.huge` until `AbsoluteSize` fires) | Medium | Low | Visually imperceptible for most UI. |
| **Deep nesting cascade** (5+ levels of percentage constraints) | Low | Low | Typical UI is max ~4 levels deep. Monitor with profiler; batch if needed. |
| **Complexity creep** in `<Box>` | Medium | Medium | Keep the context provider and hook isolated in their own files. |
| **Pixel + percentage conflict** (two `UISizeConstraint` on same element) | Medium | High | Hook takes exclusive ownership when any axis uses percentage. |

## References

- [Roblox UISizeConstraint](https://create.roblox.com/docs/reference/engine/classes/UISizeConstraint)
- [Roblox UIFlexItem](https://create.roblox.com/docs/reference/engine/classes/UIFlexItem)
- [React bindings in @rbxts/react](https://littensy.github.io/rbxts-react/)
