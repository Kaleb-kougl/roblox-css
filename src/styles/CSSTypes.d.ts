/**
 * CSSTypes.d.ts — Strongly-typed style prop interface.
 *
 * This is the contract that every wrapper component's `style` prop uses.
 * Define all supported CSS properties here with their accepted value types.
 * Properties not listed here are intentionally unsupported.
 *
 * Reference: docs/FEATURE_MAPPING.md
 */

export type FlexDirectionType = "row" | "column";
export type FlexWrapType = "nowrap" | "wrap";
export type JustifyContentType = "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
export type AlignItemsType = "flex-start" | "center" | "flex-end" | "stretch";
export type BackgroundSizeType = "cover" | "contain" | "fill" | "100% 100%";

export interface CSSProperties {
	// --- Box Model & Sizing (FEATURE_MAPPING §2) ---
	width?: string | number;
	height?: string | number;
	minWidth?: string | number;
	maxWidth?: string | number;
	minHeight?: string | number;
	maxHeight?: string | number;

	// --- Spacing ---
	padding?: string | number;
	paddingTop?: string | number;
	paddingRight?: string | number;
	paddingBottom?: string | number;
	paddingLeft?: string | number;
	paddingInline?: string | number;
	paddingBlock?: string | number;

	// --- Positioning ---
	position?: "absolute" | "relative";
	top?: string | number;
	right?: string | number;
	bottom?: string | number;
	left?: string | number;
	zIndex?: number;
	transformOrigin?: string;

	// --- Layout ---
	layoutOrder?: number;
	order?: number;
	rotation?: number;
	autoSize?: "none" | "x" | "y" | "xy";

	// --- Flexbox Layout (FEATURE_MAPPING §3) ---
	display?: "flex" | "grid" | "none";
	flexDirection?: FlexDirectionType;
	flexWrap?: FlexWrapType;
	flexFlow?: FlexDirectionType | FlexWrapType | `${FlexDirectionType} ${FlexWrapType}` | `${FlexWrapType} ${FlexDirectionType}` | string;
	justifyContent?: JustifyContentType;
	alignItems?: AlignItemsType;
	placeItems?: AlignItemsType | JustifyContentType | `${AlignItemsType} ${JustifyContentType}` | string;
	placeContent?: AlignItemsType | JustifyContentType | `${AlignItemsType} ${JustifyContentType}` | string;
	gap?: string | number;
	rowGap?: string | number;
	columnGap?: string | number;

	// --- Flex Item (per-child, injects UIFlexItem) ---
	flexGrow?: number;
	flexShrink?: number;
	flex?: number | "auto" | "none";
	alignSelf?: "auto" | "flex-start" | "flex-end" | "center" | "stretch";

	// --- Grid Layout (Emulating UIGridLayout) ---
	gridTemplateColumns?: string | number;
	gridTemplateRows?: string | number;

	// --- Aesthetics (FEATURE_MAPPING §4) ---
	backgroundColor?: string;
	background?: string;
	backgroundImage?: string;
	backgroundSize?: BackgroundSizeType;
	color?: string;
	opacity?: number;
	borderRadius?: string | number;
	border?: string;
	outline?: string;
	boxShadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
	overflow?: "hidden" | "visible";
	objectFit?: "cover" | "contain" | "fill";
	visibility?: "visible" | "hidden";

	// --- Constraints ---
	aspectRatio?: number;

	// --- Typography (FEATURE_MAPPING §5) ---
	fontSize?: number;
	fontFamily?: string;
	fontWeight?: "normal" | "bold" | "black";
	fontStyle?: "normal" | "italic";
	textShadow?: string;
	textAlign?: "left" | "center" | "right";
	textVerticalAlign?: "top" | "center" | "bottom";
	whiteSpace?: "normal" | "nowrap" | "pre-wrap" | "pre-line";
	wordBreak?: "normal" | "break-word" | "break-all" | "keep-all";
	lineHeight?: number;
	textOverflow?: "ellipsis";
	textDecoration?: "none" | "underline" | "line-through";
	textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
	richText?: boolean;
	textStroke?: string;
	userSelect?: "none" | "auto" | "text";

	// --- Interactivity (FEATURE_MAPPING §6) ---
	pointerEvents?: "none" | "auto";
}
