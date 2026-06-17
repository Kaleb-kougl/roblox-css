-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
--[[
	*
	 * InlineText.tsx — Rich text with inline image support for Roblox.
	 *
	 * Parses `<img src="..." width="N" height="N" />` tags from text strings
	 * and renders them as a horizontal row of <Text> and <Image> elements.
	 *
	 * Roblox's built-in RichText does NOT support inline images, so this component
	 * splits the string into text and image segments, rendering each as a separate
	 * element inside a flex row container.
	 *
	 * When no images are found, falls back to a plain <Text> element.
	 *
	 * Usage:
	 *   <InlineText style={{ fontSize: 18, color: "#FFF" }}>
	 *     {"Hello <img src=\"rbxassetid://123\" width=\"20\" height=\"20\" /> World!"}
	 *   </InlineText>
	 
]]
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local Box = TS.import(script, script.Parent, "Box").Box
local Text = TS.import(script, script.Parent, "Text").Text
local Image = TS.import(script, script.Parent, "Image").Image
local _parseInlineImages = TS.import(script, script.Parent.Parent, "utils", "parseInlineImages")
local parseInlineImages = _parseInlineImages.parseInlineImages
local containsRichTextTags = _parseInlineImages.containsRichTextTags
local function InlineText(props)
	local _condition = props.Text
	if _condition == nil then
		_condition = ""
	end
	local text = _condition
	local _children = props.children
	local _condition_1 = type(_children) == "string"
	if not _condition_1 then
		local _children_1 = props.children
		_condition_1 = type(_children_1) == "number"
	end
	if _condition_1 then
		text = tostring(props.children)
	end
	local style = props.style
	local segments = parseInlineImages(text)
	-- Check if any segment is an image
	local hasImages = false
	for _, seg in segments do
		if seg.type == "image" then
			hasImages = true
			break
		end
	end
	-- --- Fallback: no images, render a plain <Text> ---
	if not hasImages then
		local _result
		if style then
			local _object = table.clone(style)
			setmetatable(_object, nil)
			_result = _object
		else
			_result = ({})
		end
		local textStyle = _result
		-- Auto-enable richText if the text contains RichText tags and it's not already
		-- being set by textDecoration (which sets RichText=true via webStyle)
		if textStyle.richText == nil and textStyle.textDecoration == nil and containsRichTextTags(text) then
			textStyle.richText = true
		end
		return React.createElement(Text, {
			style = textStyle,
			Text = text,
		})
	end
	-- --- Images found: render a flex row with Text and Image segments ---
	-- Only pass layout/positioning props to the Box (Frame) container.
	-- Text-specific props (font, color, etc.) go to the Text children only.
	local containerStyle = {
		display = "flex",
		flexDirection = "row",
		alignItems = "center",
	}
	if style then
		-- Layout / positioning / sizing — safe for Frame
		if style.width ~= nil then
			containerStyle.width = style.width
		end
		if style.height ~= nil then
			containerStyle.height = style.height
		end
		if style.position ~= nil then
			containerStyle.position = style.position
		end
		if style.left ~= nil then
			containerStyle.left = style.left
		end
		if style.right ~= nil then
			containerStyle.right = style.right
		end
		if style.top ~= nil then
			containerStyle.top = style.top
		end
		if style.bottom ~= nil then
			containerStyle.bottom = style.bottom
		end
		if style.padding ~= nil then
			containerStyle.padding = style.padding
		end
		if style.paddingLeft ~= nil then
			containerStyle.paddingLeft = style.paddingLeft
		end
		if style.paddingRight ~= nil then
			containerStyle.paddingRight = style.paddingRight
		end
		if style.paddingTop ~= nil then
			containerStyle.paddingTop = style.paddingTop
		end
		if style.paddingBottom ~= nil then
			containerStyle.paddingBottom = style.paddingBottom
		end
		if style.gap ~= nil then
			containerStyle.gap = style.gap
		end
		if style.backgroundColor ~= nil then
			containerStyle.backgroundColor = style.backgroundColor
		end
		if style.background ~= nil then
			containerStyle.background = style.background
		end
		if style.opacity ~= nil then
			containerStyle.opacity = style.opacity
		end
		if style.borderRadius ~= nil then
			containerStyle.borderRadius = style.borderRadius
		end
		if style.border ~= nil then
			containerStyle.border = style.border
		end
		if style.zIndex ~= nil then
			containerStyle.zIndex = style.zIndex
		end
		if style.overflow ~= nil then
			containerStyle.overflow = style.overflow
		end
		if style.visibility ~= nil then
			containerStyle.visibility = style.visibility
		end
		if style.maxWidth ~= nil then
			containerStyle.maxWidth = style.maxWidth
		end
		if style.maxHeight ~= nil then
			containerStyle.maxHeight = style.maxHeight
		end
		if style.minWidth ~= nil then
			containerStyle.minWidth = style.minWidth
		end
		if style.minHeight ~= nil then
			containerStyle.minHeight = style.minHeight
		end
		if style.justifyContent ~= nil then
			containerStyle.justifyContent = style.justifyContent
		end
		if style.flexWrap ~= nil then
			containerStyle.flexWrap = style.flexWrap
		end
		if style.boxShadow ~= nil then
			containerStyle.boxShadow = style.boxShadow
		end
	end
	-- ▼ ReadonlyArray.map ▼
	local _newValue = table.create(#segments)
	local _callback = function(segment, i)
		if segment.type == "text" then
			-- Build a text-specific style that inherits typography from parent style
			local segmentStyle = {}
			local _result = style
			if _result ~= nil then
				_result = _result.fontSize
			end
			if _result ~= nil then
				segmentStyle.fontSize = style.fontSize
			end
			local _result_1 = style
			if _result_1 ~= nil then
				_result_1 = _result_1.fontFamily
			end
			if _result_1 ~= nil then
				segmentStyle.fontFamily = style.fontFamily
			end
			local _result_2 = style
			if _result_2 ~= nil then
				_result_2 = _result_2.fontWeight
			end
			if _result_2 ~= nil then
				segmentStyle.fontWeight = style.fontWeight
			end
			local _result_3 = style
			if _result_3 ~= nil then
				_result_3 = _result_3.fontStyle
			end
			if _result_3 ~= nil then
				segmentStyle.fontStyle = style.fontStyle
			end
			local _result_4 = style
			if _result_4 ~= nil then
				_result_4 = _result_4.color
			end
			if _result_4 ~= nil then
				segmentStyle.color = style.color
			end
			local _result_5 = style
			if _result_5 ~= nil then
				_result_5 = _result_5.lineHeight
			end
			if _result_5 ~= nil then
				segmentStyle.lineHeight = style.lineHeight
			end
			local _result_6 = style
			if _result_6 ~= nil then
				_result_6 = _result_6.whiteSpace
			end
			if _result_6 ~= nil then
				segmentStyle.whiteSpace = style.whiteSpace
			end
			local _result_7 = style
			if _result_7 ~= nil then
				_result_7 = _result_7.textAlign
			end
			if _result_7 ~= nil then
				segmentStyle.textAlign = style.textAlign
			end
			local _result_8 = style
			if _result_8 ~= nil then
				_result_8 = _result_8.textVerticalAlign
			end
			if _result_8 ~= nil then
				segmentStyle.textVerticalAlign = style.textVerticalAlign
			end
			local _result_9 = style
			if _result_9 ~= nil then
				_result_9 = _result_9.opacity
			end
			if _result_9 ~= nil then
				segmentStyle.opacity = style.opacity
			end
			-- Always enable richText for text segments so <b>, <font> etc work
			segmentStyle.richText = true
			-- Apply textTransform and textDecoration from parent style
			local _result_10 = style
			if _result_10 ~= nil then
				_result_10 = _result_10.textTransform
			end
			if _result_10 ~= nil then
				segmentStyle.textTransform = style.textTransform
			end
			local _result_11 = style
			if _result_11 ~= nil then
				_result_11 = _result_11.textDecoration
			end
			if _result_11 ~= nil then
				segmentStyle.textDecoration = style.textDecoration
			end
			return React.createElement(Text, {
				key = `text-{i}`,
				style = segmentStyle,
				Text = segment.content,
			})
		end
		-- Image segment
		local _attributes = {
			key = `img-{i}`,
			src = segment.src,
		}
		local _object = {
			width = segment.width,
			height = segment.height,
		}
		local _left = "opacity"
		local _result = style
		if _result ~= nil then
			_result = _result.opacity
		end
		_object[_left] = _result
		_attributes.style = _object
		return React.createElement(Image, _attributes)
	end
	for _k, _v in segments do
		_newValue[_k] = _callback(_v, _k - 1, segments)
	end
	-- ▲ ReadonlyArray.map ▲
	return React.createElement(Box, {
		style = containerStyle,
	}, _newValue)
end
return {
	InlineText = InlineText,
}
