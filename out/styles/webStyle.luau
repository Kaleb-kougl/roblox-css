-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
--[[
	*
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
	 
]]
local _dimensionParser = TS.import(script, script.Parent, "dimensionParser")
local parseDimension = _dimensionParser.parseDimension
local parsePadding = _dimensionParser.parsePadding
local parseColor = TS.import(script, script.Parent, "colorParser").parseColor
local _gradientParser = TS.import(script, script.Parent, "gradientParser")
local parseGradient = _gradientParser.parseGradient
local isGradientString = _gradientParser.isGradientString
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
-- Re-export for convenience
--[[
	*
	 * Branded WebStyleResult — the `_parsed` brand ensures only values produced by
	 * webStyle() are assignable. A plain `{ props, children }` object will NOT
	 * satisfy this type, catching accidental bypasses at compile time.
	 *
	 * - `props`:    Roblox instance properties to spread onto the host element
	 * - `children`: UI constraint elements to inject (<uicorner>, <uipadding>, etc.)
	 
]]
--* Helper to construct a branded WebStyleResult inside this module. 
local function makeWebStyleResult(props, children)
	return {
		props = props,
		children = children,
	}
end
--[[
	*
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
	 
]]
local JUSTIFY_MAP = {
	["flex-start"] = Enum.HorizontalAlignment.Left,
	center = Enum.HorizontalAlignment.Center,
	["flex-end"] = Enum.HorizontalAlignment.Right,
}
local ALIGN_MAP = {
	["flex-start"] = Enum.VerticalAlignment.Top,
	center = Enum.VerticalAlignment.Center,
	["flex-end"] = Enum.VerticalAlignment.Bottom,
}
local FONT_WEIGHT_MAP = {
	normal = Enum.FontWeight.Regular,
	bold = Enum.FontWeight.Bold,
	black = Enum.FontWeight.Heavy,
}
local FONT_FAMILY_MAP = {
	BuilderSans = "rbxasset://fonts/families/BuilderSans.json",
	Montserrat = "rbxasset://fonts/families/Montserrat.json",
}
local DEFAULT_FONT_FAMILY = "rbxasset://fonts/families/BuilderSans.json"
local TEXT_Y_ALIGN_MAP = {
	top = Enum.TextYAlignment.Top,
	center = Enum.TextYAlignment.Center,
	bottom = Enum.TextYAlignment.Bottom,
}
local AUTO_SIZE_MAP = {
	none = Enum.AutomaticSize.None,
	x = Enum.AutomaticSize.X,
	y = Enum.AutomaticSize.Y,
	xy = Enum.AutomaticSize.XY,
}
local SHADOW_SIZE_MAP = {
	sm = UDim2.new(1, 10, 1, 10),
	md = UDim2.new(1, 15, 1, 15),
	lg = UDim2.new(1, 20, 1, 20),
	xl = UDim2.new(1, 30, 1, 30),
	["2xl"] = UDim2.new(1, 40, 1, 40),
}
local SHADOW_OFFSET_MAP = {
	sm = 2,
	md = 4,
	lg = 6,
	xl = 10,
	["2xl"] = 15,
}
local SHADOW_SLICE_SCALE_MAP = {
	sm = 0.2,
	md = 0.3,
	lg = 0.4,
	xl = 0.6,
	["2xl"] = 0.8,
}
local SHADOW_OPACITY_MAP = {
	sm = 0.7,
	md = 0.6,
	lg = 0.5,
	xl = 0.45,
	["2xl"] = 0.4,
}
--[[
	*
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
	 
]]
local SHADOW_ASSET_ID = "rbxassetid://6015897843"
local SHADOW_SLICE_CENTER = Rect.new(47, 47, 450, 450)
--[[
	*
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
	 
]]
local function buildListLayout(style)
	local flexDir = style.flexDirection
	local fWrap = style.flexWrap
	if style.flexFlow ~= nil then
		local _flexFlow = style.flexFlow
		local flowParts = if type(_flexFlow) == "string" then string.split(style.flexFlow, " ") else {}
		for _, part in flowParts do
			if part == "row" or part == "column" then
				flexDir = flexDir or part
			end
			if part == "wrap" or part == "nowrap" then
				fWrap = fWrap or part
			end
		end
	end
	local fillDirection = if flexDir == "row" then Enum.FillDirection.Horizontal else Enum.FillDirection.Vertical
	local layoutProps = {
		FillDirection = fillDirection,
		SortOrder = Enum.SortOrder.LayoutOrder,
	}
	if fWrap == "wrap" then
		layoutProps.Wraps = true
	end
	local _condition = style.placeContent ~= nil
	if _condition then
		local _placeContent = style.placeContent
		_condition = type(_placeContent) == "string"
	end
	local pContent = if _condition then string.split(style.placeContent, " ") else nil
	local _condition_1 = style.justifyContent
	if _condition_1 == nil then
		local _result
		if pContent then
			local _condition_2 = pContent[2]
			if _condition_2 == nil then
				_condition_2 = pContent[1]
			end
			_result = _condition_2
		else
			_result = nil
		end
		_condition_1 = _result
	end
	local resolvedJustifyContent = _condition_1
	-- justifyContent → main-axis alignment
	if resolvedJustifyContent ~= nil then
		if resolvedJustifyContent == "space-between" or resolvedJustifyContent == "space-around" then
			local flexAlign = if resolvedJustifyContent == "space-between" then Enum.UIFlexAlignment.SpaceBetween else Enum.UIFlexAlignment.SpaceAround
			if flexDir == "row" then
				layoutProps.HorizontalFlex = flexAlign
			else
				layoutProps.VerticalFlex = flexAlign
			end
		else
			if flexDir == "row" then
				layoutProps.HorizontalAlignment = JUSTIFY_MAP[resolvedJustifyContent] or Enum.HorizontalAlignment.Left
			else
				layoutProps.VerticalAlignment = ALIGN_MAP[resolvedJustifyContent] or Enum.VerticalAlignment.Top
			end
		end
	end
	local _condition_2 = style.placeItems ~= nil
	if _condition_2 then
		local _placeItems = style.placeItems
		_condition_2 = type(_placeItems) == "string"
	end
	local pItems = if _condition_2 then string.split(style.placeItems, " ") else nil
	local resolvedAlignItems = style.alignItems or (if pItems then pItems[1] else nil)
	-- alignItems → cross-axis alignment
	if resolvedAlignItems ~= nil then
		if resolvedAlignItems == "stretch" then
			layoutProps.ItemLineAlignment = Enum.ItemLineAlignment.Stretch
		else
			if flexDir == "row" then
				layoutProps.VerticalAlignment = ALIGN_MAP[resolvedAlignItems] or Enum.VerticalAlignment.Top
			else
				layoutProps.HorizontalAlignment = JUSTIFY_MAP[resolvedAlignItems] or Enum.HorizontalAlignment.Left
			end
		end
	end
	-- gap → Padding (space between items)
	if style.gap ~= nil then
		layoutProps.Padding = parseDimension(style.gap) or UDim.new(0, 0)
	end
	layoutProps.key = "uilistlayout"
	return React.createElement("uilistlayout", layoutProps)
