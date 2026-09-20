-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
--[[
	*
	 * Button.tsx — <button> equivalent for Roblox.
	 *
	 * Renders a <textbutton> with web-like style props.
	 * Delegates CSS→Roblox translation to webStyle(), and adds text-content
	 * manipulation features (textTransform, textDecoration, wordBreak) that
	 * require mutating the Text string before rendering.
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
	 * Event mapping:
	 *   React Prop          → Roblox Output
	 *   ─────────────────────────────────────────────────────────
	 *   onClick             → Event.Activated
	 *   onMouseEnter        → Event.MouseEnter
	 *   onMouseLeave        → Event.MouseLeave
	 *
	 * Maps to: HTML <button> → Roblox <textbutton>
	 * 
	 * Usage:
	 *   <Button 
	 *     style={{ backgroundColor: "#007BFF", padding: "10px 20px", color: "white", borderRadius: "4px" }}
	 *     onClick={() => print("Clicked!")}
	 *   >
	 *     Submit
	 *   </Button>
	 
]]
local _react = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local React = _react
local forwardRef = _react.forwardRef
local useWebStyle = TS.import(script, script.Parent, "useWebStyle").useWebStyle
--[[
	*
	 * Branded ButtonProps — the `_buttonProps` brand ensures strict nominal typing.
	 * This prevents accidental bypasses or incorrect prop structures.
	 
]]
--* Helper to construct a branded ButtonProps. 
local function makeButtonProps(props)
	return props
end
--[[
	*
	 * Button component — The primary component for interactive clickable elements.
	 *
	 * Maps to: HTML <button> → Roblox <textbutton>
	 * Renders a native <textbutton>, mapping web styles and React-like event handlers (onClick, etc.).
	 
]]
local Button = forwardRef(function(props, ref)
	-- 1. Extract custom styling props, children, and event handlers
	local style = props.style
	local children = props.children
	local onClick = props.onClick
	local onMouseEnter = props.onMouseEnter
	local onMouseLeave = props.onMouseLeave
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
	explicitProps.style = nil
	explicitProps.children = nil
	explicitProps.onClick = nil
	explicitProps.onMouseEnter = nil
	explicitProps.onMouseLeave = nil
	-- 3. Map primitive children directly to the Text property
	if type(children) == "string" or type(children) == "number" then
		explicitProps.Text = tostring(children)
	end
	local parsedStyleProps = {}
	local parsedStyleChildren = {}
	-- Cached across renders while the style values are unchanged — see useWebStyle.
	local parsed = useWebStyle(style)
	-- 4. If a style object is provided, compile it and extract typography mappings
	if style ~= nil and parsed ~= nil then
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
	return React.createElement("textbutton", _attributes, parsedStyleChildren, if type(children) == "string" or type(children) == "number" then nil else children)
end)
return {
	makeButtonProps = makeButtonProps,
	Button = Button,
}
