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
	local _object = {
		display = "flex",
		flexDirection = "row",
		alignItems = "center",
	}
	for _k, _v in (style or {}) do
		_object[_k] = _v
	end
	local containerStyle = _object
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
			-- Always enable richText for text segments so <b>, <font> etc work
			segmentStyle.richText = true
			-- Apply textTransform and textDecoration from parent style
			local _result_9 = style
			if _result_9 ~= nil then
				_result_9 = _result_9.textTransform
			end
			if _result_9 ~= nil then
				segmentStyle.textTransform = style.textTransform
			end
			local _result_10 = style
			if _result_10 ~= nil then
				_result_10 = _result_10.textDecoration
			end
			if _result_10 ~= nil then
				segmentStyle.textDecoration = style.textDecoration
			end
			return React.createElement(Text, {
				key = `text-{i}`,
				style = segmentStyle,
				Text = segment.content,
			})
		end
		-- Image segment
		return React.createElement(Image, {
			key = `img-{i}`,
			src = segment.src,
			style = {
				width = segment.width,
				height = segment.height,
			},
		})
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
