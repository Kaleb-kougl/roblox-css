-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
--[[
	*
	 * colorParser.ts — Converts CSS color strings to Roblox Color3.
	 *
	 * Supported formats:
	 *   - Hex:   "#ff0000", "#f00"
	 *   - RGB:   "rgb(255, 0, 0)"
	 *   - RGBA:  "rgba(255, 0, 0, 0.5)"
	 *   - HSL:   "hsl(0, 100%, 50%)"
	 *   - HSLA:  "hsla(0, 100%, 50%, 0.5)"
	 *   - Named: "red", "blue", "white", "transparent"
	 *   - Pass-through: Color3 instances returned as-is
	 *
	 * Returns a ParsedColor with `transparent` flag for "transparent" keyword.
	 
]]
local NAMED_COLORS = TS.import(script, script.Parent, "namedColors").NAMED_COLORS
local createLogger = TS.import(script, script.Parent.Parent, "logger").createLogger
local log = createLogger("colorParser")
--[[
	*
	 * Branded ParsedColor — the `_parsed` brand ensures only values produced by
	 * parseColor() are assignable. A plain `{ color: Color3; transparency: number }`
	 * will NOT satisfy this type, catching accidental bypasses at compile time.
	 
]]
--* Helper to construct a branded ParsedColor inside this module. 
local function makeParsedColor(color, transparency)
	return {
		color = color,
		transparent = transparency == 1,
		transparency = transparency,
	}
