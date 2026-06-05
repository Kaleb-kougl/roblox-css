# ADR-0001: React to Roblox UI Middleware Architecture

## Status

Accepted

**Date:** 2025-05-13
**Deciders:** @kalebmon
**Implementation started:** 2026-05 (parsers, webStyle, all 5 primitives complete)

## Context

We are building UI in Roblox using `@rbxts/react-roblox`. While this allows us to use React's state management and component model, the styling and layout paradigms in Roblox are fundamentally different from the Web. Roblox uses specific instances (`frame`, `textlabel`), absolute/relative coordinate math (`UDim2`), and `Color3` instead of CSS, the Box Model, and HTML elements (`div`, `span`).

This creates a steep learning curve and slows down development for engineers coming from a Web background. We need a system to bridge this gap, allowing developers to write UI using familiar web paradigms while compiling down to performant Roblox instances.

## Decision Drivers

* **Developer Velocity:** Must significantly lower the barrier to entry for web developers.
* **Type Safety:** Must leverage TypeScript to provide strong autocomplete and prevent invalid styling properties.
* **Performance:** Must avoid heavy runtime parsing or operations that cause frame drops (e.g., massive re-renders on window resize).
* **Maintainability:** The abstraction should be easy to extend as Roblox releases new UI features (like `UIFlexItem`).

## Considered Options

### Option 0: Direct `react-roblox` Intrinsics + Style Utility
Use `<frame>`, `<textlabel>`, `<textbutton>` JSX intrinsics directly from `@rbxts/react-roblox` with a thin `webStyle()` utility function that converts CSS-like objects to Roblox properties (`UDim2`, `Color3`, etc.).
```tsx
function ProfileCard(props: ProfileCardProps) {
    return <frame {...webStyle({ width: 120, height: 150, backgroundColor: "#23232D" })}>
        <uicorner CornerRadius={new UDim(0, 10)} />
        <textlabel {...webStyle({ fontSize: 12, color: "#fff" })} Text={props.title} />
    </frame>;
}
```
- **Pros:** No wrapper layer, thinnest possible API surface, leverages the existing reconciler directly, easy to adopt incrementally.
- **Cons:** No automatic child injection (`UIListLayout`, `UICorner`, `UIPadding` must be placed manually); verbose for layout-heavy screens; `webStyle()` is "just a function" with no component lifecycle or composition model.

### Option 1: Wrapper Component Library (The "React Native" Approach)
Creating primitive wrapper components (e.g., `<Box>`, `<Text>`, `<Button>`) that accept web-like `style` props and internally translate them to Roblox properties (`UDim2`, `Color3`) and inject layout children (`UIListLayout`, `UICorner`).
- **Pros:** Low initial complexity, extremely type-safe, highly performant, predictable behavior.
- **Cons:** Developers must use proprietary wrappers instead of standard intrinsic elements; requires manual mapping of CSS properties.

### Option 2: Runtime Styling Engine (Tailwind-to-Roblox)
Creating a parser that reads a `className="flex w-1/2 bg-red-500"` string and dynamically generates the Roblox properties at runtime.
- **Pros:** Maximum familiarity for web developers used to utility-first CSS.
- **Cons:** High runtime overhead parsing strings; complex to type-check class names without a build step; difficult to debug when styles conflict.

### Option 3: Custom React Reconciler
Forking or building a custom React Reconciler to allow developers to literally write `<div>` and use external `.css` files, writing an entire CSS engine in Luau to parse cascades and the Box Model.
- **Pros:** 100% Web compatibility.
- **Cons:** Monumental engineering effort; highly prone to edge-case bugs; mathematically complex to perfectly emulate the CSS Box model in Roblox.

## Decision

We will implement **Option 1: Wrapper Component Library**. We will create a suite of foundational primitives (`<Box>`, `<Text>`, `<Button>`, `<Image>`, `<Input>`) that accept a strongly-typed `style` object and handle the translation to Roblox instances.

## Rationale

Option 1 provides the best balance of effort vs. reward. By adopting a "React Native" philosophy, we can enforce strict TypeScript typing on our `style` objects, ensuring developers know exactly which web properties are supported. It avoids the severe runtime performance costs of parsing CSS or utility strings (Option 2), and it avoids the impossible scope of building a custom CSS engine (Option 3).

