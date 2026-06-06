-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _react = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local React = _react
local forwardRef = _react.forwardRef
local webStyle = TS.import(script, script.Parent.Parent, "styles", "webStyle").webStyle
local useVariantResolver = TS.import(script, script.Parent, "useVariantResolver").useVariantResolver
local function textParser(style)
	return webStyle(style).props
end
--[[
	*
	 * MotionText component — Declarative animated equivalent of Text.
	 
]]
local MotionText = forwardRef(function(props, ref)
	local animate = props.animate
	local initial = props.initial
	local variants = props.variants
	local transition = props.transition
	local style = props.style
	local children = props.children
	local _binding = useVariantResolver(animate, initial, variants, transition, textParser)
	local animatedProps = _binding.animatedProps
	local staticProps = _binding.staticProps
	local defaultProps = {
		BackgroundTransparency = 1,
		TextWrapped = true,
		Text = "",
	}
	if props.Size == nil and (not style or (style.width == nil and style.height == nil)) then
		defaultProps.AutomaticSize = Enum.AutomaticSize.XY
	end
	local _object = table.clone(props)
	setmetatable(_object, nil)
	local explicitProps = _object
	explicitProps.animate = nil
	explicitProps.initial = nil
	explicitProps.variants = nil
	explicitProps.transition = nil
	explicitProps.style = nil
	explicitProps.children = nil
	explicitProps._motionTextProps = nil
	if type(children) == "string" or type(children) == "number" then
		explicitProps.Text = tostring(children)
	end
	local parsedStyleProps = {}
	local parsedStyleChildren = {}
	if style then
		local parsed = webStyle(style)
		parsedStyleProps = parsed.props
		parsedStyleChildren = parsed.children
		-- Specialized string manipulation for wordBreak
		if style.wordBreak ~= nil then
			if style.wordBreak == "break-all" then
				local _text = explicitProps.Text
				if type(_text) == "string" then
					explicitProps.Text = table.concat(string.split(explicitProps.Text, ""), "\u{200B}")
				end
			elseif style.wordBreak == "keep-all" then
				local _text = explicitProps.Text
				if type(_text) == "string" then
					explicitProps.Text = table.concat(string.split(explicitProps.Text, " "), "\n")
				end
			end
		end
		-- textTransform — mutate text content
		if style.textTransform ~= nil and style.textTransform ~= "none" then
			local _text = explicitProps.Text
			if type(_text) == "string" then
				if style.textTransform == "uppercase" then
					explicitProps.Text = string.upper((explicitProps.Text))
				elseif style.textTransform == "lowercase" then
					explicitProps.Text = string.lower((explicitProps.Text))
				elseif style.textTransform == "capitalize" then
					explicitProps.Text = (string.gsub((explicitProps.Text), "%w+", function(word)
						return string.upper(string.sub(word, 1, 1)) .. string.sub(word, 2)
					end))
				end
			end
		end
		-- textDecoration — wrap text in rich text tags (RichText=true is set by webStyle)
		if style.textDecoration ~= nil and style.textDecoration ~= "none" then
			local _text = explicitProps.Text
			if type(_text) == "string" then
				if style.textDecoration == "underline" then
					explicitProps.Text = `<u>{explicitProps.Text}</u>`
				elseif style.textDecoration == "line-through" then
					explicitProps.Text = `<s>{explicitProps.Text}</s>`
				end
			end
		end
	end
	local _attributes = {
		ref = ref,
	}
	for _k, _v in defaultProps do
		_attributes[_k] = _v
	end
	for _k, _v in parsedStyleProps do
		_attributes[_k] = _v
	end
	for _k, _v in explicitProps do
		_attributes[_k] = _v
	end
	for _k, _v in staticProps do
		_attributes[_k] = _v
	end
	for _k, _v in animatedProps do
		_attributes[_k] = _v
	end
	return React.createElement("textlabel", _attributes, parsedStyleChildren, if type(children) == "string" or type(children) == "number" then nil else children)
end)
return {
	MotionText = MotionText,
}