end
--[[
	*
	 * Builds a <uigridlayout> element from CSS grid properties.
	 *
	 * CSS → Roblox mapping:
	 *   gridTemplateColumns → CellSize.X
	 *   gridTemplateRows    → CellSize.Y
	 *   gap                 → CellPadding
	 *   justifyContent      → HorizontalAlignment
	 *   alignItems          → VerticalAlignment
	 
]]
local function buildGridLayout(style)
	local layoutProps = {
		SortOrder = Enum.SortOrder.LayoutOrder,
	}
	local flexDir = style.flexDirection
	if style.flexFlow ~= nil then
		local _flexFlow = style.flexFlow
		local flowParts = if type(_flexFlow) == "string" then string.split(style.flexFlow, " ") else {}
		for _, part in flowParts do
			if part == "row" or part == "column" then
				flexDir = flexDir or part
			end
		end
	end
	local fillDirection = if flexDir == "column" then Enum.FillDirection.Vertical else Enum.FillDirection.Horizontal
	layoutProps.FillDirection = fillDirection
	-- gap, rowGap, columnGap -> CellPadding
	local gapX = UDim.new(0, 0)
	local gapY = UDim.new(0, 0)
	local hasGap = false
	if style.gap ~= nil then
		local _gap = style.gap
		local gapParts = if type(_gap) == "string" then string.split(style.gap, " ") else { style.gap }
		gapX = parseDimension(gapParts[1]) or UDim.new(0, 0)
		gapY = if #gapParts > 1 then parseDimension(gapParts[2]) or gapX else gapX
		hasGap = true
	end
	if style.columnGap ~= nil then
		gapX = parseDimension(style.columnGap) or UDim.new(0, 0)
		hasGap = true
	end
	if style.rowGap ~= nil then
		gapY = parseDimension(style.rowGap) or UDim.new(0, 0)
		hasGap = true
	end
	if hasGap then
		layoutProps.CellPadding = UDim2.new(gapX, gapY)
	end
	-- CellSize
	local cellX = if style.gridTemplateColumns ~= nil then parseDimension(style.gridTemplateColumns) or UDim.new(0, 100) else UDim.new(0, 100)
	local cellY = if style.gridTemplateRows ~= nil then parseDimension(style.gridTemplateRows) or UDim.new(0, 100) else UDim.new(0, 100)
	layoutProps.CellSize = UDim2.new(cellX, cellY)
	local _condition = style.placeContent ~= nil
	if _condition then
		local _placeContent = style.placeContent
		_condition = type(_placeContent) == "string"
	end
	local pContent = if _condition then string.split(style.placeContent, " ") else nil
	local _condition_1 = style.justifyContent
	if _condition_1 == nil then
		local _result
		if pContent then
			local _condition_2 = pContent[2]
			if _condition_2 == nil then
				_condition_2 = pContent[1]
			end
			_result = _condition_2
		else
			_result = nil
		end
		_condition_1 = _result
	end
	local resolvedJustifyContent = _condition_1
	local _condition_2 = style.placeItems ~= nil
	if _condition_2 then
		local _placeItems = style.placeItems
		_condition_2 = type(_placeItems) == "string"
	end
	local pItems = if _condition_2 then string.split(style.placeItems, " ") else nil
	local resolvedAlignItems = style.alignItems or (if pItems then pItems[1] else nil)
	if resolvedJustifyContent ~= nil then
		layoutProps.HorizontalAlignment = JUSTIFY_MAP[resolvedJustifyContent] or Enum.HorizontalAlignment.Left
	end
	if resolvedAlignItems ~= nil then
		layoutProps.VerticalAlignment = ALIGN_MAP[resolvedAlignItems] or Enum.VerticalAlignment.Top
	end
	layoutProps.key = "uigridlayout"
	return React.createElement("uigridlayout", layoutProps)
