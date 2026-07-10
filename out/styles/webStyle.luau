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
local SORT_ORDER_MAP = {
	["layout-order"] = Enum.SortOrder.LayoutOrder,
	name = Enum.SortOrder.Name,
}
local FLEX_ALIGNMENT_MAP = {
	["space-around"] = Enum.UIFlexAlignment.SpaceAround,
	["space-between"] = Enum.UIFlexAlignment.SpaceBetween,
	["space-evenly"] = Enum.UIFlexAlignment.SpaceEvenly,
}
local START_CORNER_MAP = {
	["top-left"] = Enum.StartCorner.TopLeft,
	["top-right"] = Enum.StartCorner.TopRight,
	["bottom-left"] = Enum.StartCorner.BottomLeft,
	["bottom-right"] = Enum.StartCorner.BottomRight,
}
local TABLE_MAJOR_AXIS_MAP = {
	["row-major"] = Enum.TableMajorAxis.RowMajor,
	["column-major"] = Enum.TableMajorAxis.ColumnMajor,
}
local EASING_STYLE_MAP = {
	linear = Enum.EasingStyle.Linear,
	sine = Enum.EasingStyle.Sine,
	back = Enum.EasingStyle.Back,
	quad = Enum.EasingStyle.Quad,
	quart = Enum.EasingStyle.Quart,
	quint = Enum.EasingStyle.Quint,
	bounce = Enum.EasingStyle.Bounce,
	elastic = Enum.EasingStyle.Elastic,
	exponential = Enum.EasingStyle.Exponential,
	circular = Enum.EasingStyle.Circular,
	cubic = Enum.EasingStyle.Cubic,
}
local EASING_DIRECTION_MAP = {
	["in"] = Enum.EasingDirection.In,
	out = Enum.EasingDirection.Out,
	["in-out"] = Enum.EasingDirection.InOut,
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
local SCROLL_BAR_INSET_MAP = {
	none = Enum.ScrollBarInset.None,
	scrollbar = Enum.ScrollBarInset.ScrollBar,
	["scroll-bar"] = Enum.ScrollBarInset.ScrollBar,
	always = Enum.ScrollBarInset.Always,
}
local ELASTIC_BEHAVIOR_MAP = {
	["when-scrollable"] = Enum.ElasticBehavior.WhenScrollable,
	always = Enum.ElasticBehavior.Always,
	never = Enum.ElasticBehavior.Never,
}
local VERTICAL_SCROLL_BAR_POSITION_MAP = {
	left = Enum.VerticalScrollBarPosition.Left,
	right = Enum.VerticalScrollBarPosition.Right,
}
local UI_DRAG_STYLE_MAP = {
	["translate-plane"] = Enum.UIDragDetectorDragStyle.TranslatePlane,
	["translate-line"] = Enum.UIDragDetectorDragStyle.TranslateLine,
	rotate = Enum.UIDragDetectorDragStyle.Rotate,
	scriptable = Enum.UIDragDetectorDragStyle.Scriptable,
}
local UI_DRAG_RESPONSE_STYLE_MAP = {
	offset = Enum.UIDragDetectorResponseStyle.Offset,
	scale = Enum.UIDragDetectorResponseStyle.Scale,
	["custom-offset"] = Enum.UIDragDetectorResponseStyle.CustomOffset,
	["custom-scale"] = Enum.UIDragDetectorResponseStyle.CustomScale,
}
local UI_DRAG_BOUNDING_BEHAVIOR_MAP = {
	automatic = Enum.UIDragDetectorBoundingBehavior.Automatic,
	["entire-object"] = Enum.UIDragDetectorBoundingBehavior.EntireObject,
	["hit-point"] = Enum.UIDragDetectorBoundingBehavior.HitPoint,
}
local UI_DRAG_SPEED_AXIS_MAPPING_MAP = {
	xy = Enum.UIDragSpeedAxisMapping.XY,
	xx = Enum.UIDragSpeedAxisMapping.XX,
	yy = Enum.UIDragSpeedAxisMapping.YY,
}
local DRAG_STYLE_MAP = {
	["translate-line"] = Enum.DragDetectorDragStyle.TranslateLine,
	["translate-plane"] = Enum.DragDetectorDragStyle.TranslatePlane,
	["translate-plane-or-line"] = Enum.DragDetectorDragStyle.TranslatePlaneOrLine,
	["translate-line-or-plane"] = Enum.DragDetectorDragStyle.TranslateLineOrPlane,
	["translate-view-plane"] = Enum.DragDetectorDragStyle.TranslateViewPlane,
	["rotate-axis"] = Enum.DragDetectorDragStyle.RotateAxis,
	["rotate-trackball"] = Enum.DragDetectorDragStyle.RotateTrackball,
	["best-for-device"] = Enum.DragDetectorDragStyle.BestForDevice,
	scriptable = Enum.DragDetectorDragStyle.Scriptable,
}
local DRAG_RESPONSE_STYLE_MAP = {
	geometric = Enum.DragDetectorResponseStyle.Geometric,
	physical = Enum.DragDetectorResponseStyle.Physical,
	custom = Enum.DragDetectorResponseStyle.Custom,
}
local DRAG_PERMISSION_POLICY_MAP = {
	nobody = Enum.DragDetectorPermissionPolicy.Nobody,
	everybody = Enum.DragDetectorPermissionPolicy.Everybody,
	scriptable = Enum.DragDetectorPermissionPolicy.Scriptable,
}
local PROXIMITY_PROMPT_EXCLUSIVITY_MAP = {
	["one-per-button"] = Enum.ProximityPromptExclusivity.OnePerButton,
	["one-globally"] = Enum.ProximityPromptExclusivity.OneGlobally,
	["always-show"] = Enum.ProximityPromptExclusivity.AlwaysShow,
}
local STROKE_SIZING_MODE_MAP = {
	fixed = Enum.StrokeSizingMode.FixedSize,
	scaled = Enum.StrokeSizingMode.ScaledSize,
}
local BORDER_STROKE_POSITION_MAP = {
	inner = Enum.BorderStrokePosition.Inner,
	center = Enum.BorderStrokePosition.Center,
	outer = Enum.BorderStrokePosition.Outer,
}
local LINE_JOIN_MODE_MAP = {
	round = Enum.LineJoinMode.Round,
	bevel = Enum.LineJoinMode.Bevel,
	miter = Enum.LineJoinMode.Miter,
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
local function splitOutsideParens(input, separator)
	if separator == nil then
		separator = " "
	end
	local parts = {}
	local current = ""
	local parenLevel = 0
	for i = 1, #input do
		local _input = input
		local _i = i
		local _i_1 = i
		local char = string.sub(_input, _i, _i_1)
		if char == "(" then
			parenLevel += 1
		elseif char == ")" then
			parenLevel -= 1
		end
		local isSeparator = if separator == " " then (char == " " or char == "\t") else char == separator
		if isSeparator and parenLevel == 0 then
			if current ~= "" then
				local _current = current
				table.insert(parts, _current)
				current = ""
			end
			continue
		end
		current ..= char
	end
	if current ~= "" then
		local _current = current
		table.insert(parts, _current)
	end
	return parts
end
local function parseVector2(value)
	if value == nil then
		return nil
	end
	local _value = value
	if typeof(_value) == "Vector2" then
		return value
	end
	local _exp = splitOutsideParens(value)
	-- ▼ ReadonlyArray.filter ▼
	local _newValue = {}
	local _callback = function(part)
		return part ~= ""
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
	local x = tonumber(parts[1])
	local _condition = parts[2]
	if _condition == nil then
		_condition = parts[1]
	end
	local y = tonumber(_condition)
	if x == nil or y == nil then
		return nil
	end
	return Vector2.new(x, y)
end
local function parseVector3(value)
	if value == nil then
		return nil
	end
	local _value = value
	if typeof(_value) == "Vector3" then
		return value
	end
	local _exp = splitOutsideParens(value)
	-- ▼ ReadonlyArray.filter ▼
	local _newValue = {}
	local _callback = function(part)
		return part ~= ""
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
	local x = tonumber(parts[1])
	local y = tonumber(parts[2])
	local z = tonumber(parts[3])
	if x == nil or y == nil or z == nil then
		return nil
	end
	return Vector3.new(x, y, z)
end
local function parseUDim2Pair(value, fallbackX, fallbackY)
	if fallbackX == nil then
		fallbackX = UDim.new(0, 0)
	end
	if fallbackY == nil then
		fallbackY = fallbackX
	end
	if value == nil or value == "" then
		return UDim2.new(fallbackX, fallbackY)
	end
	local _exp = splitOutsideParens(value)
	-- ▼ ReadonlyArray.filter ▼
	local _newValue = {}
	local _callback = function(part)
		return part ~= ""
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
	local x = parseDimension(parts[1]) or fallbackX
	local _condition = parts[2]
	if _condition == nil then
		_condition = parts[1]
	end
	local _condition_1 = parseDimension(_condition)
	if _condition_1 == nil then
		_condition_1 = fallbackY
	end
	local y = _condition_1
	return UDim2.new(x, y)
end
local function parseUDim2Value(value)
	if value == nil then
		return nil
	end
	local _value = value
	if typeof(_value) == "UDim2" then
		return value
	end
	return parseUDim2Pair(value)
end
local function parseKeyCode(value)
	if value == nil then
		return nil
	end
	local _value = value
	if not (type(_value) == "string") then
		return value
	end
	local keyCodes = Enum.KeyCode
	return keyCodes[value] or keyCodes[string.upper(value)]
end
local function isDimensionToken(value)
	local numeric = string.match(value, "^%-?[%d%.]+$")
	local withUnit = string.match(value, "^%-?[%d%.]+px$")
	local withPercent = string.match(value, "^%-?[%d%.]+%%$")
	local withViewport = string.match(value, "^%-?[%d%.]+v[hw]$")
	return numeric ~= nil or withUnit ~= nil or withPercent ~= nil or withViewport ~= nil or string.sub(value, 1, 5) == "calc("
end
local function applyGradientProps(gradientProps, offset, rotation)
	if offset ~= nil then
		local parsedOffset = parseVector2(offset)
		if parsedOffset ~= nil then
			gradientProps.Offset = parsedOffset
		end
	end
	if rotation ~= nil then
		gradientProps.Rotation = rotation
	end
end
local function buildGradientElement(key, input, offset, rotation)
	if not isGradientString(input) then
		return nil
	end
	local gradient = parseGradient(input)
	if gradient == nil then
		return nil
	end
	local _object = {
		key = key,
		Color = gradient.colorSequence,
	}
	local _left = "Rotation"
	local _condition = rotation
	if _condition == nil then
		_condition = gradient.rotation
	end
	_object[_left] = _condition
	local gradientProps = _object
	if gradient.transparencySequence ~= nil then
		gradientProps.Transparency = gradient.transparencySequence
	end
	applyGradientProps(gradientProps, offset, rotation)
	return React.createElement("uigradient", gradientProps)
end
local function resolveSortOrder(sortOrder)
	local _condition = sortOrder ~= nil
	if _condition then
		local _sortOrder = sortOrder
		_condition = not (type(_sortOrder) == "string")
	end
	if _condition then
		return sortOrder
	end
	return if sortOrder ~= nil then (SORT_ORDER_MAP[sortOrder] or Enum.SortOrder.LayoutOrder) else Enum.SortOrder.LayoutOrder
end
local function resolveFillDirection(direction, defaultDirection)
	if defaultDirection == nil then
		defaultDirection = Enum.FillDirection.Vertical
	end
	if direction == "row" then
		return Enum.FillDirection.Horizontal
	end
	if direction == "column" then
		return Enum.FillDirection.Vertical
	end
	return defaultDirection
end
local function parseLayoutPadding2D(value, fallback)
	local _condition = value
	if _condition == nil then
		_condition = fallback
	end
	local source = _condition
	if source == nil then
		return nil
	end
	local parts = if type(source) == "string" then string.split(source, " ") else { source }
	local x = parseDimension(parts[1]) or UDim.new(0, 0)
	local y = if #parts > 1 then (parseDimension(parts[2]) or x) else x
	return UDim2.new(x, y)
end
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
	local fillDirection = resolveFillDirection(flexDir)
	local layoutProps = {
		FillDirection = fillDirection,
		SortOrder = resolveSortOrder(style.sortOrder),
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
		local flexAlign = FLEX_ALIGNMENT_MAP[resolvedJustifyContent]
		if flexAlign ~= nil then
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
		SortOrder = resolveSortOrder(style.sortOrder),
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
	local fillDirection = resolveFillDirection(flexDir, Enum.FillDirection.Horizontal)
	layoutProps.FillDirection = fillDirection
	if style.gridMaxCells ~= nil then
		layoutProps.FillDirectionMaxCells = style.gridMaxCells
	end
	if style.gridStartCorner ~= nil then
		local _gridStartCorner = style.gridStartCorner
		layoutProps.StartCorner = if type(_gridStartCorner) == "string" then (START_CORNER_MAP[style.gridStartCorner] or Enum.StartCorner.TopLeft) else style.gridStartCorner
	end
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
local function buildTableLayout(style)
	local layoutProps = {
		key = "uitablelayout",
		FillDirection = resolveFillDirection(style.tableFillDirection or style.flexDirection),
		SortOrder = resolveSortOrder(style.sortOrder),
	}
	if style.tableMajorAxis ~= nil then
		local _tableMajorAxis = style.tableMajorAxis
		layoutProps.MajorAxis = if type(_tableMajorAxis) == "string" then (TABLE_MAJOR_AXIS_MAP[style.tableMajorAxis] or Enum.TableMajorAxis.RowMajor) else style.tableMajorAxis
	end
	if style.tableFillEmptySpaceColumns ~= nil then
		layoutProps.FillEmptySpaceColumns = style.tableFillEmptySpaceColumns
	end
	if style.tableFillEmptySpaceRows ~= nil then
		layoutProps.FillEmptySpaceRows = style.tableFillEmptySpaceRows
	end
	local padding = parseLayoutPadding2D(style.tablePadding, style.gap)
	if padding ~= nil then
		layoutProps.Padding = padding
	end
	return React.createElement("uitablelayout", layoutProps)
end
local function buildPageLayout(style)
	local layoutProps = {
		key = "uipagelayout",
		FillDirection = resolveFillDirection(style.pageFillDirection or style.flexDirection, Enum.FillDirection.Horizontal),
		SortOrder = resolveSortOrder(style.sortOrder),
	}
	local pagePadding = if style.pagePadding ~= nil then parseDimension(style.pagePadding) else nil
	if pagePadding ~= nil then
		layoutProps.Padding = pagePadding
	end
	if style.pageAnimated ~= nil then
		layoutProps.Animated = style.pageAnimated
	end
	if style.pageCircular ~= nil then
		layoutProps.Circular = style.pageCircular
	end
	if style.pageTweenTime ~= nil then
		layoutProps.TweenTime = style.pageTweenTime
	end
	if style.pageEasingStyle ~= nil then
		local _pageEasingStyle = style.pageEasingStyle
		layoutProps.EasingStyle = if type(_pageEasingStyle) == "string" then (EASING_STYLE_MAP[style.pageEasingStyle] or Enum.EasingStyle.Quad) else style.pageEasingStyle
	end
	if style.pageEasingDirection ~= nil then
		local _pageEasingDirection = style.pageEasingDirection
		layoutProps.EasingDirection = if type(_pageEasingDirection) == "string" then (EASING_DIRECTION_MAP[style.pageEasingDirection] or Enum.EasingDirection.Out) else style.pageEasingDirection
	end
	if style.pageGamepadInputEnabled ~= nil then
		layoutProps.GamepadInputEnabled = style.pageGamepadInputEnabled
	end
	if style.pageScrollWheelInputEnabled ~= nil then
		layoutProps.ScrollWheelInputEnabled = style.pageScrollWheelInputEnabled
	end
	if style.pageTouchInputEnabled ~= nil then
		layoutProps.TouchInputEnabled = style.pageTouchInputEnabled
	end
	return React.createElement("uipagelayout", layoutProps)
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
local function buildStroke(border, options)
	if options == nil then
		options = {}
	end
	local isTextStroke = options.isTextStroke == true
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
	local strokeGradient = options.strokeGradient
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
		if isGradientString(colorStr) then
			strokeGradient = colorStr
			strokeProps.Color = Color3.new(1, 1, 1)
		else
			local parsed = parseColor(colorStr)
			strokeProps.Color = parsed.color
			if parsed.transparency > 0 then
				strokeProps.Transparency = parsed.transparency
			end
		end
	end
	strokeProps.ApplyStrokeMode = if isTextStroke then Enum.ApplyStrokeMode.Contextual else Enum.ApplyStrokeMode.Border
	if options.borderOffset ~= nil then
		local offset = parseDimension(options.borderOffset)
		if offset ~= nil then
			strokeProps.BorderOffset = offset
		end
	end
	if options.borderStrokePosition ~= nil then
		strokeProps.BorderStrokePosition = BORDER_STROKE_POSITION_MAP[options.borderStrokePosition] or Enum.BorderStrokePosition.Center
	end
	if options.lineJoinMode ~= nil then
		strokeProps.LineJoinMode = LINE_JOIN_MODE_MAP[options.lineJoinMode] or Enum.LineJoinMode.Round
	end
	if options.strokeSizingMode ~= nil then
		strokeProps.StrokeSizingMode = STROKE_SIZING_MODE_MAP[options.strokeSizingMode] or Enum.StrokeSizingMode.FixedSize
	end
	if options.strokeTransparency ~= nil then
		strokeProps.Transparency = math.clamp(options.strokeTransparency, 0, 1)
	end
	if options.strokeZIndex ~= nil then
		strokeProps.ZIndex = options.strokeZIndex
	end
	strokeProps.key = if isTextStroke then "uitextstroke" else "uistroke"
	local gradientElement = if strokeGradient ~= nil then buildGradientElement(if isTextStroke then "uitextstroke-gradient" else "uistroke-gradient", strokeGradient, options.strokeGradientOffset, options.strokeGradientRotation) else nil
	if gradientElement ~= nil then
		if strokeProps.Color == nil then
			strokeProps.Color = Color3.new(1, 1, 1)
		end
		return React.createElement("uistroke", strokeProps, gradientElement)
	end
	return React.createElement("uistroke", strokeProps)
end
local function getRadiusParts(radius)
	if radius == nil then
		return {}
	end
	local _radius = radius
	if type(_radius) == "number" then
		local parsed = parseDimension(radius)
		return if parsed ~= nil then { parsed } else {}
	end
	local _condition = splitOutsideParens(radius, "/")[1]
	if _condition == nil then
		_condition = radius
	end
	local firstRadiusSet = _condition
	local _exp = splitOutsideParens(firstRadiusSet)
	-- ▼ ReadonlyArray.filter ▼
	local _newValue = {}
	local _callback = function(part)
		return part ~= ""
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
	local radii = {}
	for _, part in parts do
		local parsed = parseDimension(part)
		if parsed ~= nil then
			table.insert(radii, parsed)
		end
	end
	return radii
end
local function expandCornerRadii(radius)
	local parts = getRadiusParts(radius)
	local zero = UDim.new(0, 0)
	if #parts == 0 then
		return { zero, zero, zero, zero }
	end
	if #parts == 1 then
		return { parts[1], parts[1], parts[1], parts[1] }
	end
	if #parts == 2 then
		return { parts[1], parts[2], parts[1], parts[2] }
	end
	if #parts == 3 then
		return { parts[1], parts[2], parts[3], parts[2] }
	end
	return { parts[1], parts[2], parts[3], parts[4] }
end
local function buildCorner(style)
	local hasIndividualCorner = style.borderTopLeftRadius ~= nil or style.borderTopRightRadius ~= nil or style.borderBottomRightRadius ~= nil or style.borderBottomLeftRadius ~= nil
	if style.borderRadius == nil and not hasIndividualCorner then
		return nil
	end
	if not hasIndividualCorner then
		local firstRadius = getRadiusParts(style.borderRadius)[1]
		return React.createElement("uicorner", {
			key = "uicorner",
			CornerRadius = firstRadius or UDim.new(0, 0),
		})
	end
	local _binding = expandCornerRadii(style.borderRadius)
	local topLeft = _binding[1]
	local topRight = _binding[2]
	local bottomRight = _binding[3]
	local bottomLeft = _binding[4]
	local topLeftOverride = if style.borderTopLeftRadius ~= nil then parseDimension(style.borderTopLeftRadius) else nil
	local topRightOverride = if style.borderTopRightRadius ~= nil then parseDimension(style.borderTopRightRadius) else nil
	local bottomRightOverride = if style.borderBottomRightRadius ~= nil then parseDimension(style.borderBottomRightRadius) else nil
	local bottomLeftOverride = if style.borderBottomLeftRadius ~= nil then parseDimension(style.borderBottomLeftRadius) else nil
	return React.createElement("uicorner", {
		key = "uicorner",
		TopLeftRadius = topLeftOverride or topLeft,
		TopRightRadius = topRightOverride or topRight,
		BottomRightRadius = bottomRightOverride or bottomRight,
		BottomLeftRadius = bottomLeftOverride or bottomLeft,
	})
end
local function parseBoxShadowString(value)
	local _exp = splitOutsideParens(value)
	-- ▼ ReadonlyArray.filter ▼
	local _newValue = {}
	local _callback = function(part)
		return part ~= "" and part ~= "inset"
	end
	local _length = 0
	for _k, _v in _exp do
		if _callback(_v, _k - 1, _exp) == true then
			_length += 1
			_newValue[_length] = _v
		end
	end
	-- ▲ ReadonlyArray.filter ▲
	local tokens = _newValue
	local dimensions = {}
	local colorTokens = {}
	for _, token in tokens do
		if isDimensionToken(token) and #colorTokens == 0 then
			table.insert(dimensions, token)
		else
			table.insert(colorTokens, token)
		end
	end
	local _condition = dimensions[1]
	if _condition == nil then
		_condition = "0"
	end
	local _condition_1 = parseDimension(_condition)
	if _condition_1 == nil then
		_condition_1 = UDim.new(0, 0)
	end
	local offsetX = _condition_1
	local _condition_2 = dimensions[2]
	if _condition_2 == nil then
		_condition_2 = "0"
	end
	local _condition_3 = parseDimension(_condition_2)
	if _condition_3 == nil then
		_condition_3 = UDim.new(0, 0)
	end
	local offsetY = _condition_3
	local blurRadius = if dimensions[3] ~= nil then parseDimension(dimensions[3]) else nil
	local spread = if dimensions[4] ~= nil then parseDimension(dimensions[4]) else nil
	local parsedColor = if #colorTokens > 0 then parseColor(table.concat(colorTokens, " ")) else nil
	local _object = {
		blurRadius = blurRadius,
	}
	local _left = "color"
	local _result = parsedColor
	if _result ~= nil then
		_result = _result.color
	end
	_object[_left] = _result
	_object.offset = UDim2.new(offsetX, offsetY)
	_object.spread = if spread ~= nil then UDim2.new(spread, spread) else nil
	local _left_1 = "transparency"
	local _result_1 = parsedColor
	if _result_1 ~= nil then
		_result_1 = _result_1.transparency
	end
	_object[_left_1] = _result_1
	return _object
end
local function presetNativeShadow(value)
	if value == "sm" then
		return {
			blurRadius = UDim.new(0, 4),
			offset = UDim2.new(0, 0, 0, 2),
			spread = UDim2.new(0, 1, 0, 1),
			transparency = 0.7,
		}
	end
	if value == "md" then
		return {
			blurRadius = UDim.new(0, 8),
			offset = UDim2.new(0, 0, 0, 4),
			spread = UDim2.new(0, 2, 0, 2),
			transparency = 0.6,
		}
	end
	if value == "xl" or value == "2xl" then
		return {
			blurRadius = UDim.new(0, if value == "2xl" then 24 else 18),
			offset = UDim2.new(0, 0, 0, if value == "2xl" then 15 else 10),
			spread = UDim2.new(0, if value == "2xl" then 8 else 6, 0, if value == "2xl" then 8 else 6),
			transparency = if value == "2xl" then 0.4 else 0.45,
		}
	end
	return {
		blurRadius = UDim.new(0, 12),
		offset = UDim2.new(0, 0, 0, 6),
		spread = UDim2.new(0, 4, 0, 4),
		transparency = 0.5,
	}
end
local function buildNativeShadow(style)
	local hasNativeShadowProps = style.shadowBlurRadius ~= nil or style.shadowColor ~= nil or style.shadowOffset ~= nil or style.shadowSpread ~= nil or style.shadowTransparency ~= nil or style.shadowZIndex ~= nil
	if style.boxShadow == "none" or (style.boxShadow == nil and not hasNativeShadowProps) then
		return nil
	end
	local base = if style.boxShadow ~= nil and SHADOW_SIZE_MAP[style.boxShadow] == nil then parseBoxShadowString(style.boxShadow) else presetNativeShadow(style.boxShadow)
	local _object = {
		key = "uishadow",
		Color = base.color or Color3.new(0, 0, 0),
	}
	local _left = "Transparency"
	local _condition = base.transparency
	if _condition == nil then
		_condition = 0.5
	end
	_object[_left] = _condition
	_object.BlurRadius = base.blurRadius or UDim.new(0, 12)
	_object.Offset = base.offset or UDim2.new(0, 0, 0, 6)
	_object.Spread = base.spread or UDim2.new(0, 4, 0, 4)
	local props = _object
	if style.shadowBlurRadius ~= nil then
		local _condition_1 = parseDimension(style.shadowBlurRadius)
		if _condition_1 == nil then
			_condition_1 = props.BlurRadius
		end
		props.BlurRadius = _condition_1
	end
	if style.shadowColor ~= nil then
		local parsed = parseColor(style.shadowColor)
		props.Color = parsed.color
		props.Transparency = parsed.transparency
	end
	if style.shadowOffset ~= nil then
		props.Offset = parseUDim2Pair(style.shadowOffset, UDim.new(0, 0), UDim.new(0, 0))
	end
	if style.shadowSpread ~= nil then
		props.Spread = parseUDim2Pair(style.shadowSpread, UDim.new(0, 0), UDim.new(0, 0))
	end
	if style.shadowTransparency ~= nil then
		props.Transparency = math.clamp(style.shadowTransparency, 0, 1)
	end
	if style.shadowZIndex ~= nil then
		props.ZIndex = style.shadowZIndex
	end
	return React.createElement("uishadow", props)
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
			local _object = {
				key = "uigradient",
				Color = gradient.colorSequence,
			}
			local _left = "Rotation"
			local _condition_2 = style.backgroundGradientRotation
			if _condition_2 == nil then
				_condition_2 = gradient.rotation
			end
			_object[_left] = _condition_2
			local gradientProps = _object
			if gradient.transparencySequence ~= nil then
				gradientProps.Transparency = gradient.transparencySequence
			end
			applyGradientProps(gradientProps, style.backgroundGradientOffset, style.backgroundGradientRotation)
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
	local corner = buildCorner(style)
	if corner ~= nil then
		table.insert(children, corner)
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
	-- 6. display layout → inject the matching Roblox layout component or set Visible
	if style.display == "flex" then
		local _arg0 = buildListLayout(style)
		table.insert(children, _arg0)
	elseif style.display == "grid" then
		local _arg0 = buildGridLayout(style)
		table.insert(children, _arg0)
	elseif style.display == "table" then
		local _arg0 = buildTableLayout(style)
		table.insert(children, _arg0)
	elseif style.display == "page" then
		local _arg0 = buildPageLayout(style)
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
		local stroke = buildStroke(activeBorder, {
			borderOffset = style.borderOffset,
			borderStrokePosition = style.borderStrokePosition,
			lineJoinMode = style.lineJoinMode,
			strokeSizingMode = style.strokeSizingMode,
			strokeTransparency = style.strokeTransparency,
			strokeZIndex = style.strokeZIndex,
			strokeGradient = style.strokeGradient,
			strokeGradientOffset = style.strokeGradientOffset,
			strokeGradientRotation = style.strokeGradientRotation,
		})
		if stroke ~= nil then
			table.insert(children, stroke)
		end
	end
	-- textStroke → inject <uistroke> with Contextual mode
	if style.textStroke ~= nil then
		local stroke = buildStroke(style.textStroke, {
			isTextStroke = true,
			lineJoinMode = style.lineJoinMode,
			strokeSizingMode = style.strokeSizingMode,
			strokeTransparency = style.strokeTransparency,
			strokeZIndex = style.strokeZIndex,
			strokeGradient = style.strokeGradient,
			strokeGradientOffset = style.strokeGradientOffset,
			strokeGradientRotation = style.strokeGradientRotation,
		})
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
	if style.scale ~= nil then
		local _arg0 = React.createElement("uiscale", {
			key = "uiscale",
			Scale = style.scale,
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
	if style.minTextSize ~= nil or style.maxTextSize ~= nil then
		local _object = {
			key = "uitextsizeconstraint",
		}
		local _left = "MinTextSize"
		local _condition_1 = style.minTextSize
		if _condition_1 == nil then
			_condition_1 = 1
		end
		_object[_left] = _condition_1
		local _left_1 = "MaxTextSize"
		local _condition_2 = style.maxTextSize
		if _condition_2 == nil then
			_condition_2 = 1000
		end
		_object[_left_1] = _condition_2
		local _arg0 = React.createElement("uitextsizeconstraint", _object)
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
	if style.textScaled ~= nil then
		props.TextScaled = style.textScaled
	end
	if style.maxVisibleGraphemes ~= nil then
		props.MaxVisibleGraphemes = style.maxVisibleGraphemes
	end
	if style.richText == true then
		props.RichText = true
	end
	if style.textStrokeColor ~= nil then
		props.TextStrokeColor3 = parseColor(style.textStrokeColor).color
	end
	if style.textStrokeTransparency ~= nil then
		props.TextStrokeTransparency = style.textStrokeTransparency
	end
	if style.autoLocalize ~= nil then
		props.AutoLocalize = style.autoLocalize
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
	-- Roblox UI object aliases surfaced by the Creator Hub UI docs.
	if style.image ~= nil then
		props.Image = style.image
	end
	if style.hoverImage ~= nil then
		props.HoverImage = style.hoverImage
	end
	if style.pressedImage ~= nil then
		props.PressedImage = style.pressedImage
	end
	if style.imageColor ~= nil then
		props.ImageColor3 = parseColor(style.imageColor).color
	end
	if style.imageTransparency ~= nil then
		props.ImageTransparency = style.imageTransparency
	end
	if style.groupColor ~= nil then
		props.GroupColor3 = parseColor(style.groupColor).color
	end
	if style.groupTransparency ~= nil then
		props.GroupTransparency = style.groupTransparency
	end
	if style.canvasSize ~= nil then
		local canvasSize = parseUDim2Value(style.canvasSize)
		if canvasSize ~= nil then
			props.CanvasSize = canvasSize
		end
	end
	if style.automaticCanvasSize ~= nil then
		props.AutomaticCanvasSize = AUTO_SIZE_MAP[style.automaticCanvasSize] or Enum.AutomaticSize.None
	end
	if style.canvasPosition ~= nil then
		local canvasPosition = parseVector2(style.canvasPosition)
		if canvasPosition ~= nil then
			props.CanvasPosition = canvasPosition
		end
	end
	if style.verticalScrollBarInset ~= nil then
		props.VerticalScrollBarInset = SCROLL_BAR_INSET_MAP[style.verticalScrollBarInset] or Enum.ScrollBarInset.None
	end
	if style.horizontalScrollBarInset ~= nil then
		props.HorizontalScrollBarInset = SCROLL_BAR_INSET_MAP[style.horizontalScrollBarInset] or Enum.ScrollBarInset.None
	end
	if style.verticalScrollBarPosition ~= nil then
		props.VerticalScrollBarPosition = VERTICAL_SCROLL_BAR_POSITION_MAP[style.verticalScrollBarPosition] or Enum.VerticalScrollBarPosition.Right
	end
	if style.scrollBarThickness ~= nil then
		props.ScrollBarThickness = style.scrollBarThickness
	end
	if style.scrollBarImageColor ~= nil then
		props.ScrollBarImageColor3 = parseColor(style.scrollBarImageColor).color
	end
	if style.scrollBarImageTransparency ~= nil then
		props.ScrollBarImageTransparency = style.scrollBarImageTransparency
	end
	if style.scrollBarTopImage ~= nil then
		props.TopImage = style.scrollBarTopImage
	end
	if style.scrollBarMidImage ~= nil then
		props.MidImage = style.scrollBarMidImage
	end
	if style.scrollBarBottomImage ~= nil then
		props.BottomImage = style.scrollBarBottomImage
	end
	if style.elasticBehavior ~= nil then
		props.ElasticBehavior = ELASTIC_BEHAVIOR_MAP[style.elasticBehavior] or Enum.ElasticBehavior.WhenScrollable
	end
	if style.viewportAmbient ~= nil then
		props.Ambient = parseColor(style.viewportAmbient).color
	end
	if style.viewportLightColor ~= nil then
		props.LightColor = parseColor(style.viewportLightColor).color
	end
	if style.viewportLightDirection ~= nil then
		local lightDirection = parseVector3(style.viewportLightDirection)
		if lightDirection ~= nil then
			props.LightDirection = lightDirection
		end
	end
	if style.video ~= nil then
		props.Video = style.video
	end
	if style.looped ~= nil then
		props.Looped = style.looped
	end
	if style.playing ~= nil then
		props.Playing = style.playing
	end
	if style.pathColor ~= nil then
		props.Color3 = parseColor(style.pathColor).color
	end
	if style.pathThickness ~= nil then
		props.Thickness = style.pathThickness
	end
	if style.promptObjectText ~= nil then
		props.ObjectText = style.promptObjectText
	end
	if style.promptActionText ~= nil then
		props.ActionText = style.promptActionText
	end
	if style.promptKeyboardKeyCode ~= nil then
		local keyCode = parseKeyCode(style.promptKeyboardKeyCode)
		if keyCode ~= nil then
			props.KeyboardKeyCode = keyCode
		end
	end
	if style.promptGamepadKeyCode ~= nil then
		local keyCode = parseKeyCode(style.promptGamepadKeyCode)
		if keyCode ~= nil then
			props.GamepadKeyCode = keyCode
		end
	end
	if style.promptMaxActivationDistance ~= nil then
		props.MaxActivationDistance = style.promptMaxActivationDistance
	end
	if style.promptRequiresLineOfSight ~= nil then
		props.RequiresLineOfSight = style.promptRequiresLineOfSight
	end
	if style.promptExclusivity ~= nil then
		props.Exclusivity = PROXIMITY_PROMPT_EXCLUSIVITY_MAP[style.promptExclusivity] or Enum.ProximityPromptExclusivity.OnePerButton
	end
	if style.promptHoldDuration ~= nil then
		props.HoldDuration = style.promptHoldDuration
	end
	if style.promptClickable ~= nil then
		props.ClickablePrompt = style.promptClickable
	end
	if style.uiDragStyle ~= nil then
		props.DragStyle = UI_DRAG_STYLE_MAP[style.uiDragStyle] or Enum.UIDragDetectorDragStyle.TranslatePlane
	end
	if style.uiDragResponseStyle ~= nil then
		props.ResponseStyle = UI_DRAG_RESPONSE_STYLE_MAP[style.uiDragResponseStyle] or Enum.UIDragDetectorResponseStyle.Offset
	end
	if style.uiDragAxis ~= nil then
		local dragAxis = parseVector2(style.uiDragAxis)
		if dragAxis ~= nil then
			props.DragAxis = dragAxis
		end
	end
	if style.uiDragMinTranslation ~= nil then
		local minDragTranslation = parseUDim2Value(style.uiDragMinTranslation)
		if minDragTranslation ~= nil then
			props.MinDragTranslation = minDragTranslation
		end
	end
	if style.uiDragMaxTranslation ~= nil then
		local maxDragTranslation = parseUDim2Value(style.uiDragMaxTranslation)
		if maxDragTranslation ~= nil then
			props.MaxDragTranslation = maxDragTranslation
		end
	end
	if style.uiDragMinAngle ~= nil then
		props.MinDragAngle = style.uiDragMinAngle
	end
	if style.uiDragMaxAngle ~= nil then
		props.MaxDragAngle = style.uiDragMaxAngle
	end
	if style.uiDragBoundingBehavior ~= nil then
		props.BoundingBehavior = UI_DRAG_BOUNDING_BEHAVIOR_MAP[style.uiDragBoundingBehavior] or Enum.UIDragDetectorBoundingBehavior.Automatic
	end
	if style.uiDragSpeedAxisMapping ~= nil then
		props.UIDragSpeedAxisMapping = UI_DRAG_SPEED_AXIS_MAPPING_MAP[style.uiDragSpeedAxisMapping] or Enum.UIDragSpeedAxisMapping.XY
	end
	if style.dragStyle ~= nil then
		props.DragStyle = DRAG_STYLE_MAP[style.dragStyle] or Enum.DragDetectorDragStyle.TranslatePlane
	end
	if style.dragResponseStyle ~= nil then
		props.ResponseStyle = DRAG_RESPONSE_STYLE_MAP[style.dragResponseStyle] or Enum.DragDetectorResponseStyle.Geometric
	end
	if style.dragAxis ~= nil then
		local dragAxis = parseVector3(style.dragAxis)
		if dragAxis ~= nil then
			props.Axis = dragAxis
		end
	end
	if style.dragOrientation ~= nil then
		local orientation = parseVector3(style.dragOrientation)
		if orientation ~= nil then
			props.Orientation = orientation
		end
	end
	if style.dragMinTranslation ~= nil then
		local minDragTranslation = parseVector3(style.dragMinTranslation)
		if minDragTranslation ~= nil then
			props.MinDragTranslation = minDragTranslation
		end
	end
	if style.dragMaxTranslation ~= nil then
		local maxDragTranslation = parseVector3(style.dragMaxTranslation)
		if maxDragTranslation ~= nil then
			props.MaxDragTranslation = maxDragTranslation
		end
	end
	if style.dragMinAngle ~= nil then
		props.MinDragAngle = style.dragMinAngle
	end
	if style.dragMaxAngle ~= nil then
		props.MaxDragAngle = style.dragMaxAngle
	end
	if style.dragPermissionPolicy ~= nil then
		props.PermissionPolicy = DRAG_PERMISSION_POLICY_MAP[style.dragPermissionPolicy] or Enum.DragDetectorPermissionPolicy.Everybody
	end
	if style.dragApplyAtCenterOfMass ~= nil then
		props.ApplyAtCenterOfMass = style.dragApplyAtCenterOfMass
	end
	if style.dragMaxForce ~= nil then
		props.MaxForce = style.dragMaxForce
	end
	if style.dragMaxTorque ~= nil then
		props.MaxTorque = style.dragMaxTorque
	end
	if style.dragResponsiveness ~= nil then
		props.Responsiveness = style.dragResponsiveness
	end
	if style.dragRunLocally ~= nil then
		props.RunLocally = style.dragRunLocally
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
	-- 15. boxShadow → inject <imagelabel> fallback or opt-in <uishadow>
	if style.boxShadow ~= nil and style.boxShadow ~= "none" then
		local shadowTokens = splitOutsideParens(style.boxShadow)
		-- ▼ ReadonlyArray.some ▼
		local _result = false
		local _callback = function(token)
			return isDimensionToken(token)
		end
		for _k, _v in shadowTokens do
			if _callback(_v, _k - 1, shadowTokens) then
				_result = true
				break
			end
		end
		-- ▲ ReadonlyArray.some ▲
		local looksLikeCssShadow = _result
		local shouldUseNativeShadow = style.boxShadowMode == "uishadow" or style.shadowBlurRadius ~= nil or style.shadowColor ~= nil or style.shadowOffset ~= nil or style.shadowSpread ~= nil or style.shadowTransparency ~= nil or style.shadowZIndex ~= nil or (style.boxShadowMode ~= "image" and looksLikeCssShadow and SHADOW_SIZE_MAP[style.boxShadow] == nil)
		if shouldUseNativeShadow then
			local shadow = buildNativeShadow(style)
			if shadow ~= nil then
				table.insert(children, shadow)
			end
		else
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
	elseif style.shadowBlurRadius ~= nil or style.shadowColor ~= nil or style.shadowOffset ~= nil or style.shadowSpread ~= nil or style.shadowTransparency ~= nil or style.shadowZIndex ~= nil then
		local shadow = buildNativeShadow(style)
		if shadow ~= nil then
			table.insert(children, shadow)
		end
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
