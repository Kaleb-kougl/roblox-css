/**
 * roblox-css — CSS-to-Roblox UI translation middleware.
 *
 * @license LGPL-3.0-only
 * @author Kaleb Kougl
 */

// Core engine
export { webStyle, SHADOW_ASSET_ID, SHADOW_SLICE_CENTER } from "./styles/webStyle";
export type { CSSProperties } from "./styles/CSSTypes";

// Parsers (for advanced users)
export { parseColor } from "./styles/colorParser";
export { parseDimension, parsePadding } from "./styles/dimensionParser";
export { parseGradient } from "./styles/gradientParser";

// Named colors
export { NAMED_COLORS } from "./styles/namedColors";

// Transitions
export { transitions } from "./styles/transitions";

// Context
export { ParentSizeContext } from "./styles/ParentSizeContext";

// Base primitives
export { Box } from "./primitives/Box";
export type { BoxProps } from "./primitives/Box";
export { Text } from "./primitives/Text";
export { Button } from "./primitives/Button";
export { Image } from "./primitives/Image";
export { Input } from "./primitives/Input";
export { ScrollBox } from "./primitives/ScrollBox";
export { InlineText } from "./primitives/InlineText";
export { Div, Span, P, H1, H2, H3 } from "./primitives/HtmlElements";

// Inline image parser (for advanced users)
export { parseInlineImages, containsRichTextTags } from "./utils/parseInlineImages";
export type { InlineSegment, TextSegment, ImageSegment } from "./utils/parseInlineImages";

// Motion primitives
export { MotionBox } from "./primitives/MotionBox";
export type { MotionBoxProps } from "./primitives/MotionBox";
export { MotionText } from "./primitives/MotionText";
export { MotionButton } from "./primitives/MotionButton";
export { MotionImage } from "./primitives/MotionImage";
export { MotionUIScale } from "./primitives/MotionUIScale";

// Motion hooks
export { useVariantResolver, isAnimatable } from "./primitives/useVariantResolver";
export type { MotionProps } from "./primitives/useVariantResolver";
export { usePercentageConstraints } from "./primitives/usePercentageConstraints";

// Logger (for consumers who want to configure logging level)
export { setLogLevel, LogLevel } from "./logger";

// Types
export type { DeepReadonly } from "./types";