end
--[[
	*
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
	 
]]
local function buildStroke(border, isTextStroke)
	if isTextStroke == nil then
		isTextStroke = false
	end
	local hasSpecifyingWord = false
	local specifyingWords = {
		["solid"] = true,
		["dashed"] = true,
		["dotted"] = true,
		["double"] = true,
		["groove"] = true,
		["ridge"] = true,
		["inset"] = true,
		["outset"] = true,
	}
	if not isTextStroke then
		for word in string.gmatch(border, "%a+") do
			local _arg0 = string.lower(word)
			if specifyingWords[_arg0] ~= nil then
				hasSpecifyingWord = true
				break
			end
		end
		if not hasSpecifyingWord then
			return nil
		end
	end
	local strokeProps = {}
	-- Extract thickness: find first space-separated token (e.g., "1px", "2")
	local thicknessStr, rest = string.match(border, "^(%S+)%s*(.*)$")
	if thicknessStr ~= nil then
		local dim = parseDimension(thicknessStr)
		if dim ~= nil then
			strokeProps.Thickness = dim.Offset
		end
	end
	-- After thickness, optionally skip CSS border-style keyword (solid, dashed, etc.)
	-- then treat everything remaining as the color string.
	if rest ~= nil and rest ~= "" then
		local remaining = rest
		-- Try to strip a leading style keyword (solid, dashed, dotted, double, groove, ridge, inset, outset, none)
		local afterStyle = string.match(remaining, "^%s*%a+%s+(.+)$")
		local colorStr = if afterStyle ~= nil then afterStyle else remaining
		local parsed = parseColor(colorStr)
		strokeProps.Color = parsed.color
	end
	strokeProps.ApplyStrokeMode = if isTextStroke then Enum.ApplyStrokeMode.Contextual else Enum.ApplyStrokeMode.Border
	strokeProps.key = if isTextStroke then "uitextstroke" else "uistroke"
	return React.createElement("uistroke", strokeProps)
end
--[[
	*
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
	 
]]
local function buildAbsolutePosition(style)
	local anchorX = 0
	local anchorY = 0
	local posX = UDim.new(0, 0)
	local posY = UDim.new(0, 0)
	-- Horizontal: left takes priority over right
	if style.left ~= nil then
		posX = parseDimension(style.left) or UDim.new(0, 0)
		anchorX = 0
	elseif style.right ~= nil then
		local dim = parseDimension(style.right) or UDim.new(0, 0)
		posX = UDim.new(1 - dim.Scale, -dim.Offset)
		anchorX = 1
	end
	-- Vertical: top takes priority over bottom
	if style.top ~= nil then
		posY = parseDimension(style.top) or UDim.new(0, 0)
		anchorY = 0
	elseif style.bottom ~= nil then
		local dim = parseDimension(style.bottom) or UDim.new(0, 0)
		posY = UDim.new(1 - dim.Scale, -dim.Offset)
		anchorY = 1
	end
	return {
		Position = UDim2.new(posX, posY),
		AnchorPoint = Vector2.new(anchorX, anchorY),
	}
end
--[[
	*
	 * Computes Roblox AnchorPoint (Vector2) from CSS transform-origin.
	 *
	 * CSS → Roblox mapping:
	 *   "center"        → Vector2(0.5, 0.5)
	 *   "top left"      → Vector2(0, 0)
	 *   "100% 50%"      → Vector2(1, 0.5)
	 
]]
local function parseTransformOrigin(origin)
	local _exp = string.split(origin, " ")
	-- ▼ ReadonlyArray.filter ▼
	local _newValue = {}
	local _callback = function(p)
		return p ~= ""
	end
	local _length = 0
	for _k, _v in _exp do
		if _callback(_v, _k - 1, _exp) == true then
			_length += 1
			_newValue[_length] = _v
		end
	end
	-- ▲ ReadonlyArray.filter ▲
	local parts = _newValue
	local x = 0.5
	local y = 0.5
	local parseVal = function(val)
		if val == "left" then
			return 0
		end
		if val == "right" then
			return 1
		end
		if val == "top" then
			return 0
		end
		if val == "bottom" then
			return 1
		end
		if val == "center" then
			return 0.5
		end
		local numStr = string.match(val, "^(%-?%d+%.?%d*)%%?$")
		if numStr ~= nil then
			local num = tonumber(numStr)
			if num ~= nil then
				local hasPercent = string.match(val, "%%$")
				if hasPercent ~= nil then
					return num / 100
				end
				return 0
			end
		end
		return 0.5
	end
	if #parts == 2 then
		local isYFirst = parts[1] == "top" or parts[1] == "bottom"
		local isXSecond = parts[2] == "left" or parts[2] == "right"
		if isYFirst or isXSecond then
			y = parseVal(parts[1])
			x = parseVal(parts[2])
		else
			x = parseVal(parts[1])
			y = parseVal(parts[2])
		end
	elseif #parts == 1 then
		local part = parts[1]
		if part == "top" or part == "bottom" then
			x = 0.5
			y = parseVal(part)
		else
			x = parseVal(part)
			y = 0.5
		end
	end
	return Vector2.new(x, y)
