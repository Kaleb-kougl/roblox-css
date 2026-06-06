-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
--[[
	*
	 * Text.tsx — <span>/<p>/<h1> equivalent for Roblox.
	 *
	 * Renders a <textlabel> with web-like style props.
	 * Extends the core webStyle translation by adding typography-specific mappings.
	 * Automatically maps primitive string/number children to the Text property,
	 * while still supporting regular React children for nested elements.
	 *
	 * Typography mapping:
	 *   CSS Property        → Roblox Output
	 *   ─────────────────────────────────────────────────────────
	 *   fontSize            → TextSize (number)
	 *   fontFamily          → FontFace (Font object, defaults to BuilderSans)
	 *   fontWeight          → FontFace weight (normal/bold/black → Regular/Bold/Heavy)
	 *   textAlign           → TextXAlignment (left/center/right)
	 *   whiteSpace          → TextWrapped (nowrap → false, otherwise true)
	 *   color               → TextColor3 (Color3) + TextTransparency
	 *
	 * Maps to: HTML <span>/<p> → Roblox <textlabel>
	 * 
	 * Usage:
	 *   <Text style={{ fontSize: 24, fontWeight: "bold", color: "#FFFFFF" }}>
	 *     Hello Roblox!
	 *   </Text>
	 
]]
local _react = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local React = _react
local forwardRef = _react.forwardRef
local webStyle = TS.import(script, script.Parent.Parent, "styles", "webStyle").webStyle
--[[
	*
	 * Branded TextProps — the `_textProps` brand ensures strict nominal typing.
	 * This prevents accidental bypasses or incorrect prop structures.
	 
]]
--* Helper to construct a branded TextProps. 
local function makeTextProps(props)
	return props
end
--[[
	*
	 * Text component — The primary component for rendering typography.
	 *
	 * Maps to: HTML <span>/<p>/<h1> → Roblox <textlabel>
	 * Renders a native <textlabel> while mapping web typography styles to Roblox Font properties.
	 
]]
local Text = forwardRef(function(props, ref)
	-- 1. Extract custom styling props and children
	local style = props.style
	local children = props.children
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
	explicitProps.style = nil
	explicitProps.children = nil
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
	-- 5. Render the native textlabel with merged properties and children
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
	return React.createElement("textlabel", _attributes, parsedStyleChildren, if type(children) == "string" or type(children) == "number" then nil else children)
end)
return {
	makeTextProps = makeTextProps,
	Text = Text,
}
