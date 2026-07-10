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
export type JustifyContentType = "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
export type AlignItemsType = "flex-start" | "center" | "flex-end" | "stretch";
export type DisplayType = "flex" | "grid" | "table" | "page" | "none";
export type SortOrderType = "layout-order" | "name";
export type TableMajorAxisType = "row-major" | "column-major";
export type GridStartCornerType = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type EasingStyleType =
	| "linear"
	| "sine"
	| "back"
	| "quad"
	| "quart"
	| "quint"
	| "bounce"
	| "elastic"
	| "exponential"
	| "circular"
	| "cubic";
export type EasingDirectionType = "in" | "out" | "in-out";
export type BackgroundSizeType = "cover" | "contain" | "fill" | "100% 100%";
export type StrokeSizingModeType = "fixed" | "scaled";
export type BorderStrokePositionType = "inner" | "center" | "outer";
export type LineJoinModeType = "round" | "bevel" | "miter";
export type BoxShadowModeType = "image" | "uishadow";
export type AutoSizeAxisType = "none" | "x" | "y" | "xy";
export type ScrollBarInsetType = "none" | "scrollbar" | "always";
export type ElasticBehaviorType = "when-scrollable" | "always" | "never";
export type VerticalScrollBarPositionType = "left" | "right";
export type UIDragStyleType = "translate-plane" | "translate-line" | "rotate" | "scriptable";
export type UIDragResponseStyleType = "offset" | "scale" | "custom-offset" | "custom-scale";
export type UIDragBoundingBehaviorType = "automatic" | "entire-object" | "hit-point";
export type UIDragSpeedAxisMappingType = "xy" | "xx" | "yy";
export type DragStyleType =
	| "translate-line"
	| "translate-plane"
	| "translate-plane-or-line"
	| "translate-line-or-plane"
	| "translate-view-plane"
	| "rotate-axis"
	| "rotate-trackball"
	| "best-for-device"
	| "scriptable";
