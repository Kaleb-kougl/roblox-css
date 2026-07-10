/**
 * roblox-css — CSS-to-Roblox UI translation middleware.
 *
 * @license LGPL-3.0-only
 * @author Kaleb Kougl
 */
export { webStyle, SHADOW_ASSET_ID, SHADOW_SLICE_CENTER } from "./styles/webStyle";
export type { CSSProperties } from "./styles/CSSTypes";
export { parseColor } from "./styles/colorParser";
export { parseDimension, parsePadding } from "./styles/dimensionParser";
export { parseGradient } from "./styles/gradientParser";
export { NAMED_COLORS } from "./styles/namedColors";
export { transitions } from "./styles/transitions";
export { ParentSizeContext } from "./styles/ParentSizeContext";
export { Box } from "./primitives/Box";
export type { BoxProps } from "./primitives/Box";
export { Text } from "./primitives/Text";
export { Button } from "./primitives/Button";
export { Image } from "./primitives/Image";
export { Input } from "./primitives/Input";
export { ScrollBox } from "./primitives/ScrollBox";
export { ScreenContainer } from "./primitives/ScreenContainer";
export type { ScreenContainerProps } from "./primitives/ScreenContainer";
export { InlineText } from "./primitives/InlineText";
export { Div, Span, P, H1, H2, H3 } from "./primitives/HtmlElements";
export { parseInlineImages, containsRichTextTags } from "./utils/parseInlineImages";
export type { InlineSegment, TextSegment, ImageSegment } from "./utils/parseInlineImages";
export { MotionBox } from "./primitives/MotionBox";
export type { MotionBoxProps } from "./primitives/MotionBox";
export { MotionText } from "./primitives/MotionText";
export { MotionButton } from "./primitives/MotionButton";
export { MotionImage } from "./primitives/MotionImage";
export { MotionUIScale } from "./primitives/MotionUIScale";
export { useVariantResolver, isAnimatable } from "./primitives/useVariantResolver";
export type { MotionProps } from "./primitives/useVariantResolver";
export { usePercentageConstraints } from "./primitives/usePercentageConstraints";
export { setLogLevel, LogLevel } from "./logger";
export type { DeepReadonly } from "./types";
