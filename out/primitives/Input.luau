-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
--[[
	*
	 * Input.tsx — <input> equivalent for Roblox.
	 *
	 * Renders a <textbox> with web-like style props.
	 * Extends the core webStyle translation by adding input-specific mappings.
	 * Automatically maps web-like placeholder and onChange props to their
	 * Roblox equivalents for a more familiar developer experience.
	 *
	 * Input mappings:
	 *   Web Property        → Roblox Output
	 *   ─────────────────────────────────────────────────────────
	 *   placeholder         → PlaceholderText (string)
	 *   onChange(text)      → Change.Text (event listener)
	 *   style               → (Maps via webStyle)
	 *
	 * Maps to: HTML <input> → Roblox <textbox>
	 *
	 * Usage:
	 *   <Input
	 *     placeholder="Enter your name..."
	 *     onChange={(text) => print("User typed:", text)}
	 *     style={{ width: 200, height: 40, backgroundColor: "#FFFFFF" }}
	 *   />
	 
]]
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local useWebStyle = TS.import(script, script.Parent, "useWebStyle").useWebStyle
--[[
	*
	 * Branded InputProps — the `_inputProps` brand ensures strict nominal typing.
	 * This prevents accidental bypasses or incorrect prop structures.
	 
]]
--* Helper to construct a branded InputProps. 
local function makeInputProps(props)
	return props
end
--[[
	*
	 * Input component — The primary component for receiving user text input.
	 *
	 * Maps to: HTML <input> → Roblox <textbox>
	 * Renders a native <textbox> while mapping web input props to Roblox properties.
	 
]]
local Input = React.forwardRef(function(props, ref)
	local style = props.style
	local children = props.children
	local placeholder = props.placeholder
	local onChange = props.onChange
	local defaultProps = {
		BackgroundTransparency = 1,
		Text = "",
	}
	local _object = table.clone(props)
	setmetatable(_object, nil)
	local explicitProps = _object
	explicitProps.style = nil
	explicitProps.children = nil
	explicitProps.placeholder = nil
	explicitProps.onChange = nil
	if placeholder ~= nil then
		explicitProps.PlaceholderText = placeholder
	end
	-- Merge user-provided Change listeners with our internal Text handler
	-- to avoid silently overwriting user event handlers.
	local userChange = (props.Change) or {}
	local _object_1 = table.clone(userChange)
	setmetatable(_object_1, nil)
	local mergedChange = _object_1
	if onChange then
		mergedChange.Text = function(rbx)
			onChange(rbx.Text)
			-- Forward to user handler if present
			local userHandler = userChange.Text
			if userHandler ~= nil then
				userHandler(rbx)
			end
		end
	end
	explicitProps.Change = nil
	local hasChange = onChange ~= nil or (next(userChange)) ~= nil
	-- Cached across renders while the style values are unchanged — see useWebStyle.
	local parsed = useWebStyle(style)
	if parsed ~= nil then
		local _attributes = {
			ref = ref,
		}
		for _k, _v in defaultProps do
			_attributes[_k] = _v
		end
		for _k, _v in (parsed.props) do
			_attributes[_k] = _v
		end
		for _k, _v in explicitProps do
			_attributes[_k] = _v
		end
		for _k, _v in (if hasChange then {
			Change = mergedChange,
		} else {}) do
			_attributes[_k] = _v
		end
		return React.createElement("textbox", _attributes, parsed.children, children)
	end
	local _attributes = {
		ref = ref,
	}
	for _k, _v in defaultProps do
		_attributes[_k] = _v
	end
	for _k, _v in explicitProps do
		_attributes[_k] = _v
	end
	for _k, _v in (if hasChange then {
		Change = mergedChange,
	} else {}) do
		_attributes[_k] = _v
	end
	return React.createElement("textbox", _attributes, children)
end)
return {
	makeInputProps = makeInputProps,
	Input = Input,
}