export type DragResponseStyleType = "geometric" | "physical" | "custom";
export type DragPermissionPolicyType = "nobody" | "everybody" | "scriptable";
export type ProximityPromptExclusivityType = "one-per-button" | "one-globally" | "always-show";

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
	autoSize?: AutoSizeAxisType;

	// --- Flexbox Layout (FEATURE_MAPPING §3) ---
	display?: DisplayType;
	sortOrder?: SortOrderType | Enum.SortOrder;
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
	gridMaxCells?: number;
	gridStartCorner?: GridStartCornerType | Enum.StartCorner;

	// --- Table / Page Layouts (UITableLayout / UIPageLayout) ---
	tableFillDirection?: FlexDirectionType;
	tableMajorAxis?: TableMajorAxisType | Enum.TableMajorAxis;
	tableFillEmptySpaceColumns?: boolean;
	tableFillEmptySpaceRows?: boolean;
	tablePadding?: string | number;
	pageFillDirection?: FlexDirectionType;
	pagePadding?: string | number;
	pageAnimated?: boolean;
	pageCircular?: boolean;
	pageTweenTime?: number;
	pageEasingStyle?: EasingStyleType | Enum.EasingStyle;
	pageEasingDirection?: EasingDirectionType | Enum.EasingDirection;
	pageGamepadInputEnabled?: boolean;
	pageScrollWheelInputEnabled?: boolean;
	pageTouchInputEnabled?: boolean;

	// --- Aesthetics (FEATURE_MAPPING §4) ---
	backgroundColor?: string;
	background?: string;
	backgroundGradientOffset?: string | Vector2;
	backgroundGradientRotation?: number;
	backgroundImage?: string;
	backgroundSize?: BackgroundSizeType;
	color?: string;
	opacity?: number;
	borderRadius?: string | number;
	borderTopLeftRadius?: string | number;
	borderTopRightRadius?: string | number;
	borderBottomRightRadius?: string | number;
	borderBottomLeftRadius?: string | number;
	border?: string;
	outline?: string;
	borderOffset?: string | number;
	borderStrokePosition?: BorderStrokePositionType;
	lineJoinMode?: LineJoinModeType;
	strokeSizingMode?: StrokeSizingModeType;
	strokeTransparency?: number;
	strokeZIndex?: number;
	strokeGradient?: string;
	strokeGradientOffset?: string | Vector2;
	strokeGradientRotation?: number;
	boxShadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | string;
	boxShadowMode?: BoxShadowModeType;
	shadowBlurRadius?: string | number;
	shadowColor?: string;
	shadowOffset?: string;
	shadowSpread?: string;
	shadowTransparency?: number;
	shadowZIndex?: number;
	overflow?: "hidden" | "visible";
	objectFit?: "cover" | "contain" | "fill";
	visibility?: "visible" | "hidden";
	image?: string;
	hoverImage?: string;
	pressedImage?: string;
	imageColor?: string;
	imageTransparency?: number;
	groupColor?: string;
	groupTransparency?: number;

	// --- Constraints ---
	aspectRatio?: number;
	scale?: number;
	minTextSize?: number;
	maxTextSize?: number;

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
	textScaled?: boolean;
	maxVisibleGraphemes?: number;
	textDecoration?: "none" | "underline" | "line-through";
	textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
	richText?: boolean;
	textStroke?: string;
	textStrokeColor?: string;
	textStrokeTransparency?: number;
	autoLocalize?: boolean;
	userSelect?: "none" | "auto" | "text";

	// --- Interactivity (FEATURE_MAPPING §6) ---
	pointerEvents?: "none" | "auto";

	// --- Specialized Roblox UI Objects ---
	canvasSize?: string | UDim2;
	automaticCanvasSize?: AutoSizeAxisType;
	canvasPosition?: string | Vector2;
	verticalScrollBarInset?: ScrollBarInsetType;
	horizontalScrollBarInset?: ScrollBarInsetType;
	verticalScrollBarPosition?: VerticalScrollBarPositionType;
	scrollBarThickness?: number;
	scrollBarImageColor?: string;
	scrollBarImageTransparency?: number;
	scrollBarTopImage?: string;
	scrollBarMidImage?: string;
	scrollBarBottomImage?: string;
	elasticBehavior?: ElasticBehaviorType;
	viewportAmbient?: string;
	viewportLightColor?: string;
	viewportLightDirection?: string | Vector3;
	video?: string;
	looped?: boolean;
	playing?: boolean;
	pathColor?: string;
	pathThickness?: number;
	promptObjectText?: string;
	promptActionText?: string;
	promptKeyboardKeyCode?: string | Enum.KeyCode;
	promptGamepadKeyCode?: string | Enum.KeyCode;
	promptMaxActivationDistance?: number;
	promptRequiresLineOfSight?: boolean;
	promptExclusivity?: ProximityPromptExclusivityType;
	promptHoldDuration?: number;
	promptClickable?: boolean;
	uiDragStyle?: UIDragStyleType;
	uiDragResponseStyle?: UIDragResponseStyleType;
	uiDragAxis?: string | Vector2;
	uiDragMinTranslation?: string | UDim2;
	uiDragMaxTranslation?: string | UDim2;
	uiDragMinAngle?: number;
	uiDragMaxAngle?: number;
	uiDragBoundingBehavior?: UIDragBoundingBehaviorType;
	uiDragSpeedAxisMapping?: UIDragSpeedAxisMappingType;
	dragStyle?: DragStyleType;
	dragResponseStyle?: DragResponseStyleType;
	dragAxis?: string | Vector3;
	dragOrientation?: string | Vector3;
	dragMinTranslation?: string | Vector3;
	dragMaxTranslation?: string | Vector3;
	dragMinAngle?: number;
	dragMaxAngle?: number;
	dragPermissionPolicy?: DragPermissionPolicyType;
	dragApplyAtCenterOfMass?: boolean;
	dragMaxForce?: number;
	dragMaxTorque?: number;
	dragResponsiveness?: number;
	dragRunLocally?: boolean;
}
