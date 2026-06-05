# roblox-css Architecture

This document provides a technical deep-dive into the design and implementation of `roblox-css`.

## 1. Overview

`roblox-css` acts as a pure translation layer (middleware) between web-standard CSS properties and native Roblox Engine UI instances. Its primary philosophy is to separate declarative styling intent from the imperative, instance-heavy requirements of Roblox's UI layout system. By operating at the prop level rather than wrapping components heavily, it preserves full React compatibility while abstracting away `UDim2` calculations and constraint instantiations.

## 2. Parser Pipeline

The core translation flow starts with a user-provided `CSSProperties` object and flows through `webStyle()`, which delegates to specialized parsers, resulting in a single branded output.

```mermaid
flowchart TD
    A[CSSProperties Object] --> B[webStyle()]
    
    B --> C{Parsers}
    C -->|backgroundColor, color, borderColor| D[colorParser]
    C -->|width, height, padding, gap| E[dimensionParser]
    C -->|background: linear-gradient| F[gradientParser]
    
    D --> G[Color3, number]
    E --> H[UDim, UDim2, number]
    F --> I[UIGradient Config]
    
    G --> J[WebStyleResult]
    H --> J
    I --> J
    
    J --> K[<Box style={result} />]
    
    K --> L[Props Spread on Instance]
    K --> M[Constraint Children Injected]
```

## 3. Branded Type System

To prevent consumers from accidentally passing structural mock objects instead of properly parsed styles, `roblox-css` uses TypeScript **branded types** (also called opaque types or phantom types).

```typescript
export type WebStyleResult = {
    props: Record<string, unknown>;
    children: React.ReactNode[];
    _parsed: unique symbol; // The brand
};
```

**Why it exists:** It ensures that every style passed to a primitive component (like `<Box>`) has definitively passed through `webStyle()`. This prevents structural bypass where someone might manually construct `{ props: {}, children: [] }` which would break internal invariants or lack necessary constraints.

**How it works:** The `_parsed: unique symbol` is never actually instantiated at runtime. It exists purely in the TypeScript type system to force nominal typing on top of TypeScript's structural typing system. 

**Result:** Attempting to pass a raw object directly into the `style` prop results in a compile-time error due to the missing unique symbol, enforcing that developers always use `webStyle()`.

## 4. Constraint Injection

Roblox's UI engine requires specific modifiers to exist as *child instances* rather than properties of the parent instance. For example, rounded corners require a `UICorner` child, layout requires a `UIListLayout` child, and padding requires a `UIPadding` child.

`roblox-css` handles this seamlessly by returning these constraints as React elements in the `children` array of the `WebStyleResult`. 

Crucially, these injected children use **stable keys** (e.g., `"ws-uicorner"`, `"ws-uilistlayout"`). This guarantees that React can reconcile them across re-renders without unmounting and remounting the instances, preventing layout recalculation churn and maintaining high performance.

## 5. Component vs Middleware Boundary

The architecture maintains a strict boundary between the **middleware** (`webStyle()`) and the **components** (`Box`, `Text`, etc.). 

`webStyle()` is a pure function. It accepts CSS properties and returns a style configuration. It has absolutely no knowledge of the React component's children, its text content, or its internal state.

However, certain CSS properties require mutating the component's content:
- `textDecoration: "underline"` requires wrapping the text content in `<u>` tags.
- `textTransform: "uppercase"` requires calling `.upper()` on the text string.
- `wordBreak: "break-all"` requires injecting zero-width spaces into the string.

To solve this without breaking the pure function boundary, `webStyle()` injects **signal props** (like `_textDecoration`, `_textTransform`, `_wordBreak`) into the resulting properties. The React components intercept these internal props, process the text content accordingly, and strip the signal props before passing the final properties down to the native Roblox instance.

## 6. Percentage Sizing Architecture

Sizing in `roblox-css` utilizes a dual-path approach depending on the format of the constraint:

- **Pixel-based constraints** (`minWidth: "100px"`): Handled statically by `webStyle()`, which simply injects a `UISizeConstraint` child with the corresponding pixel values.
- **Percentage-based constraints** (`minWidth: "50%"`): Roblox's native `UISizeConstraint` *only* accepts absolute pixel sizes; it does not support scale components (percentages). To solve this, `roblox-css` provides the `usePercentageConstraints` hook combined with `ParentSizeContext`. 

When a percentage constraint is detected, the primitives utilize `ParentSizeContext` to track the absolute dimensions of the parent container. `usePercentageConstraints` then reactively computes the correct pixel equivalent on the fly and returns a dynamically updating `UISizeConstraint` element.

## 7. Motion Integration

The motion system is deeply integrated with the CSS parser via `useVariantResolver`.

When declaring motion variants, developers define them using standard CSS properties. `useVariantResolver` intercepts these variants and feeds them through `webStyle()`. 

The hook then separates the resulting properties into two categories:
1. **Animatable properties:** Continuous numerical values (`Color3`, `UDim2`, `UDim`, `number`).
2. **Static properties:** Non-interpolatable values (enums, booleans, strings).

For animatable properties, it creates `@rbxts/ripple` motion objects bound to React state, stepping them forward on every `RunService.Heartbeat`. Static values are applied instantly when a variant state changes. This enables powerful, Framer Motion-style declarative animations with full `roblox-css` syntax support.

## 8. Performance

Since `webStyle()` runs extremely often—frequently on every render of every component—performance and garbage collection pressure are critical.

`roblox-css` achieves high performance through:
- **Module-Scope Lookup Tables:** Static mappings like `FONT_WEIGHT_MAP`, `HORIZONTAL_MAP`, and `VERTICAL_MAP` are instantiated exactly once at the module scope, preventing allocation of new objects per-render. This ensures O(1) property resolution.
- **DeepReadonly:** Heavily cached objects and parse results are typed as `DeepReadonly` to prevent consumers from accidentally mutating shared parse results, ensuring cache integrity without requiring defensive cloning.
