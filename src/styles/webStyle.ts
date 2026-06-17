/**
 * webStyle.ts — Core CSS → Roblox translation engine.
 *
 * Takes a CSSProperties object and produces:
 *   1. Roblox instance properties (Size, BackgroundColor3, etc.)
 *   2. Child instances to inject (UICorner, UIPadding, UIListLayout, UIStroke)
 *
 * This is the heart of the middleware — the function that makes
 * <Box style={{ borderRadius: 10 }}> automatically inject a <uicorner>.
 *
 * Translation mapping:
 *   CSS Property        → Roblox Output
 *   ─────────────────────────────────────────────────────────
 *   width / height      → Size (UDim2)
 *   backgroundColor     → BackgroundColor3 + BackgroundTransparency
 *   opacity             → BackgroundTransparency (inverted: 1 - opacity)
 *   borderRadius        → <uicorner> child (CornerRadius)
 *   padding / padding*  → <uipadding> child (PaddingTop/Right/Bottom/Left)
 *   display: "flex"     → <uilistlayout> child (FillDirection, alignment, gap)
 *   border              → <uistroke> child (Thickness, Color)
 *   position: "absolute"→ Position (UDim2) + AnchorPoint (Vector2)
 */

import type { CSSProperties } from "./CSSTypes";
import { DeepReadonly } from "../types";
import { parseDimension, parsePadding } from "./dimensionParser";
import { parseColor } from "./colorParser";
import { parseGradient, isGradientString } from "./gradientParser";
import React from "@rbxts/react";

// Re-export for convenience
export type { CSSProperties };

/**
 * Branded WebStyleResult — the `_parsed` brand ensures only values produced by
 * webStyle() are assignable. A plain `{ props, children }` object will NOT
 * satisfy this type, catching accidental bypasses at compile time.
 *
 * - `props`:    Roblox instance properties to spread onto the host element
 * - `children`: UI constraint elements to inject (<uicorner>, <uipadding>, etc.)
 */
export type WebStyleResult = {
	readonly props: Record<string, unknown>;
	readonly children: React.Element[];
} & { readonly _parsed: unique symbol };

/** Helper to construct a branded WebStyleResult inside this module. */
function makeWebStyleResult(props: Record<string, unknown>, children: React.Element[]) {
	return { props, children } as unknown as WebStyleResult;
}

/**
 * Alignment lookup tables — hoisted to module scope to avoid
 * re-creation on every webStyle() call.
 *
 * JUSTIFY_MAP: CSS justifyContent → Roblox HorizontalAlignment
 *   "flex-start"  → Left
 *   "center"      → Center
 *   "flex-end"    → Right
 *
 * ALIGN_MAP: CSS alignItems → Roblox VerticalAlignment
 *   "flex-start"  → Top
 *   "center"      → Center
 *   "flex-end"    → Bottom
 */
const JUSTIFY_MAP = {
	"flex-start": Enum.HorizontalAlignment.Left,
	center: Enum.HorizontalAlignment.Center,
	"flex-end": Enum.HorizontalAlignment.Right,
} as Record<string, Enum.HorizontalAlignment>;

const ALIGN_MAP = {
	"flex-start": Enum.VerticalAlignment.Top,
	center: Enum.VerticalAlignment.Center,
	"flex-end": Enum.VerticalAlignment.Bottom,
} as Record<string, Enum.VerticalAlignment>;

const FONT_WEIGHT_MAP = {
	normal: Enum.FontWeight.Regular,
	bold: Enum.FontWeight.Bold,
	black: Enum.FontWeight.Heavy,
} as Record<string, Enum.FontWeight>;

const FONT_FAMILY_MAP = {
	BuilderSans: "rbxasset://fonts/families/BuilderSans.json",
	Montserrat: "rbxasset://fonts/families/Montserrat.json",
} as Record<string, string>;

const DEFAULT_FONT_FAMILY = "rbxasset://fonts/families/BuilderSans.json";

const TEXT_Y_ALIGN_MAP = {
	"top": Enum.TextYAlignment.Top,
	center: Enum.TextYAlignment.Center,
	"bottom": Enum.TextYAlignment.Bottom,
} as Record<string, Enum.TextYAlignment>;

const AUTO_SIZE_MAP = {
	none: Enum.AutomaticSize.None,
	x: Enum.AutomaticSize.X,
	y: Enum.AutomaticSize.Y,
	xy: Enum.AutomaticSize.XY,
} as Record<string, Enum.AutomaticSize>;

const SHADOW_SIZE_MAP = {
	sm: new UDim2(1, 10, 1, 10),
	md: new UDim2(1, 15, 1, 15),
	lg: new UDim2(1, 20, 1, 20),
	xl: new UDim2(1, 30, 1, 30),
	"2xl": new UDim2(1, 40, 1, 40),
} as Record<string, UDim2>;

const SHADOW_OFFSET_MAP = {
	sm: 2,
	md: 4,
	lg: 6,
	xl: 10,
	"2xl": 15,
} as Record<string, number>;

