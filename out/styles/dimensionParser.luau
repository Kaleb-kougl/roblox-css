-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local createLogger = TS.import(script, script.Parent.Parent, "logger").createLogger
local log = createLogger("dimensionParser")
--[[
	*
	 * dimensionParser.ts — Converts CSS dimension strings to Roblox UDim.
	 *
	 * Supported formats:
	 *   - Pixels:   "100px" or 100 (number) → UDim(0, 100)
	 *   - Percent:  "50%"                   → UDim(0.5, 0)
	 *   - Viewport: "100vw" / "100vh"       → UDim(1, 0)
	 *   - Calc:     "calc(100% - 10px)"     → UDim(1.0, -10)
	 *   - Auto:     "auto"                  → undefined
	 *
	 * Also exports parsePadding() for CSS padding shorthand.
	 *
	 
]]
--[[
	*
	 * Branded ParsedDimension — the `_parsed` brand ensures only values produced by
	 * parseDimension() are assignable. A raw UDim will NOT satisfy this type,
	 * catching accidental bypasses at compile time.
	 
]]
--* Helper to construct a branded ParsedDimension inside this module. 
local function makeParsedDimension(scale, offset)
	return UDim.new(scale, offset)
end
local parseDimension
local function parseCalc(inner)
	local parts = string.split(inner, " - ")
	local isSubtraction = true
	if #parts ~= 2 then
		parts = string.split(inner, " + ")
		isSubtraction = false
	end
	if #parts ~= 2 then
		log:warn("PARSE_CALC_FAILED", "Malformed calc expression", {
			inner = inner,
		})
		return nil
	end
	local term1 = parseDimension(parts[1])
	local term2 = parseDimension(parts[2])
	if term1 == nil or term2 == nil then
		log:warn("PARSE_CALC_FAILED", "Failed to parse calc terms", {
			inner = inner,
		})
		return nil
	end
	local scale2 = term2.Scale
	local offset2 = term2.Offset
	if isSubtraction then
		scale2 = -scale2
		offset2 = -offset2
	end
	return makeParsedDimension(term1.Scale + scale2, term1.Offset + offset2)
end
function parseDimension(_input)
	-- 1. If number, treat as pixels → UDim(0, input)
	local __input = _input
	if type(__input) == "number" then
		return makeParsedDimension(0, _input)
	end
	-- 1.5. If calc(...) expression, delegate to parseCalc
	local __input_1 = _input
	local _condition = type(__input_1) == "string"
	if _condition then
		_condition = string.sub(_input, 1, 5) == "calc("
	end
	if _condition then
		local inner = string.sub(_input, 6, -2)
		local result = parseCalc(inner)
		if result ~= nil then
			return result
		end
		-- Malformed calc — fall through to the warn at the bottom
	end
	-- 2. If string ending in "px", extract number → UDim(0, n)
	if string.sub(_input, -2) == "px" then
		local n = tonumber(string.sub(_input, 1, -3))
		if n ~= nil then
			return makeParsedDimension(0, n)
		end
	end
	-- 3. If string ending in "%", extract number / 100 → UDim(n/100, 0)
	if string.sub(_input, -1) == "%" then
		local n = tonumber(string.sub(_input, 1, -2))
		if n ~= nil then
			return makeParsedDimension(n / 100, 0)
		end
	end
	-- 4. If "100vw" or "100vh", → UDim(1, 0)
	local last2Chars = string.sub(_input, -2)
	if last2Chars == "vh" or last2Chars == "vw" then
		local n = tonumber(string.sub(_input, 1, -3))
		if n ~= nil then
			return makeParsedDimension(n / 100, 0)
		end
	end
	-- 5. If "auto" → undefined
	if _input == "auto" then
		return nil
	end
	-- 6. If raw number string (e.g. "0")
	local __input_2 = _input
	if type(__input_2) == "string" then
		local rawNumber = tonumber(_input)
		if rawNumber ~= nil then
			return makeParsedDimension(0, rawNumber)
		end
	end
	--  Fallback: warn + return undefined (callers must handle this)
	log:warn("PARSE_DIMENSION_FAILED", "Could not parse dimension", {
		input = _input,
	})
	return nil
end
--[[
	*
	 * Branded PaddingValues — the `_parsed` brand ensures only values produced by
	 * parsePadding() are assignable. A plain object with top, right, bottom, left
	 * will NOT satisfy this type, catching accidental bypasses at compile time.
	 
]]
--* Helper to construct a branded PaddingValues inside this module. 
local function makePaddingValues(top, right, bottom, left)
	return {
		top = top,
		right = right,
		bottom = bottom,
		left = left,
	}
end
local ZERO_UDIM = UDim.new(0, 0)
--[[
	*
	 * Converts a CSS padding shorthand string or number into UDim values for all 4 sides.
	 *
	 * Supported formats (similar to CSS):
	 *   - 1 value:  "10px"            → top/right/bottom/left
	 *   - 2 values: "10px 20%"        → top/bottom, right/left
	 *   - 3 values: "10px 20% 10px"   → top, right/left, bottom
	 *   - 4 values: "10px 20% 10px 5%" → top, right, bottom, left
	 *
	 * Supports any dimension format supported by parseDimension (px, %, vw, vh).
	 * Number inputs are treated as pixels applied to all sides.
	 
]]
local function parsePadding(_input)
	-- 1. If number, treat as pixels on all sides
	local __input = _input
	if type(__input) == "number" then
		local dim = parseDimension(_input)
		return makePaddingValues(dim, dim, dim, dim)
	end
	-- 2. If string, split on whitespace and parse each token through parseDimension
	local splitInput = string.split(_input, " ")
	local size = #splitInput
	if size == 1 then
		--    - 1 value:  all sides
		local a = parseDimension(splitInput[1])
		if a ~= nil then
			return makePaddingValues(a, a, a, a)
		end
	end
	if size == 2 then
		--    - 2 values: vertical | horizontal
		local a = parseDimension(splitInput[1])
		local b = parseDimension(splitInput[2])
		if a ~= nil and b ~= nil then
			return makePaddingValues(a, b, a, b)
		end
	end
	--    - 3 values: top | horizontal | bottom
	if size == 3 then
		local a = parseDimension(splitInput[1])
		local b = parseDimension(splitInput[2])
		local c = parseDimension(splitInput[3])
		if a ~= nil and b ~= nil and c ~= nil then
			return makePaddingValues(a, b, c, b)
		end
	end
	--    - 4 values: top | right | bottom | left
	if size == 4 then
		local a = parseDimension(splitInput[1])
		local b = parseDimension(splitInput[2])
		local c = parseDimension(splitInput[3])
		local d = parseDimension(splitInput[4])
		if a ~= nil and b ~= nil and c ~= nil and d ~= nil then
			return makePaddingValues(a, b, c, d)
		end
	end
	-- Fallback warn + return zero UDim padding
	log:warn("PARSE_PADDING_FAILED", "Could not parse padding values", {
		input = _input,
	})
	return makePaddingValues(ZERO_UDIM, ZERO_UDIM, ZERO_UDIM, ZERO_UDIM)
end
return {
	parseDimension = parseDimension,
	parsePadding = parsePadding,
}
