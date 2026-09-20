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
-- The Button component is exported as Button, makeButtonProps is exported as makeButtonProps
local buttonModule = require(uiPrimitives:WaitForChild("Button"))
local Button = buttonModule.Button
local makeButtonProps = buttonModule.makeButtonProps
describe("Button primitives", function()
	describe("makeButtonProps", function()
		it("should return the exact same object provided (branded cast)", function()
			local input = {
				Text = "Click me",
			}
			local result = makeButtonProps(input)
			expect(result).toBe(input)
		end)
		it("should preserve identity of empty objects", function()
			local input = {}
			local result = makeButtonProps(input)
			expect(result).toBe(input)
		end)
	end)
	describe("Button component", function()
		-- Helper to render the Button directly since it's a forwardRef component.
		local renderButton = function(props, ref)
			if ref == nil then
				ref = nil
			end
			-- Runs through a probe component: the primitive calls hooks now.
			return renderElement(Button.render, props, ref)
		end
		it("should render a textbutton element without style", function()
			local element = renderButton({
				BackgroundTransparency = 0.5,
			})
			expect(element).toBeDefined()
			expect(element.type).toBe("TextButton")
			expect(element.props.BackgroundTransparency).toBe(0.5)
			expect(element.props.TextWrapped).toBe(true)
			expect(element.props.Size).toBeUndefined()
		end)
		it("should apply webStyle and merge its props and children", function()
			local element = renderButton({
				style = {
					width = "100px",
					borderRadius = "5px",
				},
				BackgroundTransparency = 0.5,
			})
			expect(element.type).toBe("TextButton")
			expect(element.props.BackgroundTransparency).toBe(0.5)
			local size = element.props.Size
			expect(size).toBeDefined()
			expect(size.X.Offset).toBe(100)
			local childrenArray = element.props.children
			expect(childrenArray).toBeDefined()
			local parsedChildren = childrenArray[1]
			expect(parsedChildren).toBeDefined()
			expect(#parsedChildren).toBe(1)
			expect(parsedChildren[1].type).toBe("UICorner")
			expect((parsedChildren[1].props.CornerRadius).Offset).toBe(5)
		end)
		it("should let explicit props override style props due to spread order", function()
			-- Button.tsx uses: <textbutton {...defaultProps} {...parsedStyleProps} {...explicitProps}>
			-- Therefore, explicit props should overwrite parsedStyleProps.
			local element = renderButton({
				BackgroundColor3 = Color3.new(1, 1, 1),
				style = {
					backgroundColor = "#000000",
				},
			})
			expect(element.props.BackgroundColor3).toBeDefined()
			local color = element.props.BackgroundColor3
			expect(color.R).toBe(1)
			expect(color.G).toBe(1)
			expect(color.B).toBe(1)
		end)
		it("should map primitive children to the Text property", function()
			local strElement = renderButton({
				children = "Hello World",
			})
			expect(strElement.props.Text).toBe("Hello World")
			local childrenArrayStr = strElement.props.children
			expect(childrenArrayStr[2]).toBeUndefined()
			local numElement = renderButton({
				children = 42,
			})
			expect(numElement.props.Text).toBe("42")
			local childrenArrayNum = numElement.props.children
			expect(childrenArrayNum[2]).toBeUndefined()
		end)
		it("should render explicit React elements as children instead of text", function()
			local mockChild = React.createElement("frame")
			local element = renderButton({
				style = {
					padding = "10px",
				},
				children = mockChild,
			})
			expect(element.props.Text).toBe("")
			local childrenArray = element.props.children
			expect(childrenArray).toBeDefined()
			local parsedChildren = childrenArray[1]
			local explicitChildren = childrenArray[2]
			expect(#parsedChildren).toBe(1)
			expect(parsedChildren[1].type).toBe("UIPadding")
			expect(explicitChildren).toBe(mockChild)
		end)
		it("should map typography style properties", function()
			local element = renderButton({
				style = {
					fontSize = 24,
					fontFamily = "rbxasset://fonts/families/Roboto.json",
					fontWeight = "bold",
					textAlign = "center",
					whiteSpace = "nowrap",
					color = "#ff0000",
				},
			})
			expect(element.props.TextSize).toBe(24)
			expect(element.props.TextXAlignment).toBe(Enum.TextXAlignment.Center)
			expect(element.props.TextWrapped).toBe(false)
			local font = element.props.FontFace
			expect(font).toBeDefined()
			expect(font.Family).toBe("rbxasset://fonts/families/Roboto.json")
			expect(font.Weight).toBe(Enum.FontWeight.Bold)
			local color = element.props.TextColor3
			expect(color).toBeDefined()
			expect(color.R).toBe(1)
			expect(color.G).toBe(0)
			expect(color.B).toBe(0)
			expect(element.props.TextTransparency).toBeUndefined()
		end)
		it("should map typography style property defaults", function()
			local element = renderButton({
				style = {
					fontFamily = nil,
					fontWeight = "unknown",
				},
			})
			local font = element.props.FontFace
			expect(font).toBeDefined()
			expect(font.Family).toBe("rbxasset://fonts/families/SourceSansPro.json")
			expect(font.Weight).toBe(Enum.FontWeight.Regular)
		end)
		it("should map transparent color", function()
			local element = renderButton({
				style = {
					color = "transparent",
				},
			})
			expect(element.props.TextTransparency).toBe(1)
		end)
		it("should map React-style event props to the Roblox Event table", function()
			local mockOnClick = function() end
			local mockOnMouseEnter = function() end
			local mockOnMouseLeave = function() end
			local element = renderButton({
				onClick = mockOnClick,
				onMouseEnter = mockOnMouseEnter,
				onMouseLeave = mockOnMouseLeave,
			})
			local foundActivated = false
			local foundMouseEnter = false
			local foundMouseLeave = false
			for key, value in element.props do
				if value == mockOnClick then
					foundActivated = true
				end
				if value == mockOnMouseEnter then
					foundMouseEnter = true
				end
				if value == mockOnMouseLeave then
					foundMouseLeave = true
				end
			end
			expect(foundActivated).toBe(true)
			expect(foundMouseEnter).toBe(true)
			expect(foundMouseLeave).toBe(true)
		end)
		it("should merge with existing Event table", function()
			local existingActivated = function() end
			local mockOnClick = function() end
			local element = renderButton({
				onClick = mockOnClick,
				Event = {
					SelectionGained = existingActivated,
				},
			})
			local foundActivated = false
			local foundSelectionGained = false
			for key, value in element.props do
				if value == mockOnClick then
					foundActivated = true
				end
				if value == existingActivated then
					foundSelectionGained = true
				end
			end
			expect(foundActivated).toBe(true)
			expect(foundSelectionGained).toBe(true)
		end)
		it("should forward refs correctly", function()
			local mockRef = React.createRef()
			local element = renderButton({}, mockRef)
			expect(element.ref).toBe(mockRef)
		end)
		it("should apply textTransform uppercase", function()
			local element = renderButton({
				children = "hello",
				style = {
					textTransform = "uppercase",
				},
			})
			expect(element.props.Text).toBe("HELLO")
		end)
		it("should apply textTransform lowercase", function()
			local element = renderButton({
				children = "HELLO",
				style = {
					textTransform = "lowercase",
				},
			})
			expect(element.props.Text).toBe("hello")
		end)
		it("should apply textTransform capitalize", function()
			local element = renderButton({
				children = "hello world",
				style = {
					textTransform = "capitalize",
				},
			})
			expect(element.props.Text).toBe("Hello World")
		end)
		it("should apply textTransform none (unchanged)", function()
			local element = renderButton({
				children = "Hello",
				style = {
					textTransform = "none",
				},
			})
			expect(element.props.Text).toBe("Hello")
		end)
		it("should apply textDecoration underline", function()
			local element = renderButton({
				children = "Hello",
				style = {
					textDecoration = "underline",
				},
			})
			expect(element.props.Text).toBe("<u>Hello</u>")
		end)
		it("should apply textDecoration line-through", function()
			local element = renderButton({
				children = "Hello",
				style = {
					textDecoration = "line-through",
				},
			})
			expect(element.props.Text).toBe("<s>Hello</s>")
		end)
		it("should apply textDecoration none (unchanged)", function()
			local element = renderButton({
				children = "Hello",
				style = {
					textDecoration = "none",
				},
			})
			expect(element.props.Text).toBe("Hello")
		end)
		it("should apply wordBreak break-all with zero-width spaces", function()
			local element = renderButton({
				children = "Hello",
				style = {
					wordBreak = "break-all",
				},
			})
			expect(element.props.TextWrapped).toBe(true)
			expect(element.props.Text).toBe("H\u{200B}e\u{200B}l\u{200B}l\u{200B}o")
		end)
		it("should apply wordBreak keep-all with newline replacement", function()
			local element = renderButton({
				children = "Hello World",
				style = {
					wordBreak = "keep-all",
				},
			})
			expect(element.props.TextWrapped).toBe(false)
			expect(element.props.Text).toBe("Hello\nWorld")
		end)
	end)
end)
