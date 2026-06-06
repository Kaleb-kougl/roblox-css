-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local parseColor = TS.import(script, script.Parent, "colorParser").parseColor
local createLogger = TS.import(script, script.Parent.Parent, "logger").createLogger
local log = createLogger("gradientParser")
local function makeParsedGradient(colorSequence, transparencySequence, rotation)
	return {
		colorSequence = colorSequence,
		transparencySequence = transparencySequence,
		rotation = rotation,
	}
end
local function isGradientString(input)
	local _input = input
	local _condition = type(_input) == "string"
	if _condition then
		_condition = string.sub(input, 1, 16) == "linear-gradient("
	end
	return _condition
end
local function parseAngle(directionStr, elementWidth, elementHeight)
	local lower = string.lower(directionStr)
	-- Keyword directions
	if lower == "to top" then
		return 0
	end
	if lower == "to right" then
		return 90
	end
	if lower == "to bottom" then
		return 180
	end
	if lower == "to left" then
		return 270
	end
	-- Corner keywords
	if string.sub(lower, 1, 3) == "to " then
		local corner = string.sub(lower, 4)
		local angleDeg = 45
		if elementWidth ~= nil and elementHeight ~= nil and elementHeight ~= 0 then
			local ratioAngle = math.deg(math.atan2(elementWidth, elementHeight))
			if corner == "top right" then
				return ratioAngle
			end
			if corner == "bottom right" then
				return 180 - ratioAngle
			end
			if corner == "bottom left" then
				return 180 + ratioAngle
			end
			if corner == "top left" then
				return 360 - ratioAngle
			end
		else
			if corner == "top right" then
				return 45
			end
			if corner == "bottom right" then
				return 135
			end
			if corner == "bottom left" then
				return 225
			end
			if corner == "top left" then
				return 315
			end
		end
	end
	-- Angle values
	local degMatch = string.match(lower, "^([%d%.%-]+)deg$")
	if degMatch ~= nil then
		local _condition = tonumber(degMatch)
		if _condition == nil then
			_condition = 180
		end
		return _condition
	end
	local turnMatch = string.match(lower, "^([%d%.%-]+)turn$")
	if turnMatch ~= nil then
		local _condition = tonumber(turnMatch)
		if _condition == nil then
			_condition = 0
		end
		return _condition * 360
	end
	local gradMatch = string.match(lower, "^([%d%.%-]+)grad$")
	if gradMatch ~= nil then
		local _condition = tonumber(gradMatch)
		if _condition == nil then
			_condition = 0
		end
		return _condition * 0.9
	end
	local radMatch = string.match(lower, "^([%d%.%-]+)rad$")
	if radMatch ~= nil then
		local _condition = tonumber(radMatch)
		if _condition == nil then
			_condition = 0
		end
		return math.deg(_condition)
	end
	return 180
end
local function parseStop(stopStr)
	local trimmedRaw = string.match(stopStr, "^%s*(.-)%s*$")
	if trimmedRaw == nil or trimmedRaw == "" then
		return nil
	end
	local trimmed = trimmedRaw
	-- Check if it's a bare percentage (color hint)
	local hintMatch = string.match(trimmed, "^([%d%.]+)%%$")
	if hintMatch ~= nil then
		local pos = tonumber(hintMatch)
		if pos ~= nil then
			return {
				color = Color3.new(),
				transparency = 0,
				position = math.clamp(pos / 100, 0, 1),
				isHint = true,
			}
		end
	end
	-- Split by space from the end to find optional position
	-- Since color could be rgba(255, 0, 0, 0.5) we must be careful with spaces.
	-- We'll look for a percentage at the end.
	local colorStr = trimmed
	local position
	local endPercentMatch = string.match(trimmed, " ([%d%.%-]+)%%$")
	if endPercentMatch ~= nil then
		local pos = tonumber(endPercentMatch)
		if pos ~= nil then
			position = math.clamp(pos / 100, 0, 1)
			local colorMatch = string.match(trimmed, "^(.*) [%d%.%-]+%%$")
			if colorMatch ~= nil then
				colorStr = colorMatch
			end
		end
	end
	local parsedColor = parseColor(colorStr)
	return {
		color = parsedColor.color,
		transparency = parsedColor.transparency,
		position = position,
		isHint = false,
	}
