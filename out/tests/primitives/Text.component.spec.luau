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
-- The Text component is exported as Text, makeTextProps is exported as makeTextProps
local textModule = require(uiPrimitives:WaitForChild("Text"))
local Text = textModule.Text
local makeTextProps = textModule.makeTextProps
describe("Text primitives", function()
	describe("makeTextProps", function()
		it("should return the exact same object provided (branded cast)", function()
			local input = {
				Text = "Hello",
			}
			local result = makeTextProps(input)
			expect(result).toBe(input)
		end)
		it("should preserve identity of empty objects", function()
			local input = {}
			local result = makeTextProps(input)
			expect(result).toBe(input)
		end)
	end)
	describe("Text component", function()
		-- Helper to render the Text directly since it's a forwardRef component.
		-- forwardRef components in React have a .render function that we can call
		-- directly to test what element they produce without mounting.
		local renderText = function(props, ref)
			if ref == nil then
				ref = nil
			end
			-- Runs through a probe component: the primitive calls hooks now.
			return renderElement(Text.render, props, ref)
		end
		it("should render a textlabel element with default props", function()
			local element = renderText({})
			expect(element).toBeDefined()
			expect(element.type).toBe("TextLabel")
			expect(element.props.BackgroundTransparency).toBe(1)
			expect(element.props.TextWrapped).toBe(true)
		end)
		it("should pass explicit props to textlabel", function()
			local element = renderText({
				BackgroundTransparency = 0.5,
				Text = "Explicit",
			})
			expect(element.props.BackgroundTransparency).toBe(0.5)
			expect(element.props.Text).toBe("Explicit")
		end)
		it("should map primitive string children directly to Text property", function()
			local element = renderText({
				children = "String Child",
			})
			expect(element.props.Text).toBe("String Child")
			-- primitive children should not be rendered in the tree
			local childrenArray = element.props.children
			expect(childrenArray[2]).toBeUndefined()
		end)
		it("should map primitive number children directly to Text property", function()
			local element = renderText({
				children = 12345,
			})
			expect(element.props.Text).toBe("12345")
			local childrenArray = element.props.children
			expect(childrenArray[2]).toBeUndefined()
		end)
		it("should render React element children normally", function()
			local mockChild = React.createElement("uicorner", {
				CornerRadius = UDim.new(0, 5),
			})
			local element = renderText({
				children = mockChild,
			})
			local childrenArray = element.props.children
			expect(childrenArray[2]).toBe(mockChild)
			expect(element.props.Text).toBe("")
		end)
		it("should map fontSize to TextSize", function()
			local element = renderText({
				style = {
					fontSize = 24,
				},
			})
			expect(element.props.TextSize).toBe(24)
		end)
		it("should map textAlign to TextXAlignment", function()
			local element = renderText({
				style = {
					textAlign = "center",
				},
			})
			expect(element.props.TextXAlignment).toBe(Enum.TextXAlignment.Center)
			element = renderText({
				style = {
					textAlign = "right",
				},
			})
			expect(element.props.TextXAlignment).toBe(Enum.TextXAlignment.Right)
			element = renderText({
				style = {
					textAlign = "left",
				},
			})
			expect(element.props.TextXAlignment).toBe(Enum.TextXAlignment.Left)
			element = renderText({
				style = {
					textAlign = "unknown",
				},
			})
			expect(element.props.TextXAlignment).toBeUndefined()
		end)
		it("should map whiteSpace to TextWrapped", function()
			local element = renderText({
				style = {
					whiteSpace = "nowrap",
				},
			})
			expect(element.props.TextWrapped).toBe(false)
			element = renderText({
				style = {
					whiteSpace = "normal",
				},
			})
			expect(element.props.TextWrapped).toBe(true)
		end)
		it("should map wordBreak variants correctly", function()
			local element = renderText({
				style = {
					wordBreak = "normal",
				},
			})
			expect(element.props.TextWrapped).toBe(true)
			element = renderText({
				style = {
					wordBreak = "break-word",
				},
			})
			expect(element.props.TextWrapped).toBe(true)
			element = renderText({
				style = {
					wordBreak = "break-all",
				},
				Text = "Hello",
			})
			expect(element.props.TextWrapped).toBe(true)
			expect(element.props.Text).toBe("H\u{200B}e\u{200B}l\u{200B}l\u{200B}o")
			element = renderText({
				style = {
					wordBreak = "keep-all",
				},
				Text = "Hello World",
			})
			expect(element.props.TextWrapped).toBe(false)
			expect(element.props.Text).toBe("Hello\nWorld")
		end)
		it("should map color to TextColor3 and handle transparency", function()
			local element = renderText({
				style = {
					color = "#ff0000",
				},
			})
			local color = element.props.TextColor3
			expect(color).toBeDefined()
			expect(color.R).toBeCloseTo(1, 5)
			expect(color.G).toBeCloseTo(0, 5)
			expect(color.B).toBeCloseTo(0, 5)
			expect(element.props.TextTransparency).toBeUndefined()
			element = renderText({
				style = {
					color = "transparent",
				},
			})
			expect(element.props.TextTransparency).toBe(1)
		end)
		it("should map fontFamily and fontWeight to FontFace", function()
			-- Default family, regular weight if only fontFamily is given
			local element = renderText({
				style = {
					fontFamily = "Montserrat",
				},
			})
			local fontFace = element.props.FontFace
			expect(fontFace).toBeDefined()
			expect(fontFace.Family).toBe("rbxasset://fonts/families/Montserrat.json")
			expect(fontFace.Weight).toBe(Enum.FontWeight.Regular)
			-- Bold weight, default family
			element = renderText({
				style = {
					fontWeight = "bold",
				},
			})
			fontFace = element.props.FontFace
			expect(fontFace).toBeDefined()
			expect(fontFace.Family).toBe("rbxasset://fonts/families/BuilderSans.json")
			expect(fontFace.Weight).toBe(Enum.FontWeight.Bold)
			-- Black weight
			element = renderText({
				style = {
					fontWeight = "black",
				},
			})
			fontFace = element.props.FontFace
			expect(fontFace.Weight).toBe(Enum.FontWeight.Heavy)
			-- Unknown weight fallback
			element = renderText({
				style = {
					fontWeight = "unknown",
				},
			})
			fontFace = element.props.FontFace
			expect(fontFace.Weight).toBe(Enum.FontWeight.Regular)
		end)
		it("should apply webStyle and merge its props and children", function()
			local element = renderText({
				style = {
					width = "100px",
					borderRadius = "5px",
				},
				Text = "WebStyle Test",
			})
			expect(element.type).toBe("TextLabel")
			-- Explicit props preserved
			expect(element.props.Text).toBe("WebStyle Test")
			-- Style props mapped
			local size = element.props.Size
			expect(size).toBeDefined()
			expect(size.X.Offset).toBe(100)
			-- Style children injected
			expect(element.props.children).toBeDefined()
			local childrenArray = element.props.children
			local parsedChildren = childrenArray[1]
			expect(parsedChildren).toBeDefined()
			expect(#parsedChildren).toBe(1)
			expect(parsedChildren[1].type).toBe("UICorner")
			expect((parsedChildren[1].props.CornerRadius).Offset).toBe(5)
		end)
		it("should forward refs correctly", function()
			local mockRef = React.createRef()
			local element = renderText({}, mockRef)
			expect(element.ref).toBe(mockRef)
		end)
		it("should forward refs correctly when style is provided", function()
			local mockRef = React.createRef()
			local element = renderText({
				style = {
					width = "10px",
				},
			}, mockRef)
			expect(element.ref).toBe(mockRef)
		end)
		it("should apply textTransform uppercase", function()
			local element = renderText({
				children = "hello",
				style = {
					textTransform = "uppercase",
				},
			})
			expect(element.props.Text).toBe("HELLO")
		end)
		it("should apply textTransform lowercase", function()
			local element = renderText({
				children = "HELLO",
				style = {
					textTransform = "lowercase",
				},
			})
			expect(element.props.Text).toBe("hello")
		end)
		it("should apply textTransform capitalize", function()
			local element = renderText({
				children = "hello world",
				style = {
					textTransform = "capitalize",
				},
			})
			expect(element.props.Text).toBe("Hello World")
		end)
		it("should apply textTransform none (unchanged)", function()
			local element = renderText({
				children = "Hello",
				style = {
					textTransform = "none",
				},
			})
			expect(element.props.Text).toBe("Hello")
		end)
		it("should apply textDecoration underline", function()
			local element = renderText({
				children = "Hello",
				style = {
					textDecoration = "underline",
				},
			})
			expect(element.props.Text).toBe("<u>Hello</u>")
		end)
		it("should apply textDecoration line-through", function()
			local element = renderText({
				children = "Hello",
				style = {
					textDecoration = "line-through",
				},
			})
			expect(element.props.Text).toBe("<s>Hello</s>")
		end)
		it("should apply textDecoration none (unchanged)", function()
			local element = renderText({
				children = "Hello",
				style = {
					textDecoration = "none",
				},
			})
			expect(element.props.Text).toBe("Hello")
		end)
	end)
end)