const SHADOW_SLICE_SCALE_MAP = {
	sm: 0.2,
	md: 0.3,
	lg: 0.4,
	xl: 0.6,
	"2xl": 0.8,
} as Record<string, number>;

const SHADOW_OPACITY_MAP = {
	sm: 0.7,
	md: 0.6,
	lg: 0.5,
	xl: 0.45,
	"2xl": 0.4,
} as Record<string, number>;

/**
 * Default shadow asset for boxShadow emulation.
 *
 * This is a 9-slice shadow sprite from the Roblox Creator Marketplace:
 *   https://create.roblox.com/store/asset/6015897843
 *
 * SliceCenter is hardcoded to Rect(47, 47, 450, 450) to match this specific
 * asset's padding region. If you change the asset, update SHADOW_SLICE_CENTER
 * accordingly.
 *
 * To use a custom shadow asset project-wide, set `SHADOW_ASSET_ID` and
 * `SHADOW_SLICE_CENTER` before any UI renders.
 */
export const SHADOW_ASSET_ID = "rbxassetid://6015897843";
export const SHADOW_SLICE_CENTER = new Rect(47, 47, 450, 450);

/**
 * Builds a <uilistlayout> element from CSS flex properties.
 *
 * CSS → Roblox mapping:
 *   flexDirection    → FillDirection (Horizontal | Vertical)
 *   justifyContent   → main-axis alignment (Horizontal for row, Vertical for column)
 *   alignItems       → cross-axis alignment (opposite axis from justify)
 *   gap              → Padding (UDim spacing between items)
 *
 * Always sets SortOrder = LayoutOrder so children render in insertion order.
 * Defaults to column (Vertical) when flexDirection is omitted.
 */
function buildListLayout(style: CSSProperties): React.Element {
	let flexDir = style.flexDirection;
	let fWrap = style.flexWrap;

	if (style.flexFlow !== undefined) {
		const flowParts = typeIs(style.flexFlow, "string") ? style.flexFlow.split(" ") : [];
		for (const part of flowParts) {
			if (part === "row" || part === "column") flexDir = flexDir ?? (part as "row" | "column");
			if (part === "wrap" || part === "nowrap") fWrap = fWrap ?? (part as "nowrap" | "wrap");
		}
	}

	const fillDirection = flexDir === "row" ? Enum.FillDirection.Horizontal : Enum.FillDirection.Vertical;

	const layoutProps: Record<string, unknown> = {
		FillDirection: fillDirection,
		SortOrder: Enum.SortOrder.LayoutOrder,
	};

	if (fWrap === "wrap") {
		layoutProps.Wraps = true;
	}

	const pContent = style.placeContent !== undefined && typeIs(style.placeContent, "string") ? style.placeContent.split(" ") : undefined;
	const resolvedJustifyContent = style.justifyContent ?? (pContent ? (pContent[1] ?? pContent[0]) : undefined);

	// justifyContent → main-axis alignment
	if (resolvedJustifyContent !== undefined) {
		if (resolvedJustifyContent === "space-between" || resolvedJustifyContent === "space-around") {
			const flexAlign =
				resolvedJustifyContent === "space-between"
					? Enum.UIFlexAlignment.SpaceBetween
					: Enum.UIFlexAlignment.SpaceAround;
			if (flexDir === "row") {
				layoutProps.HorizontalFlex = flexAlign;
			} else {
				layoutProps.VerticalFlex = flexAlign;
			}
		} else {
			if (flexDir === "row") {
				layoutProps.HorizontalAlignment = JUSTIFY_MAP[resolvedJustifyContent] ?? Enum.HorizontalAlignment.Left;
			} else {
				layoutProps.VerticalAlignment = ALIGN_MAP[resolvedJustifyContent] ?? Enum.VerticalAlignment.Top;
			}
		}
	}

	const pItems = style.placeItems !== undefined && typeIs(style.placeItems, "string") ? style.placeItems.split(" ") : undefined;
	const resolvedAlignItems = style.alignItems ?? (pItems ? pItems[0] : undefined);

	// alignItems → cross-axis alignment
	if (resolvedAlignItems !== undefined) {
		if (resolvedAlignItems === "stretch") {
			layoutProps.ItemLineAlignment = Enum.ItemLineAlignment.Stretch;
		} else {
			if (flexDir === "row") {
				layoutProps.VerticalAlignment = ALIGN_MAP[resolvedAlignItems] ?? Enum.VerticalAlignment.Top;
			} else {
				layoutProps.HorizontalAlignment = JUSTIFY_MAP[resolvedAlignItems] ?? Enum.HorizontalAlignment.Left;
			}
		}
	}

	// gap → Padding (space between items)
	if (style.gap !== undefined) {
		layoutProps.Padding = parseDimension(style.gap) ?? new UDim(0, 0);
	}

	layoutProps.key = "uilistlayout";
	return React.createElement("uilistlayout", layoutProps);
}

/**
 * Builds a <uigridlayout> element from CSS grid properties.
 *
 * CSS → Roblox mapping:
 *   gridTemplateColumns → CellSize.X
 *   gridTemplateRows    → CellSize.Y
 *   gap                 → CellPadding
 *   justifyContent      → HorizontalAlignment
 *   alignItems          → VerticalAlignment
 */
