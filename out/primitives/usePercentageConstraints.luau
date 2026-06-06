-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _react = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local React = _react
local useContext = _react.useContext
local ParentSizeContext = TS.import(script, script.Parent.Parent, "styles", "ParentSizeContext").ParentSizeContext
local parseDimension = TS.import(script, script.Parent.Parent, "styles", "dimensionParser").parseDimension
local function usePercentageConstraints(style)
	local parentSize = useContext(ParentSizeContext)
	if not parentSize then
		return nil
	end
	if not style then
		return nil
	end
	-- Extract Scale and Offset components from all four constraint properties.
	-- Scale is used for percentage axes; Offset is the pixel fallback for non-percentage axes.
	local minW = if style.minWidth ~= nil then parseDimension(style.minWidth) else nil
	local minH = if style.minHeight ~= nil then parseDimension(style.minHeight) else nil
	local maxW = if style.maxWidth ~= nil then parseDimension(style.maxWidth) else nil
	local maxH = if style.maxHeight ~= nil then parseDimension(style.maxHeight) else nil
	local _result = minW
	if _result ~= nil then
		_result = _result.Scale
	end
	local _condition = _result
	if _condition == nil then
		_condition = 0
	end
	local minWScale = _condition
	local _result_1 = minH
	if _result_1 ~= nil then
		_result_1 = _result_1.Scale
	end
	local _condition_1 = _result_1
	if _condition_1 == nil then
		_condition_1 = 0
	end
	local minHScale = _condition_1
	local _result_2 = maxW
	if _result_2 ~= nil then
		_result_2 = _result_2.Scale
	end
	local _condition_2 = _result_2
	if _condition_2 == nil then
		_condition_2 = 0
	end
	local maxWScale = _condition_2
	local _result_3 = maxH
	if _result_3 ~= nil then
		_result_3 = _result_3.Scale
	end
	local _condition_3 = _result_3
	if _condition_3 == nil then
		_condition_3 = 0
	end
	local maxHScale = _condition_3
	-- Only activate if at least one constraint has a Scale component
	if minWScale == 0 and minHScale == 0 and maxWScale == 0 and maxHScale == 0 then
		return nil
	end
	-- When this hook activates, it takes EXCLUSIVE ownership of the <uisizeconstraint>.
	-- For axes without a percentage, use the pixel (.Offset) fallback from parseDimension().
	-- This handles mixed cases like { minWidth: "200px", maxWidth: "50%" }.
	local _result_4 = minW
	if _result_4 ~= nil then
		_result_4 = _result_4.Offset
	end
	local _condition_4 = _result_4
	if _condition_4 == nil then
		_condition_4 = 0
	end
	local minWFallback = _condition_4
	local _result_5 = minH
	if _result_5 ~= nil then
		_result_5 = _result_5.Offset
	end
	local _condition_5 = _result_5
	if _condition_5 == nil then
		_condition_5 = 0
	end
	local minHFallback = _condition_5
	local _result_6 = maxW
	if _result_6 ~= nil then
		_result_6 = _result_6.Offset
	end
	local _condition_6 = _result_6
	if _condition_6 == nil then
		_condition_6 = math.huge
	end
	local maxWFallback = _condition_6
	local _result_7 = maxH
	if _result_7 ~= nil then
		_result_7 = _result_7.Offset
	end
	local _condition_7 = _result_7
	if _condition_7 == nil then
		_condition_7 = math.huge
	end
	local maxHFallback = _condition_7
	return React.createElement("uisizeconstraint", {
		MinSize = parentSize:map(function(ps)
			return Vector2.new(if minWScale > 0 then ps.X * minWScale else minWFallback, if minHScale > 0 then ps.Y * minHScale else minHFallback)
		end),
		MaxSize = parentSize:map(function(ps)
			return Vector2.new(if maxWScale > 0 then ps.X * maxWScale else maxWFallback, if maxHScale > 0 then ps.Y * maxHScale else maxHFallback)
		end),
	})
end
return {
	usePercentageConstraints = usePercentageConstraints,
}