**Why Option 1 over Option 0:** Both options share the same `webStyle()` core for CSS→Roblox translation. The difference is automatic child injection. Roblox implements styling concepts that are CSS properties on the web (border-radius, padding, layout) as **child instances** (`UICorner`, `UIPadding`, `UIListLayout`) that must be placed inside the parent. A typical UI uses many of these. With Option 0, each is an explicit JSX element; with Option 1, they're derived from style props (`borderRadius: 10`, `padding: 10`, `display: "flex"`). The wrapper layer eliminates boilerplate during migration and on every future component.

## Consequences

### Positive
* **Familiarity:** Web developers can immediately be productive using properties like `width: "100%"`, `padding`, and `display: "flex"`.
* **Predictability:** Because it's just React components, standard React profiling and debugging tools still work perfectly.
* **Safety:** TypeScript will catch invalid styles at compile time.

### Negative
* **Mapping Maintenance:** We have to manually write and maintain the translation logic for every CSS property we want to support.
  * *Mitigation:* Property mapping is table-driven; adding a new property is one table entry + one test.
* **Proprietary API:** Developers cannot simply copy-paste web JSX; they must adapt it to use `<Box>` instead of `<div>`.
  * *Mitigation:* Wrapper names mirror React Native conventions (`Box`=`View`, `Text`=`Text`) — the mental model transfers.

### Risks

| Risk | Likelihood | Impact | Mitigation |
|:-----|:----------:|:------:|:-----------|
| **Animation integration complexity.** A typical project uses many `TweenService.Create()` calls. A declarative animation API (e.g., `useTween`) would be complex to design upfront. | High | Medium | **Resolved.** Fully addressed by **ADR-0002**, which introduces a declarative motion system and deprecates imperative `TweenService` calls. |
| **`UIGridLayout` not covered by Flexbox emulation.** Projects often require `UIGridLayout` which has no CSS Flexbox equivalent — it maps to CSS Grid. | Medium | Low | **Resolved in v2.** Added `display: "grid"` to the middleware, which injects `<uigridlayout>` and maps `gridTemplateColumns` and `gridTemplateRows` to `CellSize`. |

## Implementation Notes

* **Feature Mapping:** See [FEATURE_MAPPING.md](../FEATURE_MAPPING.md) for the high-level spec.
* **Translation split:** `webStyle()` handles universal layout/visual properties (sizing, positioning, background colors, opacity, border-radius, padding, flex layout, borders, absolute positioning) **and** typography (`fontSize`, `fontFamily`, `fontWeight`, `textAlign`, `whiteSpace`, `wordBreak`, `color`). Events (`onClick`, `onChange`, `onMouseEnter/Leave`) are mapped per-component inside `Text.tsx`, `Button.tsx`, and `Input.tsx`. Advanced `wordBreak` string manipulation (e.g., zero-width space injection for `"break-all"`) remains at the component level since it requires access to `children`.
* **Nominal typing:** All public types use a branded `unique symbol` pattern (e.g., `WebStyleResult & { readonly _parsed: unique symbol }`) to prevent structural subtyping bypasses. Return types are wrapped in `DeepReadonly<T>` to enforce immutability of parsed results.
* **Implemented primitives:** `<Box>` (frame), `<Text>` (textlabel), `<Button>` (textbutton), `<Image>` (imagelabel), `<Input>` (textbox) — all complete with ref forwarding.
* **Flexbox:** Implemented via `<uilistlayout>` injection with `justifyContent`, `alignItems`, and `gap` support. `flexDirection` maps to `FillDirection`.
* **Absolute positioning:** `position: "absolute"` with `top`/`right`/`bottom`/`left` translates to `Position` (UDim2) + `AnchorPoint` (Vector2), following CSS priority rules (left overrides right, top overrides bottom).
* **Measurements:** Strings like `"100%"` → Scale, `"100px"` or `100` → Offset, `"100vw"`/`"100vh"` → Scale, `"auto"` → undefined.

## Related Decisions

* **Animation System** — Addressed in **ADR-0002**. The declarative motion system using `@rbxts/ripple` replaces the imperative `TweenService`.

## References

* [@rbxts/react-roblox](https://github.com/littensy/rbxts-react) — React reconciler for Roblox
* [@rbxts/react-reflex](https://github.com/littensy/reflex) — Reflex bindings for React (hooks)
* [React Native — View](https://reactnative.dev/docs/view) — Design inspiration for wrapper API