end
local function parseGradient(input, elementWidth, elementHeight)
	if not isGradientString(input) then
		return nil
	end
	local repeatingStart = string.find(string.lower(input), "^repeating%-linear%-gradient")
	if repeatingStart ~= nil then
		log:warn("UNSUPPORTED_GRADIENT", "repeating-linear-gradient is not supported", {
			input = input,
		})
		return nil
	end
	local inner = string.sub(input, 17, -2)
	if inner == "" then
		return nil
	end
	-- Simple parser for comma-separated args, respecting parentheses for rgb/rgba
	local args = {}
	local currentArg = ""
	local parenLevel = 0
	for i = 1, #inner do
		local _i = i
		local _i_1 = i
		local char = string.sub(inner, _i, _i_1)
		if char == "(" then
			parenLevel += 1
		elseif char == ")" then
			parenLevel -= 1
		elseif char == "," and parenLevel == 0 then
			local _currentArg = currentArg
			table.insert(args, _currentArg)
			currentArg = ""
			continue
		end
		currentArg ..= char
	end
	local _currentArg = currentArg
	table.insert(args, _currentArg)
	if #args < 2 then
		return nil
	end
	-- Determine if the first arg is a direction
	local directionStr = args[1]
	local directionAngle = 180
	local firstStopIdx = 0
	local lowerFirst = string.lower(directionStr)
	local hasDeg = string.find(lowerFirst, "deg$")
	local hasTurn = string.find(lowerFirst, "turn$")
	local hasGrad = string.find(lowerFirst, "grad$")
	local hasRad = string.find(lowerFirst, "rad$")
	local _condition = string.sub(lowerFirst, 1, 3) == "to "
	if not _condition then
		_condition = hasDeg
		if not (_condition ~= 0 and _condition == _condition and _condition) then
			_condition = hasTurn
			if not (_condition ~= 0 and _condition == _condition and _condition) then
				_condition = hasGrad
				if not (_condition ~= 0 and _condition == _condition and _condition) then
					_condition = hasRad
				end
			end
		end
	end
	if _condition ~= 0 and _condition == _condition and _condition then
		directionAngle = parseAngle(directionStr, elementWidth, elementHeight)
		firstStopIdx = 1
	end
	local stops = {}
	do
		local i = firstStopIdx
		local _shouldIncrement = false
		while true do
			if _shouldIncrement then
				i += 1
			else
				_shouldIncrement = true
			end
			if not (i < #args) then
				break
			end
			local parsed = parseStop(args[i + 1])
			if parsed ~= nil then
				table.insert(stops, parsed)
			end
		end
	end
	-- Remove leading/trailing hints and check valid color stops
	while #stops > 0 and stops[1].isHint do
		table.remove(stops, 1)
	end
	while #stops > 0 and stops[#stops].isHint do
		stops[#stops] = nil
	end
	local colorStopCount = 0
	for _, stop in stops do
		if not stop.isHint then
			colorStopCount += 1
		end
	end
	if colorStopCount < 2 then
		return nil
	end
	-- Distribute positions
	if stops[1].position == nil then
		stops[1].position = 0
	end
	if stops[#stops].position == nil then
		stops[#stops].position = 1
	end
	local lastKnownIdx = 0
	for i = 1, #stops - 1 do
		if stops[i + 1].position ~= nil then
			local steps = i - lastKnownIdx
			local startPos = stops[lastKnownIdx + 1].position
			local endPos = stops[i + 1].position
			local stepSize = (endPos - startPos) / steps
			do
				local j = 1
				local _shouldIncrement = false
				while true do
					if _shouldIncrement then
						j += 1
					else
						_shouldIncrement = true
					end
					if not (j < steps) then
						break
					end
					stops[lastKnownIdx + j + 1].position = startPos + stepSize * j
				end
			end
			lastKnownIdx = i
		end
	end
	-- Auto-correct out-of-order positions
	local maxPos = 0
	for _, stop in stops do
		if stop.position < maxPos then
			stop.position = maxPos
		end
		maxPos = stop.position
	end
	-- Apply hints
	local finalStops = {}
	for i = 0, #stops - 1 do
		local stop = stops[i + 1]
		if stop.isHint then
			local prev = stops[i]
			local nextStop = stops[i + 2]
			local startPos = prev.position
			local endPos = nextStop.position
			if startPos == endPos then
				continue
			end
			-- H = (hintAbsPos - stop1Pos) / (stop2Pos - stop1Pos)
			local h = (stop.position - startPos) / (endPos - startPos)
			h = math.clamp(h, 0.01, 0.99)
			local exp = math.log(0.5) / math.log(h)
			-- Pop the last added stop so we can replace the segment
			finalStops[#finalStops] = nil
			table.insert(finalStops, prev)
			for sample = 1, 7 do
				local p = sample / 8
				local f = p ^ exp
				local pos = startPos + p * (endPos - startPos)
				local r = prev.color.R + f * (nextStop.color.R - prev.color.R)
				local g = prev.color.G + f * (nextStop.color.G - prev.color.G)
				local b = prev.color.B + f * (nextStop.color.B - prev.color.B)
				local transp = prev.transparency + f * (nextStop.transparency - prev.transparency)
				local _arg0 = {
					color = Color3.new(r, g, b),
					transparency = transp,
					position = pos,
					isHint = false,
				}
				table.insert(finalStops, _arg0)
			end
		else
			table.insert(finalStops, stop)
		end
	end
	-- Build sequences
	local colorKeypoints = {}
	local alphaKeypoints = {}
	local hasTransparency = false
	-- Roblox limits keypoints to 20, but we might have more.
	-- For simplicity, we just push all and trust it's <= 20 or user will see engine err, 
	-- but let's downsample if needed. Let's just create them as specified.
	for _, stop in finalStops do
		local pos = math.clamp(stop.position, 0, 1)
		local _colorSequenceKeypoint = ColorSequenceKeypoint.new(pos, stop.color)
		table.insert(colorKeypoints, _colorSequenceKeypoint)
		local _numberSequenceKeypoint = NumberSequenceKeypoint.new(pos, stop.transparency)
		table.insert(alphaKeypoints, _numberSequenceKeypoint)
		if stop.transparency > 0 then
			hasTransparency = true
		end
	end
	-- Fix duplicate positions (Roblox requires strictly increasing times for ColorSequence, or at least no more than 2 at same time if they are immediate jumps, but usually increasing is safer)
	-- We'll enforce non-decreasing and add epsilon for exact duplicates if needed.
	local uniqueColorKeypoints = {}
	local uniqueAlphaKeypoints = {}
	local lastTime = -1
	for i = 0, #colorKeypoints - 1 do
		local t = colorKeypoints[i + 1].Time
		if t <= lastTime then
			t = math.clamp(lastTime + 0.001, 0, 1)
		end
		if t > lastTime or #uniqueColorKeypoints == 0 then
			local _colorSequenceKeypoint = ColorSequenceKeypoint.new(t, colorKeypoints[i + 1].Value)
			table.insert(uniqueColorKeypoints, _colorSequenceKeypoint)
			local _numberSequenceKeypoint = NumberSequenceKeypoint.new(t, alphaKeypoints[i + 1].Value)
			table.insert(uniqueAlphaKeypoints, _numberSequenceKeypoint)
			lastTime = t
		end
	end
	-- We must cap at 20 keypoints due to Roblox engine limits. 
	-- (Skipping downsampling for now as prompt doesn't strictly demand it, but good to know)
	-- Let's ensure time goes exactly up to 1 for the last one if it was squished.
	if uniqueColorKeypoints[#uniqueColorKeypoints].Time < 1 then
		-- Just ensure the last element is exactly 1, or adjust.
		-- Actually, if it's less than 1, Roblox might error if the last keypoint is not at Time=1.
		local lastC = uniqueColorKeypoints[#uniqueColorKeypoints]
		if lastC.Time ~= 1 then
			local _colorSequenceKeypoint = ColorSequenceKeypoint.new(1, lastC.Value)
			table.insert(uniqueColorKeypoints, _colorSequenceKeypoint)
		end
		local lastA = uniqueAlphaKeypoints[#uniqueAlphaKeypoints]
		if lastA.Time ~= 1 then
			local _numberSequenceKeypoint = NumberSequenceKeypoint.new(1, lastA.Value)
			table.insert(uniqueAlphaKeypoints, _numberSequenceKeypoint)
		end
	end
	if uniqueColorKeypoints[1].Time > 0 then
		local firstC = uniqueColorKeypoints[1]
		local _colorSequenceKeypoint = ColorSequenceKeypoint.new(0, firstC.Value)
		table.insert(uniqueColorKeypoints, 1, _colorSequenceKeypoint)
		local firstA = uniqueAlphaKeypoints[1]
		local _numberSequenceKeypoint = NumberSequenceKeypoint.new(0, firstA.Value)
		table.insert(uniqueAlphaKeypoints, 1, _numberSequenceKeypoint)
	end
	-- Enforce 20 keypoints max — Roblox engine hard-limits ColorSequence/NumberSequence to 20.
	-- Downsample by preserving first/last and evenly distributing interior points.
	if #uniqueColorKeypoints > 20 then
		log:warn("GRADIENT_KEYPOINT_LIMIT", "Gradient exceeds 20 keypoints, downsampling", {
			count = #uniqueColorKeypoints,
		})
		local _array = {}
		local _length = #_array
		table.move(uniqueColorKeypoints, 1, #uniqueColorKeypoints, _length + 1, _array)
		local srcColors = _array
		local _array_1 = {}
		local _length_1 = #_array_1
		table.move(uniqueAlphaKeypoints, 1, #uniqueAlphaKeypoints, _length_1 + 1, _array_1)
		local srcAlphas = _array_1
		local total = #srcColors
		local downsampled = { srcColors[1] }
		local downsampledAlpha = { srcAlphas[1] }
		-- Pick 18 evenly spaced interior points
		for i = 1, 18 do
			local idx = math.floor((i / 19) * (total - 1))
			local _arg0 = srcColors[idx + 1]
			table.insert(downsampled, _arg0)
			local _arg0_1 = srcAlphas[idx + 1]
			table.insert(downsampledAlpha, _arg0_1)
		end
		local _arg0 = srcColors[total]
		table.insert(downsampled, _arg0)
		local _arg0_1 = srcAlphas[total]
		table.insert(downsampledAlpha, _arg0_1)
		-- Replace the arrays in-place
		table.clear(uniqueColorKeypoints)
		table.clear(uniqueAlphaKeypoints)
		for _, kp in downsampled do
			table.insert(uniqueColorKeypoints, kp)
		end
		for _, kp in downsampledAlpha do
			table.insert(uniqueAlphaKeypoints, kp)
		end
	end
	local cSeq = ColorSequence.new(uniqueColorKeypoints)
	local tSeq = if hasTransparency then NumberSequence.new(uniqueAlphaKeypoints) else nil
	local robloxRotation = directionAngle - 90
	return makeParsedGradient(cSeq, tSeq, robloxRotation)
end
return {
	isGradientString = isGradientString,
	parseGradient = parseGradient,
}
