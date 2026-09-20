-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _jest_globals = TS.import(script, TS.getModule(script, "@rbxts", "jest-globals").src)
local describe = _jest_globals.describe
local expect = _jest_globals.expect
local it = _jest_globals.it
local beforeEach = _jest_globals.beforeEach
local afterEach = _jest_globals.afterEach
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local _react_roblox = TS.import(script, TS.getModule(script, "@rbxts", "react-roblox"))
local ReactRoblox = _react_roblox
local act = _react_roblox.act
-- Dynamically require client files to bypass roblox-ts isolated container checks
local robloxCSS = game:GetService("ReplicatedStorage"):WaitForChild("roblox-css")
local uiPrimitives = robloxCSS:WaitForChild("primitives")
-- The Box component is exported as Box, makeBoxProps is exported as makeBoxProps
local boxModule = require(uiPrimitives:WaitForChild("Box"))
local Box = boxModule.Box
local makeBoxProps = boxModule.makeBoxProps
describe("Box primitives", function()
	describe("makeBoxProps", function()
		it("should return the exact same object provided (branded cast)", function()
			local input = {
				Size = UDim2.new(1, 0, 1, 0),
			}
			local result = makeBoxProps(input)
			expect(result).toBe(input)
		end)
		it("should preserve identity of empty objects", function()
			local input = {}
			local result = makeBoxProps(input)
			expect(result).toBe(input)
		end)
	end)
	describe("Box component", function()
		local container
		local root
		beforeEach(function()
			container = Instance.new("Folder")
			root = ReactRoblox.createRoot(container)
		end)
		afterEach(function()
			act(function()
				root:unmount()
			end)
			container:Destroy()
		end)
		local renderBox = function(props, ref)
			if ref == nil then
				ref = nil
			end
			act(function()
				local _root = root
				local _object = table.clone(props)
				setmetatable(_object, nil)
				_object.ref = ref
				_root:render(React.createElement(Box, _object))
			end)
			return container:GetChildren()[1]
		end
		-- Updated: Box now wraps in ParentSizeContext.Provider (ADR-0004)
		-- Converted to mounted test because Box now uses hooks unconditionally.
		it("should render a frame element without style", function()
			local element = renderBox({
				BackgroundTransparency = 0.5,
			})
			expect(element).toBeDefined()
			expect(element.ClassName).toBe("Frame")
			expect(element.BackgroundTransparency).toBe(0.5)
		end)
		-- Updated: Box now wraps in ParentSizeContext.Provider (ADR-0004)
		-- Converted to mounted test because Box now uses hooks unconditionally.
		it("should apply webStyle and merge its props and children", function()
			local element = renderBox({
				style = {
					width = "100px",
					borderRadius = "5px",
				},
				BackgroundTransparency = 0.5,
			})
			expect(element.ClassName).toBe("Frame")
			expect(element.BackgroundTransparency).toBe(0.5)
			local size = element.Size
			expect(size).toBeDefined()
			expect(size.X.Offset).toBe(100)
			expect(size.Y.Scale).toBeCloseTo(1, 5)
			local uiCorner = element:FindFirstChildWhichIsA("UICorner")
			expect(uiCorner).toBeDefined()
			expect(uiCorner.CornerRadius.Offset).toBe(5)
		end)
		-- Updated: Box now wraps in ParentSizeContext.Provider (ADR-0004)
		-- Converted to mounted test because Box now uses hooks unconditionally.
		it("should let explicit props override style props due to spread order", function()
			local element = renderBox({
				BackgroundColor3 = Color3.new(1, 1, 1),
				style = {
					backgroundColor = "#000000",
				},
			})
			local color = element.BackgroundColor3
			expect(color.R).toBe(1)
			expect(color.G).toBe(1)
			expect(color.B).toBe(1)
		end)
		-- Updated: Box now wraps in ParentSizeContext.Provider (ADR-0004)
		-- Converted to mounted test because Box now uses hooks unconditionally.
		it("should render explicit children alongside style children", function()
			local mockChild = React.createElement("TextLabel", {
				Text = "Hello World",
			})
			local element = renderBox({
				style = {
					padding = "10px",
				},
				children = mockChild,
			})
			expect(element.ClassName).toBe("Frame")
			local uiPadding = element:FindFirstChildWhichIsA("UIPadding")
			expect(uiPadding).toBeDefined()
			local childText = element:FindFirstChildWhichIsA("TextLabel")
			expect(childText).toBeDefined()
			expect(childText.Text).toBe("Hello World")
		end)
		-- Updated: Box now wraps in ParentSizeContext.Provider (ADR-0004)
		-- Converted to mounted test because Box now uses hooks unconditionally.
		it("should forward refs correctly", function()
			local mockRef = React.createRef()
			local element = renderBox({}, mockRef)
			expect(mockRef.current).toBe(element)
		end)
		-- Updated: Box now wraps in ParentSizeContext.Provider (ADR-0004)
		-- Converted to mounted test because Box now uses hooks unconditionally.
		it("should forward refs correctly when style is provided", function()
			local mockRef = React.createRef()
			local element = renderBox({
				style = {
					width = "10px",
				},
			}, mockRef)
			expect(mockRef.current).toBe(element)
		end)
	end)
end)
