-- Compiled with roblox-ts v3.0.0
--[[
	*
	 * parseInlineImages.ts — Parses <img> tags from text strings into structured segments.
	 *
	 * Roblox's built-in RichText does NOT support inline images. This parser extracts
	 * standard HTML-style `<img src="..." width="N" height="N" />` tags so the InlineText
	 * component can render them as separate Image elements.
	 
]]
local IMG_PATTERN = '<img%s+src="([^"]*)"%s+width="(%d+)"%s+height="(%d+)"%s*/?>'
local function parseInlineImages(input)
	local segments = {}
	local searchStart = 1
	while true do
		local matchStart, matchEnd, src, widthStr, heightStr = string.find(input, IMG_PATTERN, searchStart)
		if matchStart == nil or matchEnd == nil then
			local remaining = string.sub(input, searchStart)
			if remaining ~= "" then
				local _arg0 = {
					type = "text",
					content = remaining,
				}
				table.insert(segments, _arg0)
			end
			break
		end
		if matchStart > searchStart then
			local before = string.sub(input, searchStart, matchStart - 1)
			if before ~= "" then
				local _arg0 = {
					type = "text",
					content = before,
				}
				table.insert(segments, _arg0)
			end
		end
		local _object = {
			type = "image",
			src = tostring(src),
		}
		local _left = "width"
		local _condition = tonumber(widthStr)
		if _condition == nil then
			_condition = 20
		end
		_object[_left] = _condition
		local _left_1 = "height"
		local _condition_1 = tonumber(heightStr)
		if _condition_1 == nil then
			_condition_1 = 20
		end
		_object[_left_1] = _condition_1
		table.insert(segments, _object)
		searchStart = matchEnd + 1
	end
	if #segments == 0 then
		local _arg0 = {
			type = "text",
			content = input,
		}
		table.insert(segments, _arg0)
	end
	return segments
end
local RICH_TEXT_TAG_PATTERN = "</?[biusBIUS]>"
local function containsRichTextTags(text)
	local simple = string.find(text, RICH_TEXT_TAG_PATTERN)
	if simple ~= nil then
		return true
	end
	local font = string.find(text, "<font%s")
	if font ~= nil then
		return true
	end
	local stroke = string.find(text, "<stroke%s")
	if stroke ~= nil then
		return true
	end
	local sc = string.find(text, "<sc>")
	if sc ~= nil then
		return true
	end
	local br = string.find(text, "<br%s*/?>")
	if br ~= nil then
		return true
	end
	return false
end
return {
	parseInlineImages = parseInlineImages,
	containsRichTextTags = containsRichTextTags,
}