end
--[[
	*
	 * Checks if any constraint property (minWidth, maxWidth, minHeight, maxHeight)
	 * contains a percentage value.
	 
]]
local function hasPercentageScale(style)
	local _condition = style.minWidth ~= nil
	if _condition then
		local _result = parseDimension(style.minWidth)
		if _result ~= nil then
			_result = _result.Scale
		end
		local _condition_1 = _result
		if _condition_1 == nil then
			_condition_1 = 0
		end
		_condition = _condition_1 > 0
	end
	if _condition then
		return true
	end
	local _condition_1 = style.maxWidth ~= nil
	if _condition_1 then
		local _result = parseDimension(style.maxWidth)
		if _result ~= nil then
			_result = _result.Scale
		end
		local _condition_2 = _result
		if _condition_2 == nil then
			_condition_2 = 0
		end
		_condition_1 = _condition_2 > 0
	end
	if _condition_1 then
		return true
	end
	local _condition_2 = style.minHeight ~= nil
	if _condition_2 then
		local _result = parseDimension(style.minHeight)
		if _result ~= nil then
			_result = _result.Scale
		end
		local _condition_3 = _result
		if _condition_3 == nil then
			_condition_3 = 0
		end
		_condition_2 = _condition_3 > 0
	end
	if _condition_2 then
		return true
	end
	local _condition_3 = style.maxHeight ~= nil
	if _condition_3 then
		local _result = parseDimension(style.maxHeight)
		if _result ~= nil then
			_result = _result.Scale
		end
		local _condition_4 = _result
		if _condition_4 == nil then
			_condition_4 = 0
		end
		_condition_3 = _condition_4 > 0
	end
	if _condition_3 then
		return true
	end
	return false
