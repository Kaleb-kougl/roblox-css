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

const SORT_ORDER_MAP = {
	"layout-order": Enum.SortOrder.LayoutOrder,
	name: Enum.SortOrder.Name,
} as Record<string, Enum.SortOrder>;

const FLEX_ALIGNMENT_MAP = {
	"space-around": Enum.UIFlexAlignment.SpaceAround,
	"space-between": Enum.UIFlexAlignment.SpaceBetween,
	"space-evenly": Enum.UIFlexAlignment.SpaceEvenly,
} as Record<string, Enum.UIFlexAlignment>;

const START_CORNER_MAP = {
	"top-left": Enum.StartCorner.TopLeft,
	"top-right": Enum.StartCorner.TopRight,
	"bottom-left": Enum.StartCorner.BottomLeft,
	"bottom-right": Enum.StartCorner.BottomRight,
} as Record<string, Enum.StartCorner>;

const TABLE_MAJOR_AXIS_MAP = {
	"row-major": Enum.TableMajorAxis.RowMajor,
	"column-major": Enum.TableMajorAxis.ColumnMajor,
} as Record<string, Enum.TableMajorAxis>;

const EASING_STYLE_MAP = {
	linear: Enum.EasingStyle.Linear,
	sine: Enum.EasingStyle.Sine,
	back: Enum.EasingStyle.Back,
	quad: Enum.EasingStyle.Quad,
	quart: Enum.EasingStyle.Quart,
	quint: Enum.EasingStyle.Quint,
	bounce: Enum.EasingStyle.Bounce,
	elastic: Enum.EasingStyle.Elastic,
	exponential: Enum.EasingStyle.Exponential,
	circular: Enum.EasingStyle.Circular,
	cubic: Enum.EasingStyle.Cubic,
} as Record<string, Enum.EasingStyle>;

const EASING_DIRECTION_MAP = {
	in: Enum.EasingDirection.In,
	out: Enum.EasingDirection.Out,
	"in-out": Enum.EasingDirection.InOut,
} as Record<string, Enum.EasingDirection>;

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

const SCROLL_BAR_INSET_MAP = {
	none: Enum.ScrollBarInset.None,
	scrollbar: Enum.ScrollBarInset.ScrollBar,
	"scroll-bar": Enum.ScrollBarInset.ScrollBar,
	always: Enum.ScrollBarInset.Always,
} as Record<string, Enum.ScrollBarInset>;

const ELASTIC_BEHAVIOR_MAP = {
	"when-scrollable": Enum.ElasticBehavior.WhenScrollable,
	always: Enum.ElasticBehavior.Always,
	never: Enum.ElasticBehavior.Never,
} as Record<string, Enum.ElasticBehavior>;

const VERTICAL_SCROLL_BAR_POSITION_MAP = {
	left: Enum.VerticalScrollBarPosition.Left,
	right: Enum.VerticalScrollBarPosition.Right,
} as Record<string, Enum.VerticalScrollBarPosition>;

const UI_DRAG_STYLE_MAP = {
	"translate-plane": Enum.UIDragDetectorDragStyle.TranslatePlane,
	"translate-line": Enum.UIDragDetectorDragStyle.TranslateLine,
	rotate: Enum.UIDragDetectorDragStyle.Rotate,
	scriptable: Enum.UIDragDetectorDragStyle.Scriptable,
} as Record<string, Enum.UIDragDetectorDragStyle>;

const UI_DRAG_RESPONSE_STYLE_MAP = {
	offset: Enum.UIDragDetectorResponseStyle.Offset,
	scale: Enum.UIDragDetectorResponseStyle.Scale,
	"custom-offset": Enum.UIDragDetectorResponseStyle.CustomOffset,
	"custom-scale": Enum.UIDragDetectorResponseStyle.CustomScale,
} as Record<string, Enum.UIDragDetectorResponseStyle>;

const UI_DRAG_BOUNDING_BEHAVIOR_MAP = {
	automatic: Enum.UIDragDetectorBoundingBehavior.Automatic,
	"entire-object": Enum.UIDragDetectorBoundingBehavior.EntireObject,
	"hit-point": Enum.UIDragDetectorBoundingBehavior.HitPoint,
} as Record<string, Enum.UIDragDetectorBoundingBehavior>;

const UI_DRAG_SPEED_AXIS_MAPPING_MAP = {
	xy: Enum.UIDragSpeedAxisMapping.XY,
	xx: Enum.UIDragSpeedAxisMapping.XX,
	yy: Enum.UIDragSpeedAxisMapping.YY,
} as Record<string, Enum.UIDragSpeedAxisMapping>;

const DRAG_STYLE_MAP = {
	"translate-line": Enum.DragDetectorDragStyle.TranslateLine,
	"translate-plane": Enum.DragDetectorDragStyle.TranslatePlane,
	"translate-plane-or-line": Enum.DragDetectorDragStyle.TranslatePlaneOrLine,
	"translate-line-or-plane": Enum.DragDetectorDragStyle.TranslateLineOrPlane,
	"translate-view-plane": Enum.DragDetectorDragStyle.TranslateViewPlane,
	"rotate-axis": Enum.DragDetectorDragStyle.RotateAxis,
	"rotate-trackball": Enum.DragDetectorDragStyle.RotateTrackball,
	"best-for-device": Enum.DragDetectorDragStyle.BestForDevice,
	scriptable: Enum.DragDetectorDragStyle.Scriptable,
} as Record<string, Enum.DragDetectorDragStyle>;

