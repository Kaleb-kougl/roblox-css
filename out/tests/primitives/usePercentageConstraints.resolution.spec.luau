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
_G.__ROACT_17_MOCK_SCHEDULER__ = true
local robloxCSS = game:GetService("ReplicatedStorage"):WaitForChild("roblox-css")
local uiPrimitives = robloxCSS:WaitForChild("primitives")
local uiStyles = robloxCSS:WaitForChild("styles")
local parentSizeContextModule = require(uiStyles:WaitForChild("ParentSizeContext"))
local ParentSizeContext = parentSizeContextModule.ParentSizeContext
local usePercentageConstraintsModule = require(uiPrimitives:WaitForChild("usePercentageConstraints"))
-- Required by instructions to dynamically require the hook, even if tested indirectly via Box.
local _usePercentageConstraints = usePercentageConstraintsModule.usePercentageConstraints
local boxModule = require(uiPrimitives:WaitForChild("Box"))
local Box = boxModule.Box
local function TestWrapper(_param)
	local style = _param.style
	local parentBinding = _param.parentBinding
	if parentBinding then
		return React.createElement(ParentSizeContext.Provider, {
			value = parentBinding,
		}, React.createElement(Box, {
			style = style,
		}))
	end
	return React.createElement(Box, {
		style = style,
	})