function buildGridLayout(style: CSSProperties): React.Element {
	const layoutProps: Record<string, unknown> = {
		SortOrder: Enum.SortOrder.LayoutOrder,
	};

	let flexDir = style.flexDirection;
	if (style.flexFlow !== undefined) {
		const flowParts = typeIs(style.flexFlow, "string") ? style.flexFlow.split(" ") : [];
		for (const part of flowParts) {
			if (part === "row" || part === "column") flexDir = flexDir ?? (part as "row" | "column");
		}
	}

	const fillDirection =
		flexDir === "column" ? Enum.FillDirection.Vertical : Enum.FillDirection.Horizontal; // default is row
	layoutProps.FillDirection = fillDirection;

	// gap, rowGap, columnGap -> CellPadding
	let gapX = new UDim(0, 0);
	let gapY = new UDim(0, 0);
	let hasGap = false;

	if (style.gap !== undefined) {
		const gapParts = typeIs(style.gap, "string") ? style.gap.split(" ") : [style.gap];
		gapX = parseDimension(gapParts[0]) ?? new UDim(0, 0);
		gapY = gapParts.size() > 1 ? parseDimension(gapParts[1]) ?? gapX : gapX;
		hasGap = true;
	}

	if (style.columnGap !== undefined) {
		gapX = parseDimension(style.columnGap) ?? new UDim(0, 0);
		hasGap = true;
	}

	if (style.rowGap !== undefined) {
		gapY = parseDimension(style.rowGap) ?? new UDim(0, 0);
		hasGap = true;
	}

	if (hasGap) {
		layoutProps.CellPadding = new UDim2(gapX, gapY);
	}

	// CellSize
	const cellX =
		style.gridTemplateColumns !== undefined
			? parseDimension(style.gridTemplateColumns) ?? new UDim(0, 100)
			: new UDim(0, 100);
	const cellY =
		style.gridTemplateRows !== undefined
			? parseDimension(style.gridTemplateRows) ?? new UDim(0, 100)
			: new UDim(0, 100);
	layoutProps.CellSize = new UDim2(cellX, cellY);

	const pContent = style.placeContent !== undefined && typeIs(style.placeContent, "string") ? style.placeContent.split(" ") : undefined;
	const resolvedJustifyContent = style.justifyContent ?? (pContent ? (pContent[1] ?? pContent[0]) : undefined);

	const pItems = style.placeItems !== undefined && typeIs(style.placeItems, "string") ? style.placeItems.split(" ") : undefined;
	const resolvedAlignItems = style.alignItems ?? (pItems ? pItems[0] : undefined);

	if (resolvedJustifyContent !== undefined) {
		layoutProps.HorizontalAlignment = JUSTIFY_MAP[resolvedJustifyContent] ?? Enum.HorizontalAlignment.Left;
	}
	if (resolvedAlignItems !== undefined) {
		layoutProps.VerticalAlignment = ALIGN_MAP[resolvedAlignItems] ?? Enum.VerticalAlignment.Top;
	}

	layoutProps.key = "uigridlayout";
	return React.createElement("uigridlayout", layoutProps);
}

/**
 * Builds a <uistroke> element from a CSS border shorthand string.
 *
 * Supported format: "<width> <style> <color>"
 *   - Width:  parsed via parseDimension (e.g. "1px", "2") → Thickness (offset only)
 *   - Style:  currently ignored (Roblox has no dashed/dotted stroke)
 *   - Color:  parsed via parseColor (e.g. "#000", "red") → Color (Color3)
 *
 * Examples:
 *   "1px solid #ff0000"  → Thickness: 1,  Color: Color3(1, 0, 0)
 *   "2px solid red"      → Thickness: 2,  Color: Color3(1, 0, 0)
 *   "3px"                → Thickness: 3,  Color: default (no color set)
 */
function buildStroke(border: string, isTextStroke = false): React.Element | undefined {
	let hasSpecifyingWord = false;
	const specifyingWords = new Set(["solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset"]);

	if (!isTextStroke) {
		for (const [word] of string.gmatch(border, "%a+")) {
			if (specifyingWords.has((word as string).lower())) {
				hasSpecifyingWord = true;
				break;
			}
		}

		if (!hasSpecifyingWord) {
			return undefined;
		}
	}

	const strokeProps: Record<string, unknown> = {};

	// Extract thickness: find first space-separated token (e.g., "1px", "2")
	const [thicknessStr, rest] = string.match(border, "^(%S+)%s*(.*)$");
	if (thicknessStr !== undefined) {
		const dim = parseDimension(thicknessStr as string);
		if (dim !== undefined) {
			strokeProps.Thickness = dim.Offset;
		}
	}

	// After thickness, optionally skip CSS border-style keyword (solid, dashed, etc.)
	// then treat everything remaining as the color string.
	if (rest !== undefined && (rest as string) !== "") {
		const remaining = rest as string;
		// Try to strip a leading style keyword (solid, dashed, dotted, double, groove, ridge, inset, outset, none)
		const [afterStyle] = string.match(remaining, "^%s*%a+%s+(.+)$");
		const colorStr = afterStyle !== undefined ? (afterStyle as string) : remaining;
		const parsed = parseColor(colorStr);
		strokeProps.Color = parsed.color;
	}

	strokeProps.ApplyStrokeMode = isTextStroke ? Enum.ApplyStrokeMode.Contextual : Enum.ApplyStrokeMode.Border;
	strokeProps.key = isTextStroke ? "uitextstroke" : "uistroke";
	return React.createElement("uistroke", strokeProps);
}

