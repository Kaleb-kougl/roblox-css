# Advanced APIs & Internal Architecture

While `webStyle()` and the standard base primitives (`Box`, `Button`, `MotionBox`) cover 99% of use cases, `roblox-css` exports several lower-level APIs. These are intended for developers who need to build custom translation logic, override native layout behaviors, or construct their own proprietary motion systems.

## 1. Advanced Parsers

The core engine delegates string translation to modular parsers. You can import and use these independently of `webStyle()` if you need to manually convert CSS-like strings into Roblox data types.

- **`parseColor(value: string): ParsedColor`**
  Converts Hex (`#ff0000`), RGB (`rgb(255, 0, 0)`), HSL, and named colors (`red`) into a branded `ParsedColor` object (containing `Color3` and transparency).
- **`parseDimension(value: string | number): ParsedDimension`**
  Translates pixels (`"10px"`, `10`), percentages (`"50%"`), viewport units (`"50vw"`), and `calc()` equations into `UDim` values.
- **`parsePadding(value: string | number): PaddingValues`**
  Handles CSS shorthand (e.g., `"10px 20px"`) and maps it into Top, Right, Bottom, and Left `UDim` components.
- **`parseGradient(value: string): ParsedGradient`**
  Translates `linear-gradient(...)` syntax into Roblox `ColorSequence` and `NumberSequence` components.

## 2. Layout Hooks & Context

Roblox's native `<UISizeConstraint>` object does not accept percentage scales (e.g., `Scale` values in `UDim2`). To support CSS properties like `maxWidth: "50%"`, `roblox-css` implements a reactive context system.

- **`ParentSizeContext`**
  A React Context providing a `React.Binding<Vector2>`. Every `<Box>` provides this context, tracking its own absolute pixel size.
- **`usePercentageConstraints(style: CSSProperties)`**
  A hook that intercepts constraint properties (`minWidth`, `maxWidth`, etc.). If a percentage is detected, it subscribes to `ParentSizeContext`, dynamically calculates the hard pixel boundary using the parent's absolute size, and returns a fully constructed `<uisizeconstraint>` element.

## 3. Motion Internals

If you need to build a custom animated primitive beyond the provided `<MotionBox>` or `<MotionButton>`, you can hook directly into the variant resolution engine.

- **`useVariantResolver(animate, initial, variants, transition, customParser)`**
  This hook drives all motion components. It takes declarative variants, interpolates them using `@rbxts/ripple`, and returns separated `animatedProps` (which update every frame) and `staticProps` (which map once). 
- **`transitions`**
  An exported object containing predefined easing curves and transition defaults used natively by the middleware.

## 4. Inline Image Parsing

For highly customized rich text that requires inline image injection (since Roblox's native RichText lacks `<img src="...">` support without manual sprite mapping).

- **`parseInlineImages(text: string)`**
  Parses a string containing standard HTML `<img>` tags and splits it into `TextSegment` and `ImageSegment` objects, allowing you to manually construct inline UI grids.
- **`containsRichTextTags(text: string)`**
  A fast boolean check used internally to automatically enable the `RichText` property on TextLabels if tags are detected.