end
local function parseColor(_input)
	-- 1. If input is already Color3, return it
	local __input = _input
	if typeof(__input) == "Color3" then
		return makeParsedColor(_input, 0)
	end
	-- if not Color3, it must be a string
	local input = _input
	-- 2. If string "transparent", return white + transparency: 1
	if input == "transparent" then
		return makeParsedColor(Color3.new(1, 1, 1), 1)
	end
	-- 3. If starts with "#" or is a valid hex without "#", parse hex (handle 3-char and 6-char)
	local hasHash = string.sub(input, 1, 1) == "#"
	local possibleHex = if hasHash then string.sub(input, 2) else input
	if (#possibleHex == 3 or #possibleHex == 6) and tonumber(possibleHex, 16) ~= nil then
		local r = 0
		local g = 0
		local b = 0
		if #possibleHex == 3 then
			-- RGB → double each digit: "f" → "ff"
			local _condition = tonumber(string.rep(string.sub(possibleHex, 1, 1), 2), 16)
			if _condition == nil then
				_condition = 0
			end
			r = _condition
			local _condition_1 = tonumber(string.rep(string.sub(possibleHex, 2, 2), 2), 16)
			if _condition_1 == nil then
				_condition_1 = 0
			end
			g = _condition_1
			local _condition_2 = tonumber(string.rep(string.sub(possibleHex, 3, 3), 2), 16)
			if _condition_2 == nil then
				_condition_2 = 0
			end
			b = _condition_2
		else
			-- RRGGBB
			local _condition = tonumber(string.sub(possibleHex, 1, 2), 16)
			if _condition == nil then
				_condition = 0
			end
			r = _condition
			local _condition_1 = tonumber(string.sub(possibleHex, 3, 4), 16)
			if _condition_1 == nil then
				_condition_1 = 0
			end
			g = _condition_1
			local _condition_2 = tonumber(string.sub(possibleHex, 5, 6), 16)
			if _condition_2 == nil then
				_condition_2 = 0
			end
			b = _condition_2
		end
		return makeParsedColor(Color3.fromRGB(r, g, b), 0)
	end
	-- 4. If starts with "rgb(" or "rgba(", extract numbers
	if string.sub(input, 1, 4) == "rgb(" then
		local parts = string.split(input, ",")
		local _condition = tonumber(string.sub(parts[1], 5))
		if _condition == nil then
			_condition = 0
		end
		local r = _condition
		local _condition_1 = tonumber(parts[2])
		if _condition_1 == nil then
			_condition_1 = 0
		end
		local g = _condition_1
		local _condition_2 = tonumber(string.sub(parts[3], 1, -2))
		if _condition_2 == nil then
			_condition_2 = 0
		end
		local b = _condition_2
		return makeParsedColor(Color3.fromRGB(r, g, b), 0)
	elseif string.sub(input, 1, 5) == "rgba(" then
		local parts = string.split(input, ",")
		local _condition = tonumber(string.sub(parts[1], 6))
		if _condition == nil then
			_condition = 0
		end
		local r = _condition
		local _condition_1 = tonumber(parts[2])
		if _condition_1 == nil then
			_condition_1 = 0
		end
		local g = _condition_1
		local _condition_2 = tonumber(parts[3])
		if _condition_2 == nil then
			_condition_2 = 0
		end
		local b = _condition_2
		local _condition_3 = tonumber(string.sub(parts[4], 1, -2))
		if _condition_3 == nil then
			_condition_3 = 1
		end
		local alpha = _condition_3
		return makeParsedColor(Color3.fromRGB(r, g, b), 1 - alpha)
	end
	-- 4.5. HSL / HSLA support
	if string.sub(input, 1, 4) == "hsl(" or string.sub(input, 1, 5) == "hsla(" then
		local isHsla = string.sub(input, 1, 5) == "hsla("
		local parts = string.split(input, ",")
		-- Extract hue from first part: "hsl(120" or "hsla(120"
		local hStr = if isHsla then string.sub(parts[1], 6) else string.sub(parts[1], 5)
		local _condition = tonumber(hStr)
		if _condition == nil then
			_condition = 0
		end
		local h = (_condition % 360 + 360) % 360
		-- Extract saturation — strip non-numeric chars (%, spaces) via Lua pattern
		local _condition_1 = parts[2]
		if _condition_1 == nil then
			_condition_1 = ""
		end
		local sMatch = string.match(_condition_1, "([%d%.]+)")
		local _condition_2 = tonumber(sMatch)
		if _condition_2 == nil then
			_condition_2 = 0
		end
		local s = math.clamp(_condition_2 / 100, 0, 1)
		-- Extract lightness — strip non-numeric chars (%, ), spaces)
		local _condition_3 = parts[3]
		if _condition_3 == nil then
			_condition_3 = ""
		end
		local lMatch = string.match(_condition_3, "([%d%.]+)")
		local _condition_4 = tonumber(lMatch)
		if _condition_4 == nil then
			_condition_4 = 0
		end
		local l = math.clamp(_condition_4 / 100, 0, 1)
		-- Extract alpha (hsla only) — strip closing paren
		local _result
		if isHsla and #parts >= 4 then
			local _condition_5 = tonumber(string.sub(parts[4], 1, -2))
			if _condition_5 == nil then
				_condition_5 = 1
			end
			_result = _condition_5
		else
			_result = 1
		end
		local alpha = _result
		-- HSL to RGB conversion (standard algorithm)
		local c = (1 - math.abs(2 * l - 1)) * s
		local x = c * (1 - math.abs(((h / 60) % 2) - 1))
		local m = l - c / 2
		local r1 = 0
		local g1 = 0
		local b1 = 0
		if h < 60 then
			r1 = c
			g1 = x
			b1 = 0
		elseif h < 120 then
			r1 = x
			g1 = c
			b1 = 0
		elseif h < 180 then
			r1 = 0
			g1 = c
			b1 = x
		elseif h < 240 then
			r1 = 0
			g1 = x
			b1 = c
		elseif h < 300 then
			r1 = x
			g1 = 0
			b1 = c
		else
			r1 = c
			g1 = 0
			b1 = x
		end
		return makeParsedColor(Color3.new(math.clamp(r1 + m, 0, 1), math.clamp(g1 + m, 0, 1), math.clamp(b1 + m, 0, 1)), 1 - alpha)
	end
	-- 5. Lookup in NAMED_COLORS table (case-insensitive)
	local _arg0 = string.lower(input)
	local rgb = NAMED_COLORS[_arg0]
	if rgb then
		return makeParsedColor(Color3.fromRGB(rgb[1], rgb[2], rgb[3]), 0)
	end
	-- 6. Fallback: warn + return white
	log:warn("UNKNOWN_COLOR", "Unknown color string", {
		input = input,
	})
	return makeParsedColor(Color3.new(1, 1, 1), 0)
end
return {
	parseColor = parseColor,
}