/**
 * Computes Roblox Position (UDim2) and AnchorPoint (Vector2) from CSS
 * absolute positioning properties.
 *
 * CSS → Roblox mapping:
 *   left:   "10px"  → Position.X = UDim(0, 10),   AnchorPoint.X = 0
 *   right:  "10px"  → Position.X = UDim(1, -10),  AnchorPoint.X = 1
 *   top:    "50%"   → Position.Y = UDim(0.5, 0),  AnchorPoint.Y = 0
 *   bottom: "20px"  → Position.Y = UDim(1, -20),  AnchorPoint.Y = 1
 *
 * Priority: left overrides right, top overrides bottom (matching CSS spec).
 * Returns props (not a React element) since positioning modifies the host
 * instance rather than injecting a child constraint.
 */
function buildAbsolutePosition(style: CSSProperties): { Position: UDim2; AnchorPoint: Vector2 } {
	let anchorX = 0;
	let anchorY = 0;
	let posX = new UDim(0, 0);
	let posY = new UDim(0, 0);

	// Horizontal: left takes priority over right
	if (style.left !== undefined) {
		posX = parseDimension(style.left) ?? new UDim(0, 0);
		anchorX = 0;
	} else if (style.right !== undefined) {
		const dim = parseDimension(style.right) ?? new UDim(0, 0);
		posX = new UDim(1 - dim.Scale, -dim.Offset);
		anchorX = 1;
	}

	// Vertical: top takes priority over bottom
	if (style.top !== undefined) {
		posY = parseDimension(style.top) ?? new UDim(0, 0);
		anchorY = 0;
	} else if (style.bottom !== undefined) {
		const dim = parseDimension(style.bottom) ?? new UDim(0, 0);
		posY = new UDim(1 - dim.Scale, -dim.Offset);
		anchorY = 1;
	}

	return {
		Position: new UDim2(posX, posY),
		AnchorPoint: new Vector2(anchorX, anchorY),
	};
}

/**
 * Computes Roblox AnchorPoint (Vector2) from CSS transform-origin.
 *
 * CSS → Roblox mapping:
 *   "center"        → Vector2(0.5, 0.5)
 *   "top left"      → Vector2(0, 0)
 *   "100% 50%"      → Vector2(1, 0.5)
 */
function parseTransformOrigin(origin: string): Vector2 {
	const parts = origin.split(" ").filter((p) => p !== "");
	let x = 0.5;
	let y = 0.5;

	const parseVal = (val: string): number => {
		if (val === "left") return 0;
		if (val === "right") return 1;
		if (val === "top") return 0;
		if (val === "bottom") return 1;
		if (val === "center") return 0.5;
		
		const [numStr] = string.match(val, "^(%-?%d+%.?%d*)%%?$");
		if (numStr !== undefined) {
			const num = tonumber(numStr as string);
			if (num !== undefined) {
				const [hasPercent] = string.match(val, "%%$");
				if (hasPercent !== undefined) {
					return num / 100;
				}
				return 0; // Fallback for pixels
			}
		}
		return 0.5;
	};

	if (parts.size() === 2) {
		const isYFirst = parts[0] === "top" || parts[0] === "bottom";
		const isXSecond = parts[1] === "left" || parts[1] === "right";
		if (isYFirst || isXSecond) {
			y = parseVal(parts[0]);
			x = parseVal(parts[1]);
		} else {
			x = parseVal(parts[0]);
			y = parseVal(parts[1]);
		}
	} else if (parts.size() === 1) {
		const part = parts[0];
		if (part === "top" || part === "bottom") {
			x = 0.5;
			y = parseVal(part);
		} else {
			x = parseVal(part);
			y = 0.5;
		}
	}

	return new Vector2(x, y);
}

/**
 * Checks if any constraint property (minWidth, maxWidth, minHeight, maxHeight)
 * contains a percentage value.
 */
function hasPercentageScale(style: CSSProperties): boolean {
	if (style.minWidth !== undefined && (parseDimension(style.minWidth)?.Scale ?? 0) > 0) return true;
	if (style.maxWidth !== undefined && (parseDimension(style.maxWidth)?.Scale ?? 0) > 0) return true;
	if (style.minHeight !== undefined && (parseDimension(style.minHeight)?.Scale ?? 0) > 0) return true;
	if (style.maxHeight !== undefined && (parseDimension(style.maxHeight)?.Scale ?? 0) > 0) return true;
	return false;
}

