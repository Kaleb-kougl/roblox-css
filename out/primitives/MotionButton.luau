-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _react = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local React = _react
local forwardRef = _react.forwardRef
local webStyle = TS.import(script, script.Parent.Parent, "styles", "webStyle").webStyle
local useVariantResolver = TS.import(script, script.Parent, "useVariantResolver").useVariantResolver
local function buttonParser(style)
	-- Delegate entirely to webStyle() which already handles all typography
	-- properties (fontSize, textAlign, whiteSpace, color, fontFamily, fontWeight).
	-- Previously this duplicated that logic with a different default font (SourceSansPro
	-- vs BuilderSans), causing an inconsistency.
	local parsed = webStyle(style)
	local result = parsed.props
	-- Pass through Roblox-native properties (uppercase keys like Position, TextTransparency)
	-- that webStyle doesn't handle, matching the default parser behavior.
	for k, v in pairs(style) do
		if type(k) == "string" and k ~= "_parsed" and result[k] == nil then
			local firstChar = string.sub(k, 1, 1)
			if firstChar >= "A" and firstChar <= "Z" then
				result[k] = v
			end
		end
	end
	return result
end
--[[
	*
	 * MotionButton component — Declarative animated equivalent of Button.
	 
]]
local MotionButton = forwardRef(function(props, ref)
	local animate = props.animate
	local initial = props.initial
	local variants = props.variants
	local transition = props.transition
	local style = props.style
	local children = props.children
	local onClick = props.onClick
	local onMouseEnter = props.onMouseEnter
	local onMouseLeave = props.onMouseLeave
	local _binding = useVariantResolver(animate, initial, variants, transition, buttonParser)
	local animatedProps = _binding.animatedProps
	local staticProps = _binding.staticProps
	local defaultProps = {
		BackgroundTransparency = 1,
		TextWrapped = true,
		Text = "",
		AutoButtonColor = false,
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
	explicitProps.onClick = nil
	explicitProps.onMouseEnter = nil
	explicitProps.onMouseLeave = nil
	explicitProps._motionButtonProps = nil
	-- 3. Map primitive children directly to the Text property
	if type(children) == "string" or type(children) == "number" then
		explicitProps.Text = tostring(children)
	end
	local parsedStyleProps = {}
	local parsedStyleChildren = {}
	-- 4. If a style object is provided, compile it and extract typography mappings
	if style then
		local parsed = webStyle(style)
		parsedStyleProps = parsed.props
		parsedStyleChildren = parsed.children
		-- wordBreak — inject zero-width spaces or newlines for character-level wrapping
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
	-- 5. Map React-style event props to the Roblox Event table
	local existingEvents = (props.Event) or {}
	local _object_1 = table.clone(existingEvents)
	setmetatable(_object_1, nil)
	local mergedEvents = _object_1
	if onClick ~= nil then
		mergedEvents.Activated = onClick
	end
	if onMouseEnter ~= nil then
		mergedEvents.MouseEnter = onMouseEnter
	end
	if onMouseLeave ~= nil then
		mergedEvents.MouseLeave = onMouseLeave
	end
	explicitProps.Event = mergedEvents
	-- 6. Render the native textbutton with merged properties and children
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
	return React.createElement("textbutton", _attributes, parsedStyleChildren, if type(children) == "string" or type(children) == "number" then nil else children)
end)
return {
	MotionButton = MotionButton,
}