end
describe("usePercentageConstraints hook", function()
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
	describe("Basic activation", function()
		it("returns no UISizeConstraint when no constraints are set", function()
			local mockBinding = React.createBinding(Vector2.new(800, 600))
			act(function()
				root:render(React.createElement(TestWrapper, {
					style = {},
					parentBinding = mockBinding,
				}))
			end)
			local constraint = container:FindFirstChildWhichIsA("UISizeConstraint", true)
			expect(constraint).toBeUndefined()
		end)
		it("returns no UISizeConstraint when style is undefined", function()
			local mockBinding = React.createBinding(Vector2.new(800, 600))
			act(function()
				root:render(React.createElement(TestWrapper, {
					style = nil,
					parentBinding = mockBinding,
				}))
			end)
			local constraint = container:FindFirstChildWhichIsA("UISizeConstraint", true)
			expect(constraint).toBeUndefined()
		end)
		it("returns no UISizeConstraint when all constraints are pixel-only", function()
			local mockBinding = React.createBinding(Vector2.new(800, 600))
			act(function()
				root:render(React.createElement(TestWrapper, {
					style = {
						maxWidth = 400,
						minHeight = "200px",
					},
					parentBinding = mockBinding,
				}))
			end)
			local constraint = container:FindFirstChildWhichIsA("UISizeConstraint", true)
			-- The hook returns undefined, but Box renders the constraint emitted by webStyle.
			expect(constraint).toBeDefined()
			expect(constraint.MaxSize.X).toBe(400)
			expect(constraint.MinSize.Y).toBe(200)
		end)
		it("returns no UISizeConstraint when no ParentSizeContext is provided", function()
			act(function()
				root:render(React.createElement(TestWrapper, {
					style = {
						maxWidth = "50%",
					},
				}))
			end)
			local constraint = container:FindFirstChildWhichIsA("UISizeConstraint", true)
			expect(constraint).toBeUndefined()
		end)
	end)
	describe("Single-axis percentage", function()
		it("resolves maxWidth: '50%' against parent size 800x600", function()
			local mockBinding = React.createBinding(Vector2.new(800, 600))
			act(function()
				root:render(React.createElement(TestWrapper, {
					style = {
						maxWidth = "50%",
					},
					parentBinding = mockBinding,
				}))
			end)
			local constraint = container:FindFirstChildWhichIsA("UISizeConstraint", true)
			expect(constraint).toBeDefined()
			expect(constraint.MaxSize.X).toBe(400)
			expect(constraint.MaxSize.Y).toBe(math.huge)
		end)
		it("resolves minHeight: '25%' against parent size 800x600", function()
			local mockBinding = React.createBinding(Vector2.new(800, 600))
			act(function()
				root:render(React.createElement(TestWrapper, {
					style = {
						minHeight = "25%",
					},
					parentBinding = mockBinding,
				}))
			end)
			local constraint = container:FindFirstChildWhichIsA("UISizeConstraint", true)
			expect(constraint).toBeDefined()
			expect(constraint.MinSize.Y).toBe(150)
			expect(constraint.MinSize.X).toBe(0)
		end)
		it("resolves minWidth: '10%' against parent size 1000x500", function()
			local mockBinding = React.createBinding(Vector2.new(1000, 500))
			act(function()
				root:render(React.createElement(TestWrapper, {
					style = {
						minWidth = "10%",
					},
					parentBinding = mockBinding,
				}))
			end)
			local constraint = container:FindFirstChildWhichIsA("UISizeConstraint", true)
			expect(constraint).toBeDefined()
			expect(constraint.MinSize.X).toBe(100)
			expect(constraint.MaxSize.X).toBe(math.huge)
			expect(constraint.MaxSize.Y).toBe(math.huge)
		end)
		it("resolves maxHeight: '75%' against parent size 400x800", function()
			local mockBinding = React.createBinding(Vector2.new(400, 800))
			act(function()
				root:render(React.createElement(TestWrapper, {
					style = {
						maxHeight = "75%",
					},
					parentBinding = mockBinding,
				}))
			end)
			local constraint = container:FindFirstChildWhichIsA("UISizeConstraint", true)
			expect(constraint).toBeDefined()
			expect(constraint.MaxSize.Y).toBe(600)
		end)
	end)
	describe("Multi-axis percentage", function()
		it("resolves all four axes as percentages", function()
			local mockBinding = React.createBinding(Vector2.new(1000, 500))
			act(function()
				root:render(React.createElement(TestWrapper, {
					style = {
						minWidth = "10%",
						maxWidth = "90%",
						minHeight = "20%",
						maxHeight = "80%",
					},
					parentBinding = mockBinding,
				}))
			end)
			local constraint = container:FindFirstChildWhichIsA("UISizeConstraint", true)
			expect(constraint).toBeDefined()
			expect(constraint.MinSize.X).toBe(100)
			expect(constraint.MinSize.Y).toBe(100)
			expect(constraint.MaxSize.X).toBe(900)
			expect(constraint.MaxSize.Y).toBe(400)
		end)
	end)
	describe("Mixed pixel + percentage", function()
		it("handles minWidth pixel + maxWidth percentage", function()
			local mockBinding = React.createBinding(Vector2.new(1000, 500))
			act(function()
				root:render(React.createElement(TestWrapper, {
					style = {
						minWidth = "200px",
						maxWidth = "50%",
					},
					parentBinding = mockBinding,
				}))
			end)
			local constraint = container:FindFirstChildWhichIsA("UISizeConstraint", true)
			expect(constraint).toBeDefined()
			expect(constraint.MinSize.X).toBe(200)
			expect(constraint.MaxSize.X).toBe(500)
		end)
		it("handles minHeight percentage + maxHeight pixel", function()
			local mockBinding = React.createBinding(Vector2.new(800, 600))
			act(function()
				root:render(React.createElement(TestWrapper, {
					style = {
						minHeight = "10%",
						maxHeight = "300px",
					},
					parentBinding = mockBinding,
				}))
			end)
			local constraint = container:FindFirstChildWhichIsA("UISizeConstraint", true)
			expect(constraint).toBeDefined()
			expect(constraint.MinSize.Y).toBe(60)
			expect(constraint.MaxSize.Y).toBe(300)
		end)
	end)
	describe("Default fallback values", function()
		it("defaults absent MinSize axes to 0", function()
			local mockBinding = React.createBinding(Vector2.new(800, 600))
			act(function()
				root:render(React.createElement(TestWrapper, {
					style = {
						maxWidth = "50%",
					},
					parentBinding = mockBinding,
				}))
			end)
			local constraint = container:FindFirstChildWhichIsA("UISizeConstraint", true)
			expect(constraint).toBeDefined()
			expect(constraint.MinSize.X).toBe(0)
			expect(constraint.MinSize.Y).toBe(0)
		end)
		it("defaults absent MaxSize axes to math.huge", function()
			local mockBinding = React.createBinding(Vector2.new(800, 600))
			act(function()
				root:render(React.createElement(TestWrapper, {
					style = {
						minWidth = "10%",
					},
					parentBinding = mockBinding,
				}))
			end)
			local constraint = container:FindFirstChildWhichIsA("UISizeConstraint", true)
			expect(constraint).toBeDefined()
			expect(constraint.MaxSize.X).toBe(math.huge)
			expect(constraint.MaxSize.Y).toBe(math.huge)
		end)
	end)
end)