/**
 * Translates a CSSProperties object into Roblox-compatible props and child elements.
 *
 * This is the primary entry point for the CSS → Roblox translation layer.
 * Wrapper components (Box, Text, etc.) call this function with their `style` prop
 * and spread the resulting `props` onto the host instance while injecting `children`
 * as UI constraint siblings.
 *
 * @param style - A CSSProperties object from the component's style prop.
 * @returns A branded WebStyleResult containing:
 *   - `props`:    Record of Roblox instance properties (Size, BackgroundColor3, Position, etc.)
 *   - `children`: Array of React elements for UI constraints (<uicorner>, <uipadding>, etc.)
 *
 * @example
 *   const result = webStyle({ width: "50%", backgroundColor: "#333", borderRadius: 8 });
 *   // result.props   → { Size: UDim2(...), BackgroundColor3: Color3(...) }
 *   // result.children → [ <uicorner CornerRadius={UDim(0, 8)} /> ]
 */
export function webStyle(style: CSSProperties, hostText?: string): DeepReadonly<WebStyleResult> {
	const props: Record<string, unknown> = {};
	const children: React.Element[] = [];
	// Implementation order:
	// 1. width / height → Size (UDim2)
	if (style.width !== undefined || style.height !== undefined) {
		const widthIsAuto = style.width === "auto";
		const heightIsAuto = style.height === "auto";

		props.Size = new UDim2(
			widthIsAuto ? new UDim(1, 0) : (parseDimension(style.width ?? "100%") ?? new UDim(1, 0)),
			heightIsAuto ? new UDim(1, 0) : (parseDimension(style.height ?? "100%") ?? new UDim(1, 0)),
		);

		// Set AutomaticSize for auto dimensions (only if autoSize wasn't explicitly set)
		if ((widthIsAuto || heightIsAuto) && style.autoSize === undefined) {
			if (widthIsAuto && heightIsAuto) {
				props.AutomaticSize = Enum.AutomaticSize.XY;
			} else if (widthIsAuto) {
				props.AutomaticSize = Enum.AutomaticSize.X;
			} else {
				props.AutomaticSize = Enum.AutomaticSize.Y;
			}
		}
	}
	// 2. backgroundColor → BackgroundColor3 + BackgroundTransparency
	if (style.backgroundColor !== undefined) {
		const parsed = parseColor(style.backgroundColor);
		props.BackgroundColor3 = parsed.color;
		props.BackgroundTransparency = parsed.transparency;
	}

	// 2.5. background: "linear-gradient(...)" → inject <uigradient>
	if (style.background !== undefined && isGradientString(style.background)) {
		// Extract pixel dimensions from style for corner keyword resolution
		let elemWidth: number | undefined;
		let elemHeight: number | undefined;
		if (style.width !== undefined && !typeIs(style.width, "string")) {
			elemWidth = style.width;
		} else if (typeIs(style.width, "string")) {
			const wDim = parseDimension(style.width);
			if (wDim !== undefined && wDim.Scale === 0) elemWidth = wDim.Offset;
		}
		if (style.height !== undefined && !typeIs(style.height, "string")) {
			elemHeight = style.height;
		} else if (typeIs(style.height, "string")) {
			const hDim = parseDimension(style.height);
			if (hDim !== undefined && hDim.Scale === 0) elemHeight = hDim.Offset;
		}
		const gradient = parseGradient(style.background, elemWidth, elemHeight);
		if (gradient) {
			// UIGradient multiplies with BackgroundColor3, so default to white
			// (the multiplicative identity) for CSS parity unless the user
			// explicitly set backgroundColor.
			if (style.backgroundColor === undefined) {
				props.BackgroundColor3 = new Color3(1, 1, 1);
			}
			// CSS gradients are opaque by default — per-pixel alpha from rgba()
			// colors is already handled by the UIGradient's Transparency sequence.
			props.BackgroundTransparency = 0;
			const gradientProps: Record<string, unknown> = {
				key: "uigradient",
				Color: gradient.colorSequence,
				Rotation: gradient.rotation,
			};
			if (gradient.transparencySequence !== undefined) {
				gradientProps.Transparency = gradient.transparencySequence;
			}
			children.push(React.createElement("uigradient", gradientProps));
		}
	}

	const hasGradient = style.background !== undefined && isGradientString(style.background);

	// 3. opacity → BackgroundTransparency (INVERTED)
	// Combine with existing background transparency
	if (style.opacity !== undefined && !hasGradient) {
		if (style.backgroundColor === undefined) {
			// CSS default background-color is 'transparent'. If opacity is applied without 
			// an explicit background color, the background should remain fully transparent.
			props.BackgroundTransparency = 1;
		} else {
			const currentBgTrans = (props.BackgroundTransparency as number | undefined) ?? 0;
			props.BackgroundTransparency = 1 - ((1 - currentBgTrans) * style.opacity);
		}
	}
	// 4. borderRadius → inject <uicorner>
	if (style.borderRadius !== undefined) {
		const firstRadius = typeIs(style.borderRadius, "string") 
			? style.borderRadius.split(" ")[0] 
			: style.borderRadius;
		const radius = parseDimension(firstRadius);
		children.push(React.createElement("uicorner", { key: "uicorner", CornerRadius: radius }));
	}
	// 5. padding → inject <uipadding>
	if (
		style.padding !== undefined ||
		style.paddingTop !== undefined ||
		style.paddingRight !== undefined ||
		style.paddingBottom !== undefined ||
		style.paddingLeft !== undefined ||
		style.paddingInline !== undefined ||
		style.paddingBlock !== undefined
	) {
		// Start from shorthand, then let individual sides override
		const base = style.padding !== undefined ? parsePadding(style.padding) : parsePadding(0);

		// Logical properties override base padding
		const padInline = style.paddingInline !== undefined ? parsePadding(style.paddingInline) : undefined;
		const padBlock = style.paddingBlock !== undefined ? parsePadding(style.paddingBlock) : undefined;

		const baseTop = padBlock?.top ?? base.top;
		const baseBottom = padBlock?.bottom ?? base.bottom;
		const baseLeft = padInline?.left ?? base.left;
		const baseRight = padInline?.right ?? base.right;

		children.push(
			React.createElement("uipadding", {
				key: "uipadding",
				PaddingTop: style.paddingTop !== undefined ? parseDimension(style.paddingTop) : baseTop,
				PaddingRight: style.paddingRight !== undefined ? parseDimension(style.paddingRight) : baseRight,
				PaddingBottom: style.paddingBottom !== undefined ? parseDimension(style.paddingBottom) : baseBottom,
				PaddingLeft: style.paddingLeft !== undefined ? parseDimension(style.paddingLeft) : baseLeft,
			}),
		);
	}
	// 6. display: "flex" | "grid" | "none" → inject <uilistlayout> / <uigridlayout> or set Visible
	if (style.display === "flex") {
		children.push(buildListLayout(style));
	} else if (style.display === "grid") {
		children.push(buildGridLayout(style));
	} else if (style.display === "none") {
		props.Visible = false;
	}
	// visibility → Visible (convenience alias, coexists with display: none)
	if (style.visibility !== undefined) {
		props.Visible = style.visibility !== "hidden";
	}
	// 7. border / outline → inject <uistroke>
	const activeBorder = style.border ?? style.outline;
	if (activeBorder !== undefined) {
		const stroke = buildStroke(activeBorder);
		if (stroke !== undefined) {
			children.push(stroke);
		}
	}
	// textStroke → inject <uistroke> with Contextual mode
	if (style.textStroke !== undefined) {
		const stroke = buildStroke(style.textStroke, true);
		if (stroke !== undefined) {
			children.push(stroke);
		}
	}
	
	// backgroundImage → inject <imagelabel> underlay
	if (style.backgroundImage !== undefined) {
		const [url] = string.match(style.backgroundImage, "url%([\"']?(.-)[\"']?%)");
		if (url !== undefined) {
			const cleanUrl = url as string;
			let bgScale: Enum.ScaleType = Enum.ScaleType.Stretch; // default
			if (style.backgroundSize === "cover") bgScale = Enum.ScaleType.Crop;
			else if (style.backgroundSize === "contain") bgScale = Enum.ScaleType.Fit;

			children.push(
				React.createElement("imagelabel", {
					key: "uibackgroundimage",
					Image: cleanUrl,
					ZIndex: -1,
					Size: UDim2.fromScale(1, 1),
					AnchorPoint: new Vector2(0.5, 0.5),
					Position: UDim2.fromScale(0.5, 0.5),
					BackgroundTransparency: 1,
					ScaleType: bgScale,
				}),
			);
		}
	}
	// 8. aspectRatio → inject <uiaspectratioconstraint>
	if (style.aspectRatio !== undefined) {
		children.push(
			React.createElement("uiaspectratioconstraint", {
				key: "uiaspectratioconstraint",
				AspectRatio: style.aspectRatio,
			}),
		);
	}
	// 9. position: "absolute" → Position + AnchorPoint
	if (style.position === "absolute") {
		const abs = buildAbsolutePosition(style);
		props.Position = abs.Position;
		props.AnchorPoint = abs.AnchorPoint;
	}
	// transformOrigin → overrides AnchorPoint
	if (style.transformOrigin !== undefined) {
		props.AnchorPoint = parseTransformOrigin(style.transformOrigin);
	}
	// 10. zIndex → ZIndex
	if (style.zIndex !== undefined) {
		props.ZIndex = style.zIndex;
	}
	if (style.order !== undefined || style.layoutOrder !== undefined) {
		props.LayoutOrder = style.order ?? style.layoutOrder;
	}
	if (style.rotation !== undefined) {
		props.Rotation = style.rotation;
	}
	// autoSize (standalone) — explicit autoSize takes precedence over width/height "auto"
	if (style.autoSize !== undefined) {
		props.AutomaticSize = AUTO_SIZE_MAP[style.autoSize] ?? Enum.AutomaticSize.None;
	}

	// 11. Size Constraints → inject <uisizeconstraint>
	if (
		!hasPercentageScale(style) &&
		(style.minWidth !== undefined ||
			style.maxWidth !== undefined ||
			style.minHeight !== undefined ||
			style.maxHeight !== undefined)
	) {
		const minW = style.minWidth !== undefined ? (parseDimension(style.minWidth) ?? new UDim(0, 0)).Offset : 0;
		const minH = style.minHeight !== undefined ? (parseDimension(style.minHeight) ?? new UDim(0, 0)).Offset : 0;
		const maxW =
			style.maxWidth !== undefined ? (parseDimension(style.maxWidth) ?? new UDim(0, 0)).Offset : math.huge;
		const maxH =
			style.maxHeight !== undefined ? (parseDimension(style.maxHeight) ?? new UDim(0, 0)).Offset : math.huge;

		children.push(
			React.createElement("uisizeconstraint", {
				key: "uisizeconstraint",
				MinSize: new Vector2(minW, minH),
				MaxSize: new Vector2(maxW, maxH),
			}),
		);
	}

	// 12. Typography (color, fontSize, textAlign, whiteSpace)
	if (style.color !== undefined) {
		const parsedColor = parseColor(style.color);
		props.TextColor3 = parsedColor.color;
		if (parsedColor.transparent) {
			props.TextTransparency = 1;
		}
	}
	if (style.fontSize !== undefined) {
		props.TextSize = style.fontSize;
	}
	if (style.textAlign !== undefined) {
		if (style.textAlign === "left") props.TextXAlignment = Enum.TextXAlignment.Left;
		else if (style.textAlign === "center") props.TextXAlignment = Enum.TextXAlignment.Center;
		else if (style.textAlign === "right") props.TextXAlignment = Enum.TextXAlignment.Right;
	}
	if (style.textVerticalAlign !== undefined) {
		if (style.textVerticalAlign === "top") props.TextYAlignment = Enum.TextYAlignment.Top;
		else if (style.textVerticalAlign === "center") props.TextYAlignment = Enum.TextYAlignment.Center;
		else if (style.textVerticalAlign === "bottom") props.TextYAlignment = Enum.TextYAlignment.Bottom;
	}
	if (style.whiteSpace !== undefined) {
		if (style.whiteSpace === "normal" || style.whiteSpace === "pre-wrap" || style.whiteSpace === "pre-line") {
			props.TextWrapped = true;
		} else if (style.whiteSpace === "nowrap") {
			props.TextWrapped = false;
		}
	}
	if (style.wordBreak !== undefined) {
		if (style.wordBreak === "normal" || style.wordBreak === "break-word" || style.wordBreak === "break-all") {
			props.TextWrapped = true;
		} else if (style.wordBreak === "keep-all") {
			props.TextWrapped = false;
		}
	}
	if (style.lineHeight !== undefined) {
		props.LineHeight = style.lineHeight;
	}
	if (style.textOverflow === "ellipsis") {
		props.TextTruncate = Enum.TextTruncate.AtEnd;
	}
	if (style.richText === true) {
		props.RichText = true;
	}
	if (style.fontFamily !== undefined || style.fontWeight !== undefined || style.fontStyle !== undefined) {
		const familyStr = style.fontFamily ?? "BuilderSans";
		const familyUri = FONT_FAMILY_MAP[familyStr] ?? DEFAULT_FONT_FAMILY;

		const weightStr = style.fontWeight !== undefined ? tostring(style.fontWeight) : "normal";
		const weightEnum = FONT_WEIGHT_MAP[weightStr] ?? Enum.FontWeight.Regular;

		const fontStyleEnum = style.fontStyle === "italic" ? Enum.FontStyle.Italic : Enum.FontStyle.Normal;
		props.FontFace = new Font(familyUri, weightEnum, fontStyleEnum);
	}
	if (style.textDecoration !== undefined && style.textDecoration !== "none") {
		props.RichText = true;
		props._textDecoration = style.textDecoration;
	}
	if (style.textTransform !== undefined && style.textTransform !== "none") {
		props._textTransform = style.textTransform;
	}

	// 13. overflow → ClipsDescendants
	if (style.overflow !== undefined) {
		if (style.overflow === "hidden") {
			props.ClipsDescendants = true;
		} else if (style.overflow === "visible") {
			props.ClipsDescendants = false;
		}
	}

	if (style.objectFit !== undefined) {
		if (style.objectFit === "cover") props.ScaleType = Enum.ScaleType.Crop;
		else if (style.objectFit === "contain") props.ScaleType = Enum.ScaleType.Fit;
		else if (style.objectFit === "fill") props.ScaleType = Enum.ScaleType.Stretch;
	}

	// 14. pointerEvents → Interactable / Active
	if (style.pointerEvents === "none") {
		props.Interactable = false;
		props.Active = false;
	}
	// userSelect → TextSelectable
	if (style.userSelect !== undefined) {
		if (style.userSelect === "text" || style.userSelect === "auto") {
			props.TextSelectable = true;
		} else if (style.userSelect === "none") {
			props.TextSelectable = false;
		}
	}

	// 15. boxShadow → inject <imagelabel>
	if (style.boxShadow !== undefined && style.boxShadow !== "none") {
		const shadowSize = SHADOW_SIZE_MAP[style.boxShadow] ?? new UDim2(1, 20, 1, 20);
		const shadowTransparency = SHADOW_OPACITY_MAP[style.boxShadow] ?? 0.5;
		const shadowOffset = SHADOW_OFFSET_MAP[style.boxShadow] ?? 6;
		const sliceScale = SHADOW_SLICE_SCALE_MAP[style.boxShadow] ?? 0.4;

		children.push(
			React.createElement("imagelabel", {
				key: "box-shadow",
				Image: SHADOW_ASSET_ID,
				ScaleType: Enum.ScaleType.Slice,
				SliceCenter: SHADOW_SLICE_CENTER,
				SliceScale: sliceScale,
				BackgroundTransparency: 1,
				ImageColor3: new Color3(0, 0, 0),
				ImageTransparency: shadowTransparency,
				ZIndex: -1,
				AnchorPoint: new Vector2(0.5, 0.5),
				Position: new UDim2(0.5, 0, 0.5, shadowOffset),
				Size: shadowSize,
			}),
		);
	}

	// 16. flexGrow / flexShrink / alignSelf → inject <uiflexitem>
	let grow = style.flexGrow ?? 0;
	let shrink = style.flexShrink ?? 0;
	
	if (style.flex !== undefined) {
		if (style.flex === "auto") {
			grow = 1;
			shrink = 1;
		} else if (style.flex === "none") {
			grow = 0;
			shrink = 0;
		} else if (typeIs(style.flex, "number")) {
			grow = style.flex;
			shrink = style.flex;
		} else if (typeIs(style.flex, "string")) {
			const parsed = tonumber(style.flex);
			if (parsed !== undefined) {
				grow = parsed;
				shrink = parsed;
			}
		}
	}

	const hasFlexItem = grow > 0 || shrink > 0 || (style.alignSelf !== undefined && style.alignSelf !== "auto");

	if (hasFlexItem) {
		if (style.display === "grid") {
			warn("[webStyle] flexGrow/flexShrink/alignSelf have no effect inside display: 'grid'. UIFlexItem only works with UIListLayout (display: 'flex').");
		}
		const flexProps: Record<string, unknown> = {
			key: "uiflexitem",
		};
		if (grow > 0 || shrink > 0) {
			flexProps.FlexMode = Enum.UIFlexMode.Custom;
			flexProps.GrowRatio = grow;
			flexProps.ShrinkRatio = shrink;
		}
		if (style.alignSelf !== undefined && style.alignSelf !== "auto") {
			if (style.alignSelf === "flex-start") {
				flexProps.ItemLineAlignment = Enum.ItemLineAlignment.Start;
			} else if (style.alignSelf === "flex-end") {
				flexProps.ItemLineAlignment = Enum.ItemLineAlignment.End;
			} else if (style.alignSelf === "center") {
				flexProps.ItemLineAlignment = Enum.ItemLineAlignment.Center;
			} else if (style.alignSelf === "stretch") {
				flexProps.ItemLineAlignment = Enum.ItemLineAlignment.Stretch;
			}
		}
		children.push(React.createElement("uiflexitem", flexProps));
	}

	// 17. textShadow → inject duplicate <textlabel> with black <uigradient>
	if (style.textShadow !== undefined && hostText !== undefined) {
		const parts = style.textShadow.split(" ").filter((p) => p !== "");
		const dimParts: string[] = [];
		const colorParts: string[] = [];
		for (const p of parts) {
			if (p.match("^%-?%d")[0]) {
				dimParts.push(p);
			} else {
				colorParts.push(p);
			}
		}

		const xStr = dimParts[0] ?? "0";
		const yStr = dimParts[1] ?? xStr;
		const xOffset = parseDimension(xStr)?.Offset ?? 0;
		const yOffset = parseDimension(yStr)?.Offset ?? 0;

		const colorStr = colorParts.join(" ");
		const shadowColor = colorStr !== "" ? parseColor(colorStr) : parseColor("rgba(0,0,0,0.5)");

		children.push(
			React.createElement(
				"textlabel",
				{
					key: "textShadow",
					Text: hostText,
					Size: new UDim2(1, 0, 1, 0),
					Position: new UDim2(0, xOffset, 0, yOffset),
					BackgroundTransparency: 1,
					TextTransparency: shadowColor.transparency,
					TextColor3: shadowColor.color,
					ZIndex: -1,
					TextSize: props.TextSize,
					FontFace: props.FontFace,
					TextXAlignment: props.TextXAlignment,
					TextYAlignment: props.TextYAlignment,
					TextWrapped: props.TextWrapped,
					LineHeight: props.LineHeight,
					TextTruncate: props.TextTruncate,
					RichText: props.RichText,
				},
				React.createElement("uigradient", {
					key: "shadowGradient",
					Color: new ColorSequence(new Color3(0, 0, 0)),
				})
			)
		);
	}

	return makeWebStyleResult(props, children);
}
