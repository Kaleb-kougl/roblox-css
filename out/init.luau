-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local exports = {}
--[[
	*
	 * roblox-css — CSS-to-Roblox UI translation middleware.
	 *
	 * @license LGPL-3.0-only
	 * @author Kaleb Kougl
	 
]]
-- Core engine
local _webStyle = TS.import(script, script, "styles", "webStyle")
exports.webStyle = _webStyle.webStyle
exports.SHADOW_ASSET_ID = _webStyle.SHADOW_ASSET_ID
exports.SHADOW_SLICE_CENTER = _webStyle.SHADOW_SLICE_CENTER
-- Parsers (for advanced users)
exports.parseColor = TS.import(script, script, "styles", "colorParser").parseColor
local _dimensionParser = TS.import(script, script, "styles", "dimensionParser")
exports.parseDimension = _dimensionParser.parseDimension
exports.parsePadding = _dimensionParser.parsePadding
exports.parseGradient = TS.import(script, script, "styles", "gradientParser").parseGradient
-- Named colors
exports.NAMED_COLORS = TS.import(script, script, "styles", "namedColors").NAMED_COLORS
-- Transitions
exports.transitions = TS.import(script, script, "styles", "transitions").transitions
-- Context
exports.ParentSizeContext = TS.import(script, script, "styles", "ParentSizeContext").ParentSizeContext
-- Base primitives
exports.Box = TS.import(script, script, "primitives", "Box").Box
exports.Text = TS.import(script, script, "primitives", "Text").Text
exports.Button = TS.import(script, script, "primitives", "Button").Button
exports.Image = TS.import(script, script, "primitives", "Image").Image
exports.Input = TS.import(script, script, "primitives", "Input").Input
exports.ScrollBox = TS.import(script, script, "primitives", "ScrollBox").ScrollBox
exports.ScreenContainer = TS.import(script, script, "primitives", "ScreenContainer").ScreenContainer
exports.InlineText = TS.import(script, script, "primitives", "InlineText").InlineText
local _HtmlElements = TS.import(script, script, "primitives", "HtmlElements")
exports.Div = _HtmlElements.Div
exports.Span = _HtmlElements.Span
exports.P = _HtmlElements.P
exports.H1 = _HtmlElements.H1
exports.H2 = _HtmlElements.H2
exports.H3 = _HtmlElements.H3
-- Inline image parser (for advanced users)
local _parseInlineImages = TS.import(script, script, "utils", "parseInlineImages")
exports.parseInlineImages = _parseInlineImages.parseInlineImages
exports.containsRichTextTags = _parseInlineImages.containsRichTextTags
-- Motion primitives
exports.MotionBox = TS.import(script, script, "primitives", "MotionBox").MotionBox
exports.MotionText = TS.import(script, script, "primitives", "MotionText").MotionText
exports.MotionButton = TS.import(script, script, "primitives", "MotionButton").MotionButton
exports.MotionImage = TS.import(script, script, "primitives", "MotionImage").MotionImage
exports.MotionUIScale = TS.import(script, script, "primitives", "MotionUIScale").MotionUIScale
-- Motion hooks
local _useVariantResolver = TS.import(script, script, "primitives", "useVariantResolver")
exports.useVariantResolver = _useVariantResolver.useVariantResolver
exports.isAnimatable = _useVariantResolver.isAnimatable
exports.usePercentageConstraints = TS.import(script, script, "primitives", "usePercentageConstraints").usePercentageConstraints
-- Logger (for consumers who want to configure logging level)
local _logger = TS.import(script, script, "logger")
exports.setLogLevel = _logger.setLogLevel
exports.LogLevel = _logger.LogLevel
-- Types
return exports