const DRAG_RESPONSE_STYLE_MAP = {
	geometric: Enum.DragDetectorResponseStyle.Geometric,
	physical: Enum.DragDetectorResponseStyle.Physical,
	custom: Enum.DragDetectorResponseStyle.Custom,
} as Record<string, Enum.DragDetectorResponseStyle>;

const DRAG_PERMISSION_POLICY_MAP = {
	nobody: Enum.DragDetectorPermissionPolicy.Nobody,
	everybody: Enum.DragDetectorPermissionPolicy.Everybody,
	scriptable: Enum.DragDetectorPermissionPolicy.Scriptable,
} as Record<string, Enum.DragDetectorPermissionPolicy>;

const PROXIMITY_PROMPT_EXCLUSIVITY_MAP = {
	"one-per-button": Enum.ProximityPromptExclusivity.OnePerButton,
	"one-globally": Enum.ProximityPromptExclusivity.OneGlobally,
	"always-show": Enum.ProximityPromptExclusivity.AlwaysShow,
} as Record<string, Enum.ProximityPromptExclusivity>;

const STROKE_SIZING_MODE_MAP = {
	fixed: Enum.StrokeSizingMode.FixedSize,
	scaled: Enum.StrokeSizingMode.ScaledSize,
} as Record<string, Enum.StrokeSizingMode>;

const BORDER_STROKE_POSITION_MAP = {
	inner: Enum.BorderStrokePosition.Inner,
	center: Enum.BorderStrokePosition.Center,
	outer: Enum.BorderStrokePosition.Outer,
} as Record<string, Enum.BorderStrokePosition>;

const LINE_JOIN_MODE_MAP = {
	round: Enum.LineJoinMode.Round,
	bevel: Enum.LineJoinMode.Bevel,
	miter: Enum.LineJoinMode.Miter,
} as Record<string, Enum.LineJoinMode>;

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

type StrokeOptions = {
	readonly isTextStroke?: boolean;
	readonly borderOffset?: string | number;
	readonly borderStrokePosition?: string;
	readonly lineJoinMode?: string;
	readonly strokeSizingMode?: string;
	readonly strokeTransparency?: number;
	readonly strokeZIndex?: number;
	readonly strokeGradient?: string;
	readonly strokeGradientOffset?: string | Vector2;
	readonly strokeGradientRotation?: number;
};

function splitOutsideParens(input: string, separator = " "): string[] {
	const parts: string[] = [];
	let current = "";
	let parenLevel = 0;

	for (let i = 1; i <= input.size(); i++) {
		const char = input.sub(i, i);
		if (char === "(") parenLevel++;
		else if (char === ")") parenLevel--;

		const isSeparator = separator === " " ? (char === " " || char === "\t") : char === separator;
		if (isSeparator && parenLevel === 0) {
			if (current !== "") {
				parts.push(current);
				current = "";
			}
			continue;
		}

		current += char;
	}

	if (current !== "") {
		parts.push(current);
	}

	return parts;
}

function parseVector2(value: string | Vector2 | undefined): Vector2 | undefined {
	if (value === undefined) return undefined;
	if (typeIs(value, "Vector2")) return value;

	const parts = splitOutsideParens(value).filter((part) => part !== "");
	const x = tonumber(parts[0]);
	const y = tonumber(parts[1] ?? parts[0]);
	if (x === undefined || y === undefined) {
		return undefined;
	}

	return new Vector2(x, y);
}

function parseVector3(value: string | Vector3 | undefined): Vector3 | undefined {
	if (value === undefined) return undefined;
	if (typeIs(value, "Vector3")) return value;

	const parts = splitOutsideParens(value).filter((part) => part !== "");
	const x = tonumber(parts[0]);
	const y = tonumber(parts[1]);
	const z = tonumber(parts[2]);
	if (x === undefined || y === undefined || z === undefined) {
		return undefined;
	}

	return new Vector3(x, y, z);
}

function parseUDim2Pair(value: string | undefined, fallbackX = new UDim(0, 0), fallbackY = fallbackX): UDim2 {
	if (value === undefined || value === "") {
		return new UDim2(fallbackX, fallbackY);
	}

	const parts = splitOutsideParens(value).filter((part) => part !== "");
	const x = parseDimension(parts[0]) ?? fallbackX;
	const y = parseDimension(parts[1] ?? parts[0]) ?? fallbackY;
	return new UDim2(x, y);
}

function parseUDim2Value(value: string | UDim2 | undefined): UDim2 | undefined {
	if (value === undefined) return undefined;
	if (typeIs(value, "UDim2")) return value;
	return parseUDim2Pair(value);
}

function parseKeyCode(value: string | Enum.KeyCode | undefined): Enum.KeyCode | undefined {
	if (value === undefined) return undefined;
	if (!typeIs(value, "string")) return value;

	const keyCodes = Enum.KeyCode as unknown as Record<string, Enum.KeyCode>;
	return keyCodes[value] ?? keyCodes[value.upper()];
}

