-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _react = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local React = _react
local forwardRef = _react.forwardRef
local Box = TS.import(script, script.Parent, "Box").Box
local Text = TS.import(script, script.Parent, "Text").Text
local InlineText = TS.import(script, script.Parent, "InlineText").InlineText
local Div = Box
local Span = InlineText
local P = forwardRef(function(props, ref)
	local defaultStyle = {
		fontSize = 16,
	}
	local _result
	if props.style then
		local _object = table.clone(defaultStyle)
		setmetatable(_object, nil)
		for _k, _v in props.style do
			_object[_k] = _v
		end
		_result = _object
	else
		_result = defaultStyle
	end
	local mergedStyle = _result
	local _attributes = {
		ref = ref,
	}
	for _k, _v in props do
		_attributes[_k] = _v
	end
	_attributes.style = mergedStyle
	return React.createElement(Text, _attributes)
end)
local H1 = forwardRef(function(props, ref)
	local defaultStyle = {
		fontSize = 32,
		fontWeight = "bold",
	}
	local _result
	if props.style then
		local _object = table.clone(defaultStyle)
		setmetatable(_object, nil)
		for _k, _v in props.style do
			_object[_k] = _v
		end
		_result = _object
	else
		_result = defaultStyle
	end
	local mergedStyle = _result
	local _attributes = {
		ref = ref,
	}
	for _k, _v in props do
		_attributes[_k] = _v
	end
	_attributes.style = mergedStyle
	return React.createElement(Text, _attributes)
end)
local H2 = forwardRef(function(props, ref)
	local defaultStyle = {
		fontSize = 24,
		fontWeight = "bold",
	}
	local _result
	if props.style then
		local _object = table.clone(defaultStyle)
		setmetatable(_object, nil)
		for _k, _v in props.style do
			_object[_k] = _v
		end
		_result = _object
	else
		_result = defaultStyle
	end
	local mergedStyle = _result
	local _attributes = {
		ref = ref,
	}
	for _k, _v in props do
		_attributes[_k] = _v
	end
	_attributes.style = mergedStyle
	return React.createElement(Text, _attributes)
end)
local H3 = forwardRef(function(props, ref)
	local defaultStyle = {
		fontSize = 18,
		fontWeight = "bold",
	}
	local _result
	if props.style then
		local _object = table.clone(defaultStyle)
		setmetatable(_object, nil)
		for _k, _v in props.style do
			_object[_k] = _v
		end
		_result = _object
	else
		_result = defaultStyle
	end
	local mergedStyle = _result
	local _attributes = {
		ref = ref,
	}
	for _k, _v in props do
		_attributes[_k] = _v
	end
	_attributes.style = mergedStyle
	return React.createElement(Text, _attributes)
end)
return {
	Div = Div,
	Span = Span,
	P = P,
	H1 = H1,
	H2 = H2,
	H3 = H3,
}