end
--[[
	*
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
	 
]]
local function webStyle(style, hostText)
	local props = {}
	local children = {}
	-- Implementation order:
	-- 1. width / height → Size (UDim2)
	if style.width ~= nil or style.height ~= nil then
		local widthIsAuto = style.width == "auto"
		local heightIsAuto = style.height == "auto"
		local _result
		if widthIsAuto then
			_result = UDim.new(1, 0)
		else
			local _condition = style.width
			if _condition == nil then
				_condition = "100%"
			end
			local _condition_1 = parseDimension(_condition)
			if _condition_1 == nil then
				_condition_1 = UDim.new(1, 0)
			end
			_result = _condition_1
		end
		local _result_1
		if heightIsAuto then
			_result_1 = UDim.new(1, 0)
		else
			local _condition = style.height
			if _condition == nil then
				_condition = "100%"
			end
			local _condition_1 = parseDimension(_condition)
			if _condition_1 == nil then
				_condition_1 = UDim.new(1, 0)
			end
			_result_1 = _condition_1
		end
		props.Size = UDim2.new(_result, _result_1)
		-- Set AutomaticSize for auto dimensions (only if autoSize wasn't explicitly set)
		if (widthIsAuto or heightIsAuto) and style.autoSize == nil then
			if widthIsAuto and heightIsAuto then
				props.AutomaticSize = Enum.AutomaticSize.XY
			elseif widthIsAuto then
				props.AutomaticSize = Enum.AutomaticSize.X
			else
				props.AutomaticSize = Enum.AutomaticSize.Y
			end
		end
	end
	-- 2. backgroundColor → BackgroundColor3 + BackgroundTransparency
	if style.backgroundColor ~= nil then
		local parsed = parseColor(style.backgroundColor)
		props.BackgroundColor3 = parsed.color
		props.BackgroundTransparency = parsed.transparency
	end
	-- 2.5. background: "linear-gradient(...)" → inject <uigradient>
	if style.background ~= nil and isGradientString(style.background) then
		-- Extract pixel dimensions from style for corner keyword resolution
		local elemWidth
		local elemHeight
		local _condition = style.width ~= nil
		if _condition then
			local _width = style.width
			_condition = not (type(_width) == "string")
		end
		if _condition then
			elemWidth = style.width
		else
			local _width = style.width
			if type(_width) == "string" then
				local wDim = parseDimension(style.width)
				if wDim ~= nil and wDim.Scale == 0 then
					elemWidth = wDim.Offset
				end
			end
		end
		local _condition_1 = style.height ~= nil
		if _condition_1 then
			local _height = style.height
			_condition_1 = not (type(_height) == "string")
		end
		if _condition_1 then
			elemHeight = style.height
		else
			local _height = style.height
			if type(_height) == "string" then
				local hDim = parseDimension(style.height)
				if hDim ~= nil and hDim.Scale == 0 then
					elemHeight = hDim.Offset
				end
			end
		end
		local gradient = parseGradient(style.background, elemWidth, elemHeight)
		if gradient then
			-- UIGradient multiplies with BackgroundColor3, so default to white
			-- (the multiplicative identity) for CSS parity unless the user
			-- explicitly set backgroundColor.
			if style.backgroundColor == nil then
				props.BackgroundColor3 = Color3.new(1, 1, 1)
			end
			-- CSS gradients are opaque by default — per-pixel alpha from rgba()
			-- colors is already handled by the UIGradient's Transparency sequence.
			props.BackgroundTransparency = 0
			local gradientProps = {
				key = "uigradient",
				Color = gradient.colorSequence,
				Rotation = gradient.rotation,
			}
			if gradient.transparencySequence ~= nil then
				gradientProps.Transparency = gradient.transparencySequence
			end
			local _arg0 = React.createElement("uigradient", gradientProps)
			table.insert(children, _arg0)
		end
	end
	local hasGradient = style.background ~= nil and isGradientString(style.background)
	-- 3. opacity → BackgroundTransparency (INVERTED)
	-- Combine with existing background transparency
	if style.opacity ~= nil and not hasGradient then
		if style.backgroundColor == nil then
			-- CSS default background-color is 'transparent'. If opacity is applied without 
			-- an explicit background color, the background should remain fully transparent.
			props.BackgroundTransparency = 1
		else
			local _condition = (props.BackgroundTransparency)
			if _condition == nil then
				_condition = 0
			end
			local currentBgTrans = _condition
			props.BackgroundTransparency = 1 - ((1 - currentBgTrans) * style.opacity)
		end
	end
	-- 4. borderRadius → inject <uicorner>
	if style.borderRadius ~= nil then
		local _borderRadius = style.borderRadius
		local firstRadius = if type(_borderRadius) == "string" then string.split(style.borderRadius, " ")[1] else style.borderRadius
		local radius = parseDimension(firstRadius)
		local _arg0 = React.createElement("uicorner", {
			key = "uicorner",
			CornerRadius = radius,
		})
		table.insert(children, _arg0)
	end
	-- 5. padding → inject <uipadding>
	if style.padding ~= nil or style.paddingTop ~= nil or style.paddingRight ~= nil or style.paddingBottom ~= nil or style.paddingLeft ~= nil or style.paddingInline ~= nil or style.paddingBlock ~= nil then
		-- Start from shorthand, then let individual sides override
		local base = if style.padding ~= nil then parsePadding(style.padding) else parsePadding(0)
		-- Logical properties override base padding
		local padInline = if style.paddingInline ~= nil then parsePadding(style.paddingInline) else nil
		local padBlock = if style.paddingBlock ~= nil then parsePadding(style.paddingBlock) else nil
		local _result = padBlock
		if _result ~= nil then
			_result = _result.top
		end
		local _condition = _result
		if _condition == nil then
			_condition = base.top
		end
		local baseTop = _condition
		local _result_1 = padBlock
		if _result_1 ~= nil then
			_result_1 = _result_1.bottom
		end
		local _condition_1 = _result_1
		if _condition_1 == nil then
			_condition_1 = base.bottom
		end
		local baseBottom = _condition_1
		local _result_2 = padInline
		if _result_2 ~= nil then
			_result_2 = _result_2.left
		end
		local _condition_2 = _result_2
		if _condition_2 == nil then
			_condition_2 = base.left
		end
		local baseLeft = _condition_2
		local _result_3 = padInline
		if _result_3 ~= nil then
			_result_3 = _result_3.right
		end
		local _condition_3 = _result_3
		if _condition_3 == nil then
			_condition_3 = base.right
		end
		local baseRight = _condition_3
		local _arg0 = React.createElement("uipadding", {
			key = "uipadding",
			PaddingTop = if style.paddingTop ~= nil then parseDimension(style.paddingTop) else baseTop,
			PaddingRight = if style.paddingRight ~= nil then parseDimension(style.paddingRight) else baseRight,
			PaddingBottom = if style.paddingBottom ~= nil then parseDimension(style.paddingBottom) else baseBottom,
			PaddingLeft = if style.paddingLeft ~= nil then parseDimension(style.paddingLeft) else baseLeft,
		})
		table.insert(children, _arg0)
	end
	-- 6. display: "flex" | "grid" | "none" → inject <uilistlayout> / <uigridlayout> or set Visible
	if style.display == "flex" then
		local _arg0 = buildListLayout(style)
		table.insert(children, _arg0)
	elseif style.display == "grid" then
		local _arg0 = buildGridLayout(style)
		table.insert(children, _arg0)
	elseif style.display == "none" then
		props.Visible = false
	end
	-- visibility → Visible (convenience alias, coexists with display: none)
	if style.visibility ~= nil then
		props.Visible = style.visibility ~= "hidden"
	end
	-- 7. border / outline → inject <uistroke>
	local _condition = style.border
	if _condition == nil then
		_condition = style.outline
	end
	local activeBorder = _condition
	if activeBorder ~= nil then
		local stroke = buildStroke(activeBorder)
		if stroke ~= nil then
			table.insert(children, stroke)
		end
	end
	-- textStroke → inject <uistroke> with Contextual mode
	if style.textStroke ~= nil then
		local stroke = buildStroke(style.textStroke, true)
		if stroke ~= nil then
			table.insert(children, stroke)
		end
	end
	-- backgroundImage → inject <imagelabel> underlay
	if style.backgroundImage ~= nil then
		local url = string.match(style.backgroundImage, [[url%([\"']?(.-)[\"']?%)]])
		if url ~= nil then
			local cleanUrl = url
			local bgScale = Enum.ScaleType.Stretch
			if style.backgroundSize == "cover" then
				bgScale = Enum.ScaleType.Crop
			elseif style.backgroundSize == "contain" then
				bgScale = Enum.ScaleType.Fit
			end
			local _arg0 = React.createElement("imagelabel", {
				key = "uibackgroundimage",
				Image = cleanUrl,
				ZIndex = -1,
				Size = UDim2.fromScale(1, 1),
				AnchorPoint = Vector2.new(0.5, 0.5),
				Position = UDim2.fromScale(0.5, 0.5),
				BackgroundTransparency = 1,
				ScaleType = bgScale,
			})
			table.insert(children, _arg0)
		end
	end
	-- 8. aspectRatio → inject <uiaspectratioconstraint>
	if style.aspectRatio ~= nil then
		local _arg0 = React.createElement("uiaspectratioconstraint", {
			key = "uiaspectratioconstraint",
			AspectRatio = style.aspectRatio,
		})
		table.insert(children, _arg0)
	end
	-- 9. position: "absolute" → Position + AnchorPoint
	if style.position == "absolute" then
		local abs = buildAbsolutePosition(style)
		props.Position = abs.Position
		props.AnchorPoint = abs.AnchorPoint
	end
	-- transformOrigin → overrides AnchorPoint
	if style.transformOrigin ~= nil then
		props.AnchorPoint = parseTransformOrigin(style.transformOrigin)
	end
	-- 10. zIndex → ZIndex
	if style.zIndex ~= nil then
		props.ZIndex = style.zIndex
	end
	if style.order ~= nil or style.layoutOrder ~= nil then
		local _condition_1 = style.order
		if _condition_1 == nil then
			_condition_1 = style.layoutOrder
		end
		props.LayoutOrder = _condition_1
	end
	if style.rotation ~= nil then
		props.Rotation = style.rotation
	end
	-- autoSize (standalone) — explicit autoSize takes precedence over width/height "auto"
	if style.autoSize ~= nil then
		props.AutomaticSize = AUTO_SIZE_MAP[style.autoSize] or Enum.AutomaticSize.None
	end
	-- 11. Size Constraints → inject <uisizeconstraint>
	if not hasPercentageScale(style) and (style.minWidth ~= nil or style.maxWidth ~= nil or style.minHeight ~= nil or style.maxHeight ~= nil) then
		local minW = if style.minWidth ~= nil then (parseDimension(style.minWidth) or UDim.new(0, 0)).Offset else 0
		local minH = if style.minHeight ~= nil then (parseDimension(style.minHeight) or UDim.new(0, 0)).Offset else 0
		local maxW = if style.maxWidth ~= nil then (parseDimension(style.maxWidth) or UDim.new(0, 0)).Offset else math.huge
		local maxH = if style.maxHeight ~= nil then (parseDimension(style.maxHeight) or UDim.new(0, 0)).Offset else math.huge
		local _arg0 = React.createElement("uisizeconstraint", {
			key = "uisizeconstraint",
			MinSize = Vector2.new(minW, minH),
			MaxSize = Vector2.new(maxW, maxH),
		})
		table.insert(children, _arg0)
	end
	-- 12. Typography (color, fontSize, textAlign, whiteSpace)
	if style.color ~= nil then
		local parsedColor = parseColor(style.color)
		props.TextColor3 = parsedColor.color
		if parsedColor.transparent then
			props.TextTransparency = 1
		end
	end
	if style.fontSize ~= nil then
		props.TextSize = style.fontSize
	end
	if style.textAlign ~= nil then
		if style.textAlign == "left" then
			props.TextXAlignment = Enum.TextXAlignment.Left
		elseif style.textAlign == "center" then
			props.TextXAlignment = Enum.TextXAlignment.Center
		elseif style.textAlign == "right" then
			props.TextXAlignment = Enum.TextXAlignment.Right
		end
	end
	if style.textVerticalAlign ~= nil then
		if style.textVerticalAlign == "top" then
			props.TextYAlignment = Enum.TextYAlignment.Top
		elseif style.textVerticalAlign == "center" then
			props.TextYAlignment = Enum.TextYAlignment.Center
		elseif style.textVerticalAlign == "bottom" then
			props.TextYAlignment = Enum.TextYAlignment.Bottom
		end
	end
	if style.whiteSpace ~= nil then
		if style.whiteSpace == "normal" or style.whiteSpace == "pre-wrap" or style.whiteSpace == "pre-line" then
			props.TextWrapped = true
		elseif style.whiteSpace == "nowrap" then
			props.TextWrapped = false
		end
	end
	if style.wordBreak ~= nil then
		if style.wordBreak == "normal" or style.wordBreak == "break-word" or style.wordBreak == "break-all" then
			props.TextWrapped = true
		elseif style.wordBreak == "keep-all" then
			props.TextWrapped = false
		end
	end
	if style.lineHeight ~= nil then
		props.LineHeight = style.lineHeight
	end
	if style.textOverflow == "ellipsis" then
		props.TextTruncate = Enum.TextTruncate.AtEnd
	end
	if style.richText == true then
		props.RichText = true
	end
	if style.fontFamily ~= nil or style.fontWeight ~= nil or style.fontStyle ~= nil then
		local _condition_1 = style.fontFamily
		if _condition_1 == nil then
			_condition_1 = "BuilderSans"
		end
		local familyStr = _condition_1
		local _condition_2 = FONT_FAMILY_MAP[familyStr]
		if _condition_2 == nil then
			_condition_2 = DEFAULT_FONT_FAMILY
		end
		local familyUri = _condition_2
		local weightStr = if style.fontWeight ~= nil then tostring(style.fontWeight) else "normal"
		local weightEnum = FONT_WEIGHT_MAP[weightStr] or Enum.FontWeight.Regular
		local fontStyleEnum = if style.fontStyle == "italic" then Enum.FontStyle.Italic else Enum.FontStyle.Normal
		props.FontFace = Font.new(familyUri, weightEnum, fontStyleEnum)
	end
	if style.textDecoration ~= nil and style.textDecoration ~= "none" then
		props.RichText = true
		props._textDecoration = style.textDecoration
	end
	if style.textTransform ~= nil and style.textTransform ~= "none" then
		props._textTransform = style.textTransform
	end
	-- 13. overflow → ClipsDescendants
	if style.overflow ~= nil then
		if style.overflow == "hidden" then
			props.ClipsDescendants = true
		elseif style.overflow == "visible" then
			props.ClipsDescendants = false
		end
	end
	if style.objectFit ~= nil then
		if style.objectFit == "cover" then
			props.ScaleType = Enum.ScaleType.Crop
		elseif style.objectFit == "contain" then
			props.ScaleType = Enum.ScaleType.Fit
		elseif style.objectFit == "fill" then
			props.ScaleType = Enum.ScaleType.Stretch
		end
	end
	-- 14. pointerEvents → Interactable / Active
	if style.pointerEvents == "none" then
		props.Interactable = false
		props.Active = false
	end
	-- userSelect → TextSelectable
	if style.userSelect ~= nil then
		if style.userSelect == "text" or style.userSelect == "auto" then
			props.TextSelectable = true
		elseif style.userSelect == "none" then
			props.TextSelectable = false
		end
	end
	-- 15. boxShadow → inject <imagelabel>
	if style.boxShadow ~= nil and style.boxShadow ~= "none" then
		local shadowSize = SHADOW_SIZE_MAP[style.boxShadow] or UDim2.new(1, 20, 1, 20)
		local _condition_1 = SHADOW_OPACITY_MAP[style.boxShadow]
		if _condition_1 == nil then
			_condition_1 = 0.5
		end
		local shadowTransparency = _condition_1
		local _condition_2 = SHADOW_OFFSET_MAP[style.boxShadow]
		if _condition_2 == nil then
			_condition_2 = 6
		end
		local shadowOffset = _condition_2
		local _condition_3 = SHADOW_SLICE_SCALE_MAP[style.boxShadow]
		if _condition_3 == nil then
			_condition_3 = 0.4
		end
		local sliceScale = _condition_3
		local _arg0 = React.createElement("imagelabel", {
			key = "box-shadow",
			Image = SHADOW_ASSET_ID,
			ScaleType = Enum.ScaleType.Slice,
			SliceCenter = SHADOW_SLICE_CENTER,
			SliceScale = sliceScale,
			BackgroundTransparency = 1,
			ImageColor3 = Color3.new(0, 0, 0),
			ImageTransparency = shadowTransparency,
			ZIndex = -1,
			AnchorPoint = Vector2.new(0.5, 0.5),
			Position = UDim2.new(0.5, 0, 0.5, shadowOffset),
			Size = shadowSize,
		})
		table.insert(children, _arg0)
	end
	-- 16. flexGrow / flexShrink / alignSelf → inject <uiflexitem>
	local _condition_1 = style.flexGrow
	if _condition_1 == nil then
		_condition_1 = 0
	end
	local grow = _condition_1
	local _condition_2 = style.flexShrink
	if _condition_2 == nil then
		_condition_2 = 0
	end
	local shrink = _condition_2
	if style.flex ~= nil then
		if style.flex == "auto" then
			grow = 1
			shrink = 1
		elseif style.flex == "none" then
			grow = 0
			shrink = 0
		else
			local _flex = style.flex
			if type(_flex) == "number" then
				grow = style.flex
				shrink = style.flex
			else
				local _flex_1 = style.flex
				if type(_flex_1) == "string" then
					local parsed = tonumber(style.flex)
					if parsed ~= nil then
						grow = parsed
						shrink = parsed
					end
				end
			end
		end
	end
	local hasFlexItem = grow > 0 or shrink > 0 or (style.alignSelf ~= nil and style.alignSelf ~= "auto")
	if hasFlexItem then
		if style.display == "grid" then
			warn("[webStyle] flexGrow/flexShrink/alignSelf have no effect inside display: 'grid'. UIFlexItem only works with UIListLayout (display: 'flex').")
		end
		local flexProps = {
			key = "uiflexitem",
		}
		if grow > 0 or shrink > 0 then
			flexProps.FlexMode = Enum.UIFlexMode.Custom
			flexProps.GrowRatio = grow
			flexProps.ShrinkRatio = shrink
		end
		if style.alignSelf ~= nil and style.alignSelf ~= "auto" then
			if style.alignSelf == "flex-start" then
				flexProps.ItemLineAlignment = Enum.ItemLineAlignment.Start
			elseif style.alignSelf == "flex-end" then
				flexProps.ItemLineAlignment = Enum.ItemLineAlignment.End
			elseif style.alignSelf == "center" then
				flexProps.ItemLineAlignment = Enum.ItemLineAlignment.Center
			elseif style.alignSelf == "stretch" then
				flexProps.ItemLineAlignment = Enum.ItemLineAlignment.Stretch
			end
		end
		local _arg0 = React.createElement("uiflexitem", flexProps)
		table.insert(children, _arg0)
	end
	-- 17. textShadow → inject duplicate <textlabel> with black <uigradient>
	if style.textShadow ~= nil and hostText ~= nil then
		local _exp = string.split(style.textShadow, " ")
		-- ▼ ReadonlyArray.filter ▼
		local _newValue = {}
		local _callback = function(p)
			return p ~= ""
		end
		local _length = 0
		for _k, _v in _exp do
			if _callback(_v, _k - 1, _exp) == true then
				_length += 1
				_newValue[_length] = _v
			end
		end
		-- ▲ ReadonlyArray.filter ▲
		local parts = _newValue
		local dimParts = {}
		local colorParts = {}
		for _, p in parts do
			local _value = (string.match(p, "^%-?%d"))
			if _value ~= 0 and _value == _value and _value ~= "" and _value then
				table.insert(dimParts, p)
			else
				table.insert(colorParts, p)
			end
		end
		local _condition_3 = dimParts[1]
		if _condition_3 == nil then
			_condition_3 = "0"
		end
		local xStr = _condition_3
		local _condition_4 = dimParts[2]
		if _condition_4 == nil then
			_condition_4 = xStr
		end
		local yStr = _condition_4
		local _result = parseDimension(xStr)
		if _result ~= nil then
			_result = _result.Offset
		end
		local _condition_5 = _result
		if _condition_5 == nil then
			_condition_5 = 0
		end
		local xOffset = _condition_5
		local _result_1 = parseDimension(yStr)
		if _result_1 ~= nil then
			_result_1 = _result_1.Offset
		end
		local _condition_6 = _result_1
		if _condition_6 == nil then
			_condition_6 = 0
		end
		local yOffset = _condition_6
		local colorStr = table.concat(colorParts, " ")
		local shadowColor = if colorStr ~= "" then parseColor(colorStr) else parseColor("rgba(0,0,0,0.5)")
		local _arg0 = React.createElement("textlabel", {
			key = "textShadow",
			Text = hostText,
			Size = UDim2.new(1, 0, 1, 0),
			Position = UDim2.new(0, xOffset, 0, yOffset),
			BackgroundTransparency = 1,
			TextTransparency = shadowColor.transparency,
			TextColor3 = shadowColor.color,
			ZIndex = -1,
			TextSize = props.TextSize,
			FontFace = props.FontFace,
			TextXAlignment = props.TextXAlignment,
			TextYAlignment = props.TextYAlignment,
			TextWrapped = props.TextWrapped,
			LineHeight = props.LineHeight,
			TextTruncate = props.TextTruncate,
			RichText = props.RichText,
		}, React.createElement("uigradient", {
			key = "shadowGradient",
			Color = ColorSequence.new(Color3.new(0, 0, 0)),
		}))
		table.insert(children, _arg0)
	end
	return makeWebStyleResult(props, children)
end
return {
	webStyle = webStyle,
	SHADOW_ASSET_ID = SHADOW_ASSET_ID,
	SHADOW_SLICE_CENTER = SHADOW_SLICE_CENTER,
}