function isDimensionToken(value: string): boolean {
	const [numeric] = string.match(value, "^%-?[%d%.]+$");
	const [withUnit] = string.match(value, "^%-?[%d%.]+px$");
	const [withPercent] = string.match(value, "^%-?[%d%.]+%%$");
	const [withViewport] = string.match(value, "^%-?[%d%.]+v[hw]$");
	return numeric !== undefined || withUnit !== undefined || withPercent !== undefined || withViewport !== undefined || value.sub(1, 5) === "calc(";
}

function applyGradientProps(
	gradientProps: Record<string, unknown>,
	offset?: string | Vector2,
	rotation?: number,
) {
	if (offset !== undefined) {
		const parsedOffset = parseVector2(offset);
		if (parsedOffset !== undefined) {
			gradientProps.Offset = parsedOffset;
		}
	}
	if (rotation !== undefined) {
		gradientProps.Rotation = rotation;
	}
}

function buildGradientElement(
	key: string,
	input: string,
	offset?: string | Vector2,
	rotation?: number,
): React.Element | undefined {
	if (!isGradientString(input)) return undefined;

	const gradient = parseGradient(input);
	if (gradient === undefined) return undefined;

	const gradientProps: Record<string, unknown> = {
		key,
		Color: gradient.colorSequence,
		Rotation: rotation ?? gradient.rotation,
	};
	if (gradient.transparencySequence !== undefined) {
		gradientProps.Transparency = gradient.transparencySequence;
	}
	applyGradientProps(gradientProps, offset, rotation);

	return React.createElement("uigradient", gradientProps);
}

function resolveSortOrder(sortOrder: CSSProperties["sortOrder"]): Enum.SortOrder {
	if (sortOrder !== undefined && !typeIs(sortOrder, "string")) return sortOrder;
	return sortOrder !== undefined ? (SORT_ORDER_MAP[sortOrder] ?? Enum.SortOrder.LayoutOrder) : Enum.SortOrder.LayoutOrder;
}

function resolveFillDirection(
	direction?: "row" | "column",
	defaultDirection: Enum.FillDirection = Enum.FillDirection.Vertical,
): Enum.FillDirection {
	if (direction === "row") return Enum.FillDirection.Horizontal;
	if (direction === "column") return Enum.FillDirection.Vertical;
	return defaultDirection;
}

