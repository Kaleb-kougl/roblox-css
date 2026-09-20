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
local scrollBoxModule = require(uiPrimitives:WaitForChild("ScrollBox"))
local ScrollBox = scrollBoxModule.ScrollBox
describe("ScrollBox primitive", function()
	-- Helper to render the ScrollBox directly since it's a forwardRef component.
	-- forwardRef components in React have a .render function that we can call
	-- directly to test what element they produce without mounting.
	local renderScrollBox = function(props, ref)
		if ref == nil then
			ref = nil
		end
		-- Runs through a probe component: the primitive calls hooks now.
		return renderElement(ScrollBox.render, props, ref)
	end
	it("should render a ScrollingFrame element without style", function()
		local element = renderScrollBox({})
		expect(element).toBeDefined()
		expect(element.type).toBe("ScrollingFrame")
	end)
	it("should apply default props when no explicit overrides are provided", function()
		local element = renderScrollBox({})
		expect(element.props.BackgroundTransparency).toBe(1)
		expect(element.props.BorderSizePixel).toBe(0)
		expect(element.props.ScrollBarThickness).toBe(4)
		expect(element.props.ScrollBarImageTransparency).toBe(0.5)
		expect(element.props.AutomaticCanvasSize).toBe(Enum.AutomaticSize.Y)
	end)
	it("should let explicit props override default props", function()
		local element = renderScrollBox({
			BackgroundTransparency = 0,
			ScrollBarThickness = 12,
		})
		-- Explicit props should win due to spread order
		expect(element.props.BackgroundTransparency).toBe(0)
		expect(element.props.ScrollBarThickness).toBe(12)
		-- Other defaults should still apply
		expect(element.props.BorderSizePixel).toBe(0)
	end)
	it("should apply webStyle and merge its props and children", function()
		local element = renderScrollBox({
			style = {
				width = "100px",
				borderRadius = "5px",
			},
			BackgroundTransparency = 0.5,
		})
		expect(element.type).toBe("ScrollingFrame")
		-- Explicit props should be preserved
		expect(element.props.BackgroundTransparency).toBe(0.5)
		-- Style props should be mapped
		local size = element.props.Size
		expect(size).toBeDefined()
		expect(size.X.Offset).toBe(100)
		-- Style children should be injected
		expect(element.props.children).toBeDefined()
		local childrenArray = element.props.children
		local parsedChildren = childrenArray[1]
		expect(parsedChildren).toBeDefined()
		expect(#parsedChildren).toBe(1)
		expect(parsedChildren[1].type).toBe("UICorner")
		expect((parsedChildren[1].props.CornerRadius).Offset).toBe(5)
	end)
	it("should let explicit props override style props due to spread order", function()
		local element = renderScrollBox({
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
	it("should render explicit children alongside style children", function()
		local mockChild = React.createElement("textlabel", {
			Text = "Hello World",
		})
		local element = renderScrollBox({
			style = {
				padding = "10px",
			},
			children = mockChild,
		})
		expect(element.type).toBe("ScrollingFrame")
		local childrenArray = element.props.children
		expect(childrenArray).toBeDefined()
		local parsedChildren = childrenArray[1]
		local explicitChildren = childrenArray[2]
		-- Ensure style constraint was added
		expect(#parsedChildren).toBe(1)
		expect(parsedChildren[1].type).toBe("UIPadding")
		-- Ensure explicit child was preserved
		expect(explicitChildren).toBe(mockChild)
	end)
	it("should forward refs correctly", function()
		local mockRef = React.createRef()
		local element = renderScrollBox({}, mockRef)
		expect(element.ref).toBe(mockRef)
	end)
	it("should forward refs correctly when style is provided", function()
		local mockRef = React.createRef()
		local element = renderScrollBox({
			style = {
				width = "10px",
			},
		}, mockRef)
		expect(element.ref).toBe(mockRef)
	end)
	it("should not include style or children in the spread to the intrinsic element", function()
		local element = renderScrollBox({
			style = {
				width = "50px",
			},
			children = React.createElement("textlabel", {
				Text = "child",
			}),
		})
		-- style and children should be stripped from explicitProps
		expect(element.props.style).toBeUndefined()
		-- children is the React prop, not the raw one — but the raw `children` key
		-- should not leak into explicitProps as a string
	end)
end)
