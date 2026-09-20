-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _jest_globals = TS.import(script, TS.getModule(script, "@rbxts", "jest-globals").src)
local describe = _jest_globals.describe
local expect = _jest_globals.expect
local it = _jest_globals.it
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local renderElement = TS.import(script, script.Parent.Parent, "renderProbe").renderElement
-- Dynamically require client files to bypass roblox-ts isolated container checks
local robloxCSS = game:GetService("ReplicatedStorage"):WaitForChild("roblox-css")
local uiPrimitives = robloxCSS:WaitForChild("primitives")
local inputModule = require(uiPrimitives:WaitForChild("Input"))
local Input = inputModule.Input
local makeInputProps = inputModule.makeInputProps
describe("Input primitives", function()
	describe("makeInputProps", function()
		it("should return the exact same object provided (branded cast)", function()
			local props = {
				placeholder = "test",
			}
			local result = makeInputProps(props)
			expect(result).toBe(props)
		end)
		it("should preserve identity of empty objects", function()
			local input = {}
			local result = makeInputProps(input)
			expect(result).toBe(input)
		end)
	end)
	describe("Input component", function()
		local renderInput = function(props, ref)
			if ref == nil then
				ref = nil
			end
			-- Runs through a probe component: the primitive calls hooks now.
			return renderElement(Input.render, props, ref)
		end
		it("should render a textbox element without style and onChange", function()
			local element = renderInput({
				BackgroundTransparency = 0.5,
			})
			expect(element).toBeDefined()
			expect(element.type).toBe("TextBox")
			expect(element.props.BackgroundTransparency).toBe(0.5)
			expect(element.props.style).toBeUndefined()
			expect(element.props.children).toBeUndefined()
			expect(element.props.placeholder).toBeUndefined()
			expect(element.props.onChange).toBeUndefined()
		end)
		it("should map placeholder to PlaceholderText", function()
			local element = renderInput({
				placeholder = "Enter text...",
			})
			expect(element.props.PlaceholderText).toBe("Enter text...")
		end)
		it("should render explicit children", function()
			local mockChild = React.createElement("textlabel", {
				Text = "Hello World",
			})
			local element = renderInput({
				children = mockChild,
			})
			expect(element.props.children).toBe(mockChild)
		end)
		it("should forward refs correctly", function()
			local mockRef = React.createRef()
			local element = renderInput({}, mockRef)
			expect(element.ref).toBe(mockRef)
		end)
		it("should render with style but no onChange", function()
			local mockChild = React.createElement("textlabel", {
				Text = "Hello",
			})
			local element = renderInput({
				style = {
					width = "100px",
					padding = "10px",
				},
				children = mockChild,
			})
			expect(element.type).toBe("TextBox")
			local size = element.props.Size
			expect(size).toBeDefined()
			expect(size.X.Offset).toBe(100)
			local childrenArray = element.props.children
			expect(childrenArray).toBeDefined()
			local parsedChildren = childrenArray[1]
			local explicitChildren = childrenArray[2]
			expect(#parsedChildren).toBe(1)
			expect(parsedChildren[1].type).toBe("UIPadding")
			expect(explicitChildren).toBe(mockChild)
		end)
		it("should render with onChange but no style", function()
			local changedText = ""
			local handleChange = function(text)
				changedText = text
			end
			local mockChild = React.createElement("textlabel", {
				Text = "Child",
			})
			local element = renderInput({
				onChange = handleChange,
				children = mockChild,
			})
			expect(element.type).toBe("TextBox")
			local changeHandler
			for k, v in element.props do
				if type(v) == "function" then
					changeHandler = v
				end
			end
			expect(changeHandler).toBeDefined()
			changeHandler({
				Text = "NewText",
			})
			expect(changedText).toBe("NewText")
			expect(element.props.children).toBe(mockChild)
		end)
		it("should render with style and onChange", function()
			local changedText = ""
			local handleChange = function(text)
				changedText = text
			end
			local mockChild = React.createElement("textlabel", {
				Text = "Child",
			})
			local mockRef = React.createRef()
			local element = renderInput({
				style = {
					width = "50px",
				},
				onChange = handleChange,
				children = mockChild,
			}, mockRef)
			expect(element.type).toBe("TextBox")
			expect(element.ref).toBe(mockRef)
			local size = element.props.Size
			expect(size.X.Offset).toBe(50)
			local changeHandler
			for k, v in element.props do
				if type(v) == "function" then
					changeHandler = v
				end
			end
			expect(changeHandler).toBeDefined()
			changeHandler({
				Text = "HelloStyle",
			})
			expect(changedText).toBe("HelloStyle")
			local childrenArray = element.props.children
			expect(childrenArray).toBeDefined()
			local parsedChildren = childrenArray[1]
			local explicitChildren = childrenArray[2]
			expect(#parsedChildren).toBe(0)
			expect(explicitChildren).toBe(mockChild)
		end)
		-- ── P1: Change prop merging ──────────────────────────────────
		it("should merge onChange with user Change.Text — both fire", function()
			local onChangeFired = false
			local userHandlerFired = false
			local handleChange = function(_text)
				onChangeFired = true
			end
			local userTextHandler = function(_rbx)
				userHandlerFired = true
			end
			local element = renderInput({
				onChange = handleChange,
				Change = {
					Text = userTextHandler,
				},
			})
			-- Find the merged Change table in the rendered element props
			local mergedChange
			for k, v in element.props do
				if type(v) == "table" and not (type(v) == "function") then
					-- The Change prop is a table with handler functions
					local tbl = v
					if tbl.Text ~= nil then
						mergedChange = tbl
					end
				end
			end
			expect(mergedChange).toBeDefined()
			expect(mergedChange.Text).toBeDefined()
			-- Call the merged Text handler — should fire both onChange and user handler
			local textHandler = mergedChange.Text
			textHandler({
				Text = "test",
			})
			expect(onChangeFired).toBe(true)
			expect(userHandlerFired).toBe(true)
		end)
		it("should preserve user Change.AbsoluteSize alongside onChange", function()
			local userAbsSizeFired = false
			local handleChange = function(_text) end
			local userAbsSizeHandler = function(_rbx)
				userAbsSizeFired = true
			end
			local element = renderInput({
				onChange = handleChange,
				Change = {
					AbsoluteSize = userAbsSizeHandler,
				},
			})
			-- Find the merged Change table
			local mergedChange
			for k, v in element.props do
				if type(v) == "table" and not (type(v) == "function") then
					local tbl = v
					if tbl.Text ~= nil or tbl.AbsoluteSize ~= nil then
						mergedChange = tbl
					end
				end
			end
			expect(mergedChange).toBeDefined()
			-- onChange creates a Text handler
			expect(mergedChange.Text).toBeDefined()
			-- User's AbsoluteSize handler should be preserved
			expect(mergedChange.AbsoluteSize).toBeDefined()
		end)
		it("should pass through user Change.Text when no onChange is provided", function()
			local userHandlerFired = false
			local userTextHandler = function(_rbx)
				userHandlerFired = true
			end
			local element = renderInput({
				Change = {
					Text = userTextHandler,
				},
			})
			-- Find the Change table — should contain the user's handler directly
			local foundUserHandler = false
			for _k, v in element.props do
				if v == userTextHandler then
					foundUserHandler = true
				end
				if type(v) == "table" and not (type(v) == "function") then
					local tbl = v
					if tbl.Text == userTextHandler then
						foundUserHandler = true
					end
				end
			end
			expect(foundUserHandler).toBe(true)
		end)
	end)
end)