function parseLayoutPadding2D(value?: string | number, fallback?: string | number): UDim2 | undefined {
	const source = value ?? fallback;
	if (source === undefined) return undefined;

	const parts = typeIs(source, "string") ? source.split(" ") : [source];
	const x = parseDimension(parts[0]) ?? new UDim(0, 0);
	const y = parts.size() > 1 ? (parseDimension(parts[1]) ?? x) : x;
	return new UDim2(x, y);
}

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

	const fillDirection = resolveFillDirection(flexDir);

	const layoutProps: Record<string, unknown> = {
		FillDirection: fillDirection,
		SortOrder: resolveSortOrder(style.sortOrder),
	};

	if (fWrap === "wrap") {
		layoutProps.Wraps = true;
	}

	const pContent = style.placeContent !== undefined && typeIs(style.placeContent, "string") ? style.placeContent.split(" ") : undefined;
	const resolvedJustifyContent = style.justifyContent ?? (pContent ? (pContent[1] ?? pContent[0]) : undefined);

	// justifyContent → main-axis alignment
	if (resolvedJustifyContent !== undefined) {
		const flexAlign = FLEX_ALIGNMENT_MAP[resolvedJustifyContent];
		if (flexAlign !== undefined) {
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
		SortOrder: resolveSortOrder(style.sortOrder),
	};

	let flexDir = style.flexDirection;
	if (style.flexFlow !== undefined) {
		const flowParts = typeIs(style.flexFlow, "string") ? style.flexFlow.split(" ") : [];
		for (const part of flowParts) {
			if (part === "row" || part === "column") flexDir = flexDir ?? (part as "row" | "column");
		}
	}

	const fillDirection = resolveFillDirection(flexDir, Enum.FillDirection.Horizontal);
	layoutProps.FillDirection = fillDirection;
	if (style.gridMaxCells !== undefined) {
		layoutProps.FillDirectionMaxCells = style.gridMaxCells;
	}
	if (style.gridStartCorner !== undefined) {
		layoutProps.StartCorner = typeIs(style.gridStartCorner, "string")
			? (START_CORNER_MAP[style.gridStartCorner] ?? Enum.StartCorner.TopLeft)
			: style.gridStartCorner;
	}

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

function buildTableLayout(style: CSSProperties): React.Element {
	const layoutProps: Record<string, unknown> = {
		key: "uitablelayout",
		FillDirection: resolveFillDirection(style.tableFillDirection ?? style.flexDirection),
		SortOrder: resolveSortOrder(style.sortOrder),
	};

	if (style.tableMajorAxis !== undefined) {
		layoutProps.MajorAxis = typeIs(style.tableMajorAxis, "string")
			? (TABLE_MAJOR_AXIS_MAP[style.tableMajorAxis] ?? Enum.TableMajorAxis.RowMajor)
			: style.tableMajorAxis;
	}
	if (style.tableFillEmptySpaceColumns !== undefined) {
		layoutProps.FillEmptySpaceColumns = style.tableFillEmptySpaceColumns;
	}
	if (style.tableFillEmptySpaceRows !== undefined) {
		layoutProps.FillEmptySpaceRows = style.tableFillEmptySpaceRows;
	}
	const padding = parseLayoutPadding2D(style.tablePadding, style.gap);
	if (padding !== undefined) {
		layoutProps.Padding = padding;
	}

	return React.createElement("uitablelayout", layoutProps);
}

function buildPageLayout(style: CSSProperties): React.Element {
	const layoutProps: Record<string, unknown> = {
		key: "uipagelayout",
		FillDirection: resolveFillDirection(style.pageFillDirection ?? style.flexDirection, Enum.FillDirection.Horizontal),
		SortOrder: resolveSortOrder(style.sortOrder),
	};

	const pagePadding = style.pagePadding !== undefined ? parseDimension(style.pagePadding) : undefined;
	if (pagePadding !== undefined) layoutProps.Padding = pagePadding;
	if (style.pageAnimated !== undefined) layoutProps.Animated = style.pageAnimated;
	if (style.pageCircular !== undefined) layoutProps.Circular = style.pageCircular;
	if (style.pageTweenTime !== undefined) layoutProps.TweenTime = style.pageTweenTime;
	if (style.pageEasingStyle !== undefined) {
		layoutProps.EasingStyle = typeIs(style.pageEasingStyle, "string")
			? (EASING_STYLE_MAP[style.pageEasingStyle] ?? Enum.EasingStyle.Quad)
			: style.pageEasingStyle;
	}
	if (style.pageEasingDirection !== undefined) {
		layoutProps.EasingDirection = typeIs(style.pageEasingDirection, "string")
			? (EASING_DIRECTION_MAP[style.pageEasingDirection] ?? Enum.EasingDirection.Out)
			: style.pageEasingDirection;
	}
	if (style.pageGamepadInputEnabled !== undefined) {
		layoutProps.GamepadInputEnabled = style.pageGamepadInputEnabled;
	}
	if (style.pageScrollWheelInputEnabled !== undefined) {
		layoutProps.ScrollWheelInputEnabled = style.pageScrollWheelInputEnabled;
	}
	if (style.pageTouchInputEnabled !== undefined) {
		layoutProps.TouchInputEnabled = style.pageTouchInputEnabled;
	}

	return React.createElement("uipagelayout", layoutProps);
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
function buildStroke(border: string, options: StrokeOptions = {}): React.Element | undefined {
	const isTextStroke = options.isTextStroke === true;
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
	let strokeGradient = options.strokeGradient;

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
		if (isGradientString(colorStr)) {
			strokeGradient = colorStr;
			strokeProps.Color = new Color3(1, 1, 1);
		} else {
			const parsed = parseColor(colorStr);
			strokeProps.Color = parsed.color;
			if (parsed.transparency > 0) {
				strokeProps.Transparency = parsed.transparency;
			}
		}
	}

	strokeProps.ApplyStrokeMode = isTextStroke ? Enum.ApplyStrokeMode.Contextual : Enum.ApplyStrokeMode.Border;
	if (options.borderOffset !== undefined) {
		const offset = parseDimension(options.borderOffset);
		if (offset !== undefined) {
			strokeProps.BorderOffset = offset;
		}
	}
	if (options.borderStrokePosition !== undefined) {
		strokeProps.BorderStrokePosition = BORDER_STROKE_POSITION_MAP[options.borderStrokePosition] ?? Enum.BorderStrokePosition.Center;
	}
	if (options.lineJoinMode !== undefined) {
		strokeProps.LineJoinMode = LINE_JOIN_MODE_MAP[options.lineJoinMode] ?? Enum.LineJoinMode.Round;
	}
	if (options.strokeSizingMode !== undefined) {
		strokeProps.StrokeSizingMode = STROKE_SIZING_MODE_MAP[options.strokeSizingMode] ?? Enum.StrokeSizingMode.FixedSize;
	}
	if (options.strokeTransparency !== undefined) {
		strokeProps.Transparency = math.clamp(options.strokeTransparency, 0, 1);
	}
	if (options.strokeZIndex !== undefined) {
		strokeProps.ZIndex = options.strokeZIndex;
	}
	strokeProps.key = isTextStroke ? "uitextstroke" : "uistroke";

	const gradientElement =
		strokeGradient !== undefined
			? buildGradientElement(
					isTextStroke ? "uitextstroke-gradient" : "uistroke-gradient",
					strokeGradient,
					options.strokeGradientOffset,
					options.strokeGradientRotation,
				)
			: undefined;

	if (gradientElement !== undefined) {
		if (strokeProps.Color === undefined) {
			strokeProps.Color = new Color3(1, 1, 1);
		}
		return React.createElement("uistroke", strokeProps, gradientElement);
	}

	return React.createElement("uistroke", strokeProps);
}

function getRadiusParts(radius: string | number | undefined): UDim[] {
	if (radius === undefined) return [];
	if (typeIs(radius, "number")) {
		const parsed = parseDimension(radius);
		return parsed !== undefined ? [parsed] : [];
	}

	const firstRadiusSet = splitOutsideParens(radius, "/")[0] ?? radius;
	const parts = splitOutsideParens(firstRadiusSet).filter((part) => part !== "");
	const radii: UDim[] = [];
	for (const part of parts) {
		const parsed = parseDimension(part);
		if (parsed !== undefined) {
			radii.push(parsed);
		}
	}
	return radii;
}

function expandCornerRadii(radius: string | number | undefined): [UDim, UDim, UDim, UDim] {
	const parts = getRadiusParts(radius);
	const zero = new UDim(0, 0);

	if (parts.size() === 0) return [zero, zero, zero, zero];
	if (parts.size() === 1) return [parts[0], parts[0], parts[0], parts[0]];
	if (parts.size() === 2) return [parts[0], parts[1], parts[0], parts[1]];
	if (parts.size() === 3) return [parts[0], parts[1], parts[2], parts[1]];
	return [parts[0], parts[1], parts[2], parts[3]];
}

function buildCorner(style: CSSProperties): React.Element | undefined {
	const hasIndividualCorner =
		style.borderTopLeftRadius !== undefined ||
		style.borderTopRightRadius !== undefined ||
		style.borderBottomRightRadius !== undefined ||
		style.borderBottomLeftRadius !== undefined;

	if (style.borderRadius === undefined && !hasIndividualCorner) {
		return undefined;
	}

	if (!hasIndividualCorner) {
		const firstRadius = getRadiusParts(style.borderRadius)[0];
		return React.createElement("uicorner", { key: "uicorner", CornerRadius: firstRadius ?? new UDim(0, 0) });
	}

	const [topLeft, topRight, bottomRight, bottomLeft] = expandCornerRadii(style.borderRadius);
	const topLeftOverride = style.borderTopLeftRadius !== undefined ? parseDimension(style.borderTopLeftRadius) : undefined;
	const topRightOverride = style.borderTopRightRadius !== undefined ? parseDimension(style.borderTopRightRadius) : undefined;
	const bottomRightOverride = style.borderBottomRightRadius !== undefined ? parseDimension(style.borderBottomRightRadius) : undefined;
	const bottomLeftOverride = style.borderBottomLeftRadius !== undefined ? parseDimension(style.borderBottomLeftRadius) : undefined;

	return React.createElement("uicorner", {
		key: "uicorner",
		TopLeftRadius: topLeftOverride ?? topLeft,
		TopRightRadius: topRightOverride ?? topRight,
		BottomRightRadius: bottomRightOverride ?? bottomRight,
		BottomLeftRadius: bottomLeftOverride ?? bottomLeft,
	});
}

type NativeShadowValues = {
	blurRadius?: UDim;
	color?: Color3;
	offset?: UDim2;
	spread?: UDim2;
	transparency?: number;
	zIndex?: number;
};

function parseBoxShadowString(value: string): NativeShadowValues {
	const tokens = splitOutsideParens(value).filter((part) => part !== "" && part !== "inset");
	const dimensions: string[] = [];
	const colorTokens: string[] = [];

	for (const token of tokens) {
		if (isDimensionToken(token) && colorTokens.size() === 0) {
			dimensions.push(token);
		} else {
			colorTokens.push(token);
		}
	}

	const offsetX = parseDimension(dimensions[0] ?? "0") ?? new UDim(0, 0);
	const offsetY = parseDimension(dimensions[1] ?? "0") ?? new UDim(0, 0);
	const blurRadius = dimensions[2] !== undefined ? parseDimension(dimensions[2]) : undefined;
	const spread = dimensions[3] !== undefined ? parseDimension(dimensions[3]) : undefined;
	const parsedColor = colorTokens.size() > 0 ? parseColor(colorTokens.join(" ")) : undefined;

	return {
		blurRadius,
		color: parsedColor?.color as Color3 | undefined,
		offset: new UDim2(offsetX, offsetY),
		spread: spread !== undefined ? new UDim2(spread, spread) : undefined,
		transparency: parsedColor?.transparency,
	};
}

function presetNativeShadow(value: string | undefined): NativeShadowValues {
	if (value === "sm") {
		return {
			blurRadius: new UDim(0, 4),
			offset: new UDim2(0, 0, 0, 2),
			spread: new UDim2(0, 1, 0, 1),
			transparency: 0.7,
		};
	}
	if (value === "md") {
		return {
			blurRadius: new UDim(0, 8),
			offset: new UDim2(0, 0, 0, 4),
			spread: new UDim2(0, 2, 0, 2),
			transparency: 0.6,
		};
	}
	if (value === "xl" || value === "2xl") {
		return {
			blurRadius: new UDim(0, value === "2xl" ? 24 : 18),
			offset: new UDim2(0, 0, 0, value === "2xl" ? 15 : 10),
			spread: new UDim2(0, value === "2xl" ? 8 : 6, 0, value === "2xl" ? 8 : 6),
			transparency: value === "2xl" ? 0.4 : 0.45,
		};
	}
	return {
		blurRadius: new UDim(0, 12),
		offset: new UDim2(0, 0, 0, 6),
		spread: new UDim2(0, 4, 0, 4),
		transparency: 0.5,
	};
}

function buildNativeShadow(style: CSSProperties): React.Element | undefined {
	const hasNativeShadowProps =
		style.shadowBlurRadius !== undefined ||
		style.shadowColor !== undefined ||
		style.shadowOffset !== undefined ||
		style.shadowSpread !== undefined ||
		style.shadowTransparency !== undefined ||
		style.shadowZIndex !== undefined;

	if (style.boxShadow === "none" || (style.boxShadow === undefined && !hasNativeShadowProps)) {
		return undefined;
	}

	const base =
		style.boxShadow !== undefined && SHADOW_SIZE_MAP[style.boxShadow] === undefined
			? parseBoxShadowString(style.boxShadow)
			: presetNativeShadow(style.boxShadow);

	const props: Record<string, unknown> = {
		key: "uishadow",
		Color: base.color ?? new Color3(0, 0, 0),
		Transparency: base.transparency ?? 0.5,
		BlurRadius: base.blurRadius ?? new UDim(0, 12),
		Offset: base.offset ?? new UDim2(0, 0, 0, 6),
		Spread: base.spread ?? new UDim2(0, 4, 0, 4),
	};

	if (style.shadowBlurRadius !== undefined) {
		props.BlurRadius = parseDimension(style.shadowBlurRadius) ?? props.BlurRadius;
	}
	if (style.shadowColor !== undefined) {
		const parsed = parseColor(style.shadowColor);
		props.Color = parsed.color;
		props.Transparency = parsed.transparency;
	}
	if (style.shadowOffset !== undefined) {
		props.Offset = parseUDim2Pair(style.shadowOffset, new UDim(0, 0), new UDim(0, 0));
	}
	if (style.shadowSpread !== undefined) {
		props.Spread = parseUDim2Pair(style.shadowSpread, new UDim(0, 0), new UDim(0, 0));
	}
	if (style.shadowTransparency !== undefined) {
		props.Transparency = math.clamp(style.shadowTransparency, 0, 1);
	}
	if (style.shadowZIndex !== undefined) {
		props.ZIndex = style.shadowZIndex;
	}

	return React.createElement("uishadow", props);
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
				Rotation: style.backgroundGradientRotation ?? gradient.rotation,
			};
			if (gradient.transparencySequence !== undefined) {
				gradientProps.Transparency = gradient.transparencySequence;
			}
			applyGradientProps(gradientProps, style.backgroundGradientOffset, style.backgroundGradientRotation);
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
	const corner = buildCorner(style);
	if (corner !== undefined) {
		children.push(corner);
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
	// 6. display layout → inject the matching Roblox layout component or set Visible
	if (style.display === "flex") {
		children.push(buildListLayout(style));
	} else if (style.display === "grid") {
		children.push(buildGridLayout(style));
	} else if (style.display === "table") {
		children.push(buildTableLayout(style));
	} else if (style.display === "page") {
		children.push(buildPageLayout(style));
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
		const stroke = buildStroke(activeBorder, {
			borderOffset: style.borderOffset,
			borderStrokePosition: style.borderStrokePosition,
			lineJoinMode: style.lineJoinMode,
			strokeSizingMode: style.strokeSizingMode,
			strokeTransparency: style.strokeTransparency,
			strokeZIndex: style.strokeZIndex,
			strokeGradient: style.strokeGradient,
			strokeGradientOffset: style.strokeGradientOffset,
			strokeGradientRotation: style.strokeGradientRotation,
		});
		if (stroke !== undefined) {
			children.push(stroke);
		}
	}
	// textStroke → inject <uistroke> with Contextual mode
	if (style.textStroke !== undefined) {
		const stroke = buildStroke(style.textStroke, {
			isTextStroke: true,
			lineJoinMode: style.lineJoinMode,
			strokeSizingMode: style.strokeSizingMode,
			strokeTransparency: style.strokeTransparency,
			strokeZIndex: style.strokeZIndex,
			strokeGradient: style.strokeGradient,
			strokeGradientOffset: style.strokeGradientOffset,
			strokeGradientRotation: style.strokeGradientRotation,
		});
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
	if (style.scale !== undefined) {
		children.push(
			React.createElement("uiscale", {
				key: "uiscale",
				Scale: style.scale,
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
	if (style.minTextSize !== undefined || style.maxTextSize !== undefined) {
		children.push(
			React.createElement("uitextsizeconstraint", {
				key: "uitextsizeconstraint",
				MinTextSize: style.minTextSize ?? 1,
				MaxTextSize: style.maxTextSize ?? 1000,
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
	if (style.textScaled !== undefined) {
		props.TextScaled = style.textScaled;
	}
	if (style.maxVisibleGraphemes !== undefined) {
		props.MaxVisibleGraphemes = style.maxVisibleGraphemes;
	}
	if (style.richText === true) {
		props.RichText = true;
	}
	if (style.textStrokeColor !== undefined) {
		props.TextStrokeColor3 = parseColor(style.textStrokeColor).color;
	}
	if (style.textStrokeTransparency !== undefined) {
		props.TextStrokeTransparency = style.textStrokeTransparency;
	}
	if (style.autoLocalize !== undefined) {
		props.AutoLocalize = style.autoLocalize;
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

	// Roblox UI object aliases surfaced by the Creator Hub UI docs.
	if (style.image !== undefined) props.Image = style.image;
	if (style.hoverImage !== undefined) props.HoverImage = style.hoverImage;
	if (style.pressedImage !== undefined) props.PressedImage = style.pressedImage;
	if (style.imageColor !== undefined) props.ImageColor3 = parseColor(style.imageColor).color;
	if (style.imageTransparency !== undefined) props.ImageTransparency = style.imageTransparency;
	if (style.groupColor !== undefined) props.GroupColor3 = parseColor(style.groupColor).color;
	if (style.groupTransparency !== undefined) props.GroupTransparency = style.groupTransparency;

	if (style.canvasSize !== undefined) {
		const canvasSize = parseUDim2Value(style.canvasSize);
		if (canvasSize !== undefined) props.CanvasSize = canvasSize;
	}
	if (style.automaticCanvasSize !== undefined) {
		props.AutomaticCanvasSize = AUTO_SIZE_MAP[style.automaticCanvasSize] ?? Enum.AutomaticSize.None;
	}
	if (style.canvasPosition !== undefined) {
		const canvasPosition = parseVector2(style.canvasPosition);
		if (canvasPosition !== undefined) props.CanvasPosition = canvasPosition;
	}
	if (style.verticalScrollBarInset !== undefined) {
		props.VerticalScrollBarInset = SCROLL_BAR_INSET_MAP[style.verticalScrollBarInset] ?? Enum.ScrollBarInset.None;
	}
	if (style.horizontalScrollBarInset !== undefined) {
		props.HorizontalScrollBarInset = SCROLL_BAR_INSET_MAP[style.horizontalScrollBarInset] ?? Enum.ScrollBarInset.None;
	}
	if (style.verticalScrollBarPosition !== undefined) {
		props.VerticalScrollBarPosition =
			VERTICAL_SCROLL_BAR_POSITION_MAP[style.verticalScrollBarPosition] ?? Enum.VerticalScrollBarPosition.Right;
	}
	if (style.scrollBarThickness !== undefined) props.ScrollBarThickness = style.scrollBarThickness;
	if (style.scrollBarImageColor !== undefined) props.ScrollBarImageColor3 = parseColor(style.scrollBarImageColor).color;
	if (style.scrollBarImageTransparency !== undefined) props.ScrollBarImageTransparency = style.scrollBarImageTransparency;
	if (style.scrollBarTopImage !== undefined) props.TopImage = style.scrollBarTopImage;
	if (style.scrollBarMidImage !== undefined) props.MidImage = style.scrollBarMidImage;
	if (style.scrollBarBottomImage !== undefined) props.BottomImage = style.scrollBarBottomImage;
	if (style.elasticBehavior !== undefined) {
		props.ElasticBehavior = ELASTIC_BEHAVIOR_MAP[style.elasticBehavior] ?? Enum.ElasticBehavior.WhenScrollable;
	}

	if (style.viewportAmbient !== undefined) props.Ambient = parseColor(style.viewportAmbient).color;
	if (style.viewportLightColor !== undefined) props.LightColor = parseColor(style.viewportLightColor).color;
	if (style.viewportLightDirection !== undefined) {
		const lightDirection = parseVector3(style.viewportLightDirection);
		if (lightDirection !== undefined) props.LightDirection = lightDirection;
	}

	if (style.video !== undefined) props.Video = style.video;
	if (style.looped !== undefined) props.Looped = style.looped;
	if (style.playing !== undefined) props.Playing = style.playing;

	if (style.pathColor !== undefined) props.Color3 = parseColor(style.pathColor).color;
	if (style.pathThickness !== undefined) props.Thickness = style.pathThickness;

	if (style.promptObjectText !== undefined) props.ObjectText = style.promptObjectText;
	if (style.promptActionText !== undefined) props.ActionText = style.promptActionText;
	if (style.promptKeyboardKeyCode !== undefined) {
		const keyCode = parseKeyCode(style.promptKeyboardKeyCode);
		if (keyCode !== undefined) props.KeyboardKeyCode = keyCode;
	}
	if (style.promptGamepadKeyCode !== undefined) {
		const keyCode = parseKeyCode(style.promptGamepadKeyCode);
		if (keyCode !== undefined) props.GamepadKeyCode = keyCode;
	}
	if (style.promptMaxActivationDistance !== undefined) {
		props.MaxActivationDistance = style.promptMaxActivationDistance;
	}
	if (style.promptRequiresLineOfSight !== undefined) {
		props.RequiresLineOfSight = style.promptRequiresLineOfSight;
	}
	if (style.promptExclusivity !== undefined) {
		props.Exclusivity =
			PROXIMITY_PROMPT_EXCLUSIVITY_MAP[style.promptExclusivity] ?? Enum.ProximityPromptExclusivity.OnePerButton;
	}
	if (style.promptHoldDuration !== undefined) props.HoldDuration = style.promptHoldDuration;
	if (style.promptClickable !== undefined) props.ClickablePrompt = style.promptClickable;

	if (style.uiDragStyle !== undefined) {
		props.DragStyle = UI_DRAG_STYLE_MAP[style.uiDragStyle] ?? Enum.UIDragDetectorDragStyle.TranslatePlane;
	}
	if (style.uiDragResponseStyle !== undefined) {
		props.ResponseStyle = UI_DRAG_RESPONSE_STYLE_MAP[style.uiDragResponseStyle] ?? Enum.UIDragDetectorResponseStyle.Offset;
	}
	if (style.uiDragAxis !== undefined) {
		const dragAxis = parseVector2(style.uiDragAxis);
		if (dragAxis !== undefined) props.DragAxis = dragAxis;
	}
	if (style.uiDragMinTranslation !== undefined) {
		const minDragTranslation = parseUDim2Value(style.uiDragMinTranslation);
		if (minDragTranslation !== undefined) props.MinDragTranslation = minDragTranslation;
	}
	if (style.uiDragMaxTranslation !== undefined) {
		const maxDragTranslation = parseUDim2Value(style.uiDragMaxTranslation);
		if (maxDragTranslation !== undefined) props.MaxDragTranslation = maxDragTranslation;
	}
	if (style.uiDragMinAngle !== undefined) props.MinDragAngle = style.uiDragMinAngle;
	if (style.uiDragMaxAngle !== undefined) props.MaxDragAngle = style.uiDragMaxAngle;
	if (style.uiDragBoundingBehavior !== undefined) {
		props.BoundingBehavior =
			UI_DRAG_BOUNDING_BEHAVIOR_MAP[style.uiDragBoundingBehavior] ?? Enum.UIDragDetectorBoundingBehavior.Automatic;
	}
	if (style.uiDragSpeedAxisMapping !== undefined) {
		props.UIDragSpeedAxisMapping =
			UI_DRAG_SPEED_AXIS_MAPPING_MAP[style.uiDragSpeedAxisMapping] ?? Enum.UIDragSpeedAxisMapping.XY;
	}

	if (style.dragStyle !== undefined) {
		props.DragStyle = DRAG_STYLE_MAP[style.dragStyle] ?? Enum.DragDetectorDragStyle.TranslatePlane;
	}
	if (style.dragResponseStyle !== undefined) {
		props.ResponseStyle = DRAG_RESPONSE_STYLE_MAP[style.dragResponseStyle] ?? Enum.DragDetectorResponseStyle.Geometric;
	}
	if (style.dragAxis !== undefined) {
		const dragAxis = parseVector3(style.dragAxis);
		if (dragAxis !== undefined) props.Axis = dragAxis;
	}
	if (style.dragOrientation !== undefined) {
		const orientation = parseVector3(style.dragOrientation);
		if (orientation !== undefined) props.Orientation = orientation;
	}
	if (style.dragMinTranslation !== undefined) {
		const minDragTranslation = parseVector3(style.dragMinTranslation);
		if (minDragTranslation !== undefined) props.MinDragTranslation = minDragTranslation;
	}
	if (style.dragMaxTranslation !== undefined) {
		const maxDragTranslation = parseVector3(style.dragMaxTranslation);
		if (maxDragTranslation !== undefined) props.MaxDragTranslation = maxDragTranslation;
	}
	if (style.dragMinAngle !== undefined) props.MinDragAngle = style.dragMinAngle;
	if (style.dragMaxAngle !== undefined) props.MaxDragAngle = style.dragMaxAngle;
	if (style.dragPermissionPolicy !== undefined) {
		props.PermissionPolicy =
			DRAG_PERMISSION_POLICY_MAP[style.dragPermissionPolicy] ?? Enum.DragDetectorPermissionPolicy.Everybody;
	}
	if (style.dragApplyAtCenterOfMass !== undefined) props.ApplyAtCenterOfMass = style.dragApplyAtCenterOfMass;
	if (style.dragMaxForce !== undefined) props.MaxForce = style.dragMaxForce;
	if (style.dragMaxTorque !== undefined) props.MaxTorque = style.dragMaxTorque;
	if (style.dragResponsiveness !== undefined) props.Responsiveness = style.dragResponsiveness;
	if (style.dragRunLocally !== undefined) props.RunLocally = style.dragRunLocally;

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

	// 15. boxShadow → inject <imagelabel> fallback or opt-in <uishadow>
	if (style.boxShadow !== undefined && style.boxShadow !== "none") {
		const shadowTokens = splitOutsideParens(style.boxShadow);
		const looksLikeCssShadow = shadowTokens.some((token) => isDimensionToken(token));
		const shouldUseNativeShadow =
			style.boxShadowMode === "uishadow" ||
			style.shadowBlurRadius !== undefined ||
			style.shadowColor !== undefined ||
			style.shadowOffset !== undefined ||
			style.shadowSpread !== undefined ||
			style.shadowTransparency !== undefined ||
			style.shadowZIndex !== undefined ||
			(style.boxShadowMode !== "image" && looksLikeCssShadow && SHADOW_SIZE_MAP[style.boxShadow] === undefined);

		if (shouldUseNativeShadow) {
			const shadow = buildNativeShadow(style);
			if (shadow !== undefined) {
				children.push(shadow);
			}
		} else {
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
	} else if (
		style.shadowBlurRadius !== undefined ||
		style.shadowColor !== undefined ||
		style.shadowOffset !== undefined ||
		style.shadowSpread !== undefined ||
		style.shadowTransparency !== undefined ||
		style.shadowZIndex !== undefined
	) {
		const shadow = buildNativeShadow(style);
		if (shadow !== undefined) {
			children.push(shadow);
		}
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
