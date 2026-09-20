# roblox-css

**Write CSS. Get Roblox UI.**

[![License: LGPL-3.0](https://img.shields.io/badge/License-LGPL--3.0-blue.svg)](https://www.gnu.org/licenses/lgpl-3.0)

A CSS-to-Roblox UI translation middleware for [roblox-ts](https://roblox-ts.com). Write familiar web-style `style` props and get native Roblox engine primitives (`UDim2`, `UICorner`, `UIListLayout`, etc.) automatically.

## What Problem Does This Solve?

Building UI in Roblox requires manually wiring up `UDim2` sizes, parenting constraint instances (`UICorner`, `UIPadding`, `UIListLayout`), and juggling imperative property sets. `roblox-css` lets you write this instead:

```tsx
import { Box, ScreenContainer, Text, webStyle } from "roblox-css";

const card = webStyle({
  width: "200px",
  height: "auto",
  padding: "16px",
  borderRadius: "12px",
  backgroundColor: "#1a1a2e",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

// In your component:
<ScreenContainer DisplayOrder={10}>
  <Box style={card}>
    <Text style={webStyle({ color: "white", fontSize: "18px" })}>
      Hello, Roblox!
    </Text>
  </Box>
</ScreenContainer>
```

The `webStyle()` function translates CSS properties into Roblox instance properties and child constraint elements. The wrapper components (`Box`, `Text`, `Button`, etc.) spread the result onto native Roblox instances.

## Installation

```bash
npm install roblox-css
```

### Peer Dependencies

**Required:**
- `@rbxts/react` (>=17.0.0)

**Optional** (only needed for motion primitives):
- `@rbxts/ripple` (>=0.8.0)
- `@rbxts/services`

### Rojo Configuration

Add `roblox-css` to your Rojo project file:

```json
{
  "ReplicatedStorage": {
    "roblox-css": {
      "$path": "node_modules/roblox-css/src"
    }
  }
}
```

## Primitives

| Component | HTML Equivalent | Roblox Instance |
|:---|:---|:---|
| `<Box>` | `<div>` | `<frame>` |
| `<Text>` | `<p>` | `<textlabel>` |
| `<InlineText>` | `<span>` | `<textlabel>` |
| `<Button>` | `<button>` | `<textbutton>` |
| `<Image>` | `<img>` | `<imagelabel>` |
| `<Input>` | `<input>` | `<textbox>` |
| `<ScrollBox>` | `<div style="overflow:auto">` | `<scrollingframe>` |
| `<ScreenContainer>` | document/root UI | `<screengui>` |

### On-Screen UI Containers

Roblox displays on-screen UI through `ScreenGui` containers. Put `ScreenContainer`
inside `StarterGui` for UI that should clone into each player's `PlayerGui`, or
render it directly into a player's `PlayerGui` from a client script when you need
runtime control. Descendant primitives such as `Box`, `Text`, `Button`, and
`ScrollBox` render as regular `GuiObject` children.

`ScreenContainer` defaults to `ScreenInsets={Enum.ScreenInsets.CoreUISafeInsets}`
so interactive UI avoids the Roblox top bar and device cutouts. It also defaults
to `ResetOnSpawn={false}` for React app roots and `DisplayOrder={0}` for
predictable layering. Override `Enabled`, `DisplayOrder`, `ResetOnSpawn`, or
`ScreenInsets` when building title screens, modal menus, fullscreen overlays, or
respawn-specific UI.

### HTML-Like Aliases

For developers who prefer a more familiar web API, we export capitalized HTML element aliases that map directly to our base primitives.

| Alias Component | Underlying Primitive | Default Styling |
|:---|:---|:---|
| `<Div>` | `<Box>` | None |
| `<Span>` | `<InlineText>` | None |
| `<P>` | `<Text>` | `fontSize: 16` |
| `<H1>` | `<Text>` | `fontSize: 32, fontWeight: "bold"` |
| `<H2>` | `<Text>` | `fontSize: 24, fontWeight: "bold"` |
| `<H3>` | `<Text>` | `fontSize: 18, fontWeight: "bold"` |

*Note: Due to TypeScript JSX constraints, you MUST use the capitalized versions (e.g. `<Div>` instead of `<div>`). Lowercase tags attempt to construct literal Roblox Instance classes that do not exist.*

### Motion Primitives

Declarative, variant-driven animation (inspired by Framer Motion):

| Component | Animates |
|:---|:---|
| `<MotionBox>` | `<frame>` |
| `<MotionText>` | `<textlabel>` |
| `<MotionButton>` | `<textbutton>` |
| `<MotionImage>` | `<imagelabel>` |
| `<MotionUIScale>` | `<uiscale>` |

```tsx
import { MotionBox, webStyle } from "roblox-css";

<MotionBox
  style={webStyle({ width: "100px", height: "100px" })}
  animate={isHovered ? "hover" : "idle"}
  variants={{
    idle: { backgroundColor: "#1a1a2e", width: "100px" },
    hover: { backgroundColor: "#e94560", width: "120px" },
  }}
  transition={new TweenInfo(0.3, Enum.EasingStyle.Quad)}
/>
```

Requires `@rbxts/ripple` peer dependency.

#### Interactivity (Hover States)

To create interactive hover effects, use the `useState` hook along with the `onMouseEnter` and `onMouseLeave` props. `roblox-css` automatically sets `AutoButtonColor: false` on buttons to disable the native Roblox tinting, giving you full control over hover styles.

```tsx
import React, { useState } from "@rbxts/react";
import { MotionButton, webStyle } from "roblox-css";

export function HoverButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <MotionButton
      style={webStyle({ 
        padding: "12px 24px",
        borderRadius: "8px",
        color: "white",
      })}
      Text="Hover Me!"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={isHovered ? "hover" : "idle"}
      variants={{
        idle: { backgroundColor: "#1a1a2e", width: "150px" },
        hover: { backgroundColor: "#e94560", width: "160px" },
      }}
      transition={new TweenInfo(0.2, Enum.EasingStyle.Quad)}
    />
  );
}
```

## Supported CSS Properties

### Layout
| CSS Property | Roblox Mapping |
|:---|:---|
| `width`, `height` | `Size` (UDim2) |
| `minWidth`, `maxWidth`, `minHeight`, `maxHeight` | `UISizeConstraint` |
| `display: "flex"` | `UIListLayout` |
| `display: "grid"` | `UIGridLayout` |
| `flexDirection` | `UIListLayout.FillDirection` |
| `justifyContent` | `UIListLayout.HorizontalAlignment` / `VerticalAlignment` |
| `alignItems` | `UIListLayout.HorizontalAlignment` / `VerticalAlignment` |
| `gap` | `UIListLayout.Padding` |
| `flexWrap` | `UIListLayout.Wraps` |
| `order` | `LayoutOrder` |

### Spacing
| CSS Property | Roblox Mapping |
|:---|:---|
| `padding` (shorthand) | `UIPadding` (all sides) |
| `paddingTop/Right/Bottom/Left` | `UIPadding` (individual) |

### Visual
| CSS Property | Roblox Mapping |
|:---|:---|
| `backgroundColor` | `BackgroundColor3` + `BackgroundTransparency` |
| `color` | `TextColor3` + `TextTransparency` |
| `opacity` | `BackgroundTransparency` / `ImageTransparency` |
| `borderRadius` | `UICorner` |
| `border` (shorthand) | `BorderSizePixel` + `BorderColor3` (style keywords like `solid` are optional) |
| `boxShadow` | 9-slice `ImageLabel` overlay |
| `background: "linear-gradient(...)"` | `UIGradient` |

### Typography
| CSS Property | Roblox Mapping |
|:---|:---|
| `fontSize` | `TextSize` |
| `fontWeight` | `FontFace.Weight` |
| `fontFamily` | `FontFace.Family` |
| `fontStyle` | `FontFace.Style` |
| `textAlign` | `TextXAlignment` |
| `textVerticalAlign` | `TextYAlignment` |
| `lineHeight` | `LineHeight` |
| `textDecoration` | Rich text `<u>` / `<s>` tags |
| `textTransform` | Component-level string transform |
| `wordBreak` | Zero-width space injection |
| `whiteSpace` | `TextWrapped` |
| `textOverflow` | `TextTruncate` |
| `richText` | `RichText` (auto-enabled if HTML tags detected) |

### Other
| CSS Property | Roblox Mapping |
|:---|:---|
| `overflow: "scroll"` | `ScrollingEnabled` |
| `objectFit` | `ScaleType` |
| `cursor` | Not supported in Roblox |
| `visibility` | `Visible` |
| `rotation` | `Rotation` |
| `zIndex` | `ZIndex` |
| `aspectRatio` | `UIAspectRatioConstraint` |
| `autoSize` / `width: "auto"` | `AutomaticSize` |

### Color Formats

`roblox-css` supports all standard CSS color formats:

- **Hex:** `#ff0000`, `#f00`, `#ff000080`
- **RGB:** `rgb(255, 0, 0)`, `rgba(255, 0, 0, 0.5)`
- **HSL:** `hsl(0, 100%, 50%)`, `hsla(0, 100%, 50%, 0.5)`
- **Named:** All 148 CSS named colors (`red`, `cornflowerblue`, `rebeccapurple`, etc.). The library also exports a `NAMED_COLORS` dictionary containing all of these mapped values.
- **Roblox Color3:** Pass `Color3` instances directly

### Dimension Formats

- **Pixels:** `"100px"` or `100` (bare number = pixels)
- **Percentage:** `"50%"` → `UDim` scale component
- **Viewport:** `"100vw"`, `"50vh"` → viewport-relative
- **Calc:** `"calc(100% - 20px)"`
- **Auto:** `"auto"` → `AutomaticSize`

## Type Safety

`roblox-css` uses TypeScript **branded types** to prevent bypassing the middleware at compile time:

```typescript
// ✅ This works — value produced by webStyle()
const style = webStyle({ width: "100px" });
<Box style={style} />

// ❌ This fails at compile time — raw object rejected
const fake = { props: { Size: UDim2.fromOffset(100, 0) }, children: [] };
<Box style={fake} />  // Type error: missing branded symbol
```

Four branded types enforce this: `WebStyleResult`, `ParsedDimension`, `ParsedColor`, `PaddingValues`.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architectural deep-dive.

```
CSSProperties → webStyle() → { props, children }
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   colorParser  dimParser  gradientParser
        │          │          │
        ▼          ▼          ▼
     Color3     UDim/UDim2  UIGradient
        │          │          │
        └──────────┼──────────┘
                   ▼
           WebStyleResult (branded)
                   │
                   ▼
          <Box style={result} />
                   │
           ┌───────┼───────┐
           ▼               ▼
     props spread    constraint children
     on <frame>      (UICorner, UIPadding, ...)
```

### Advanced Usage & Internal APIs

For developers extending `roblox-css`, see [docs/ADVANCED_APIS.md](docs/ADVANCED_APIS.md). It covers layout hooks (`ParentSizeContext`), advanced parsers, and motion internals.

## Running Tests

Tests run natively inside Roblox Studio using `@rbxts/jest`:

1. Build: `npx rbxtsc`
2. Open `test-runner.project.json` in Roblox Studio via Rojo
3. Run the Jest test plugin

**Test coverage:** 1,338 assertions across 12 spec files covering every parser, primitive, and motion component.

The Jest plugin will report a larger number — 1,966 assertions across 20 files.
Eight of the twenty spec sources under `src/tests/` are byte-identical copies of
eight others, kept at both `src/tests/<name>.spec.ts` and
`src/tests/<area>/<name>.spec.ts`. Both copies compile and both run, so a raw
count reports each of those assertions twice. 1,338 across 12 is what is
actually distinct.

Note also that the `tests/` directory at the repository root is **not** part of
the suite: `tsconfig.json` sets `include: ["src"]`, so nothing outside `src/`
compiles to `out/`, and `test-runner.project.json` mounts `out/tests`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

LGPL-3.0-only — see [LICENSE](LICENSE), [COPYING](COPYING), and [COPYING.LESSER](COPYING.LESSER).

You may use `roblox-css` in proprietary projects without releasing your project's source code. However, any modifications to `roblox-css` itself must be released under LGPL-3.0.
