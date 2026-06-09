-- Compiled with roblox-ts v3.0.0
local _jestGlobals = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("node_modules"):WaitForChild("@rbxts"):WaitForChild("jest-globals"):WaitForChild("src"))
local _binding = _jestGlobals
local describe = _binding.describe
local expect = _binding.expect
local it = _binding.it
local beforeEach = _binding.beforeEach
local afterEach = _binding.afterEach
local _react = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("node_modules"):WaitForChild("@rbxts"):WaitForChild("react"))
local React = _react
local _binding_1 = _react
local createElement = _binding_1.createElement
local _reactRoblox = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("node_modules"):WaitForChild("@rbxts"):WaitForChild("react-roblox"))
local ReactRoblox = _reactRoblox
local _binding_2 = _reactRoblox
local act = _binding_2.act
local robloxCSS = game:GetService("ReplicatedStorage"):WaitForChild("roblox-css")
local primitivesFolder = robloxCSS:WaitForChild("primitives")
local stylesFolder = robloxCSS:WaitForChild("styles")
local _binding_3 = require(primitivesFolder:WaitForChild("usePercentageConstraints"))
local usePercentageConstraints = _binding_3.usePercentageConstraints
local _binding_4 = require(stylesFolder:WaitForChild("ParentSizeContext"))
local ParentSizeContext = _binding_4.ParentSizeContext
describe("usePercentageConstraints", function()
	local createdInstances = {}
	afterEach(function()
		for _, inst in createdInstances do
			inst:Destroy()
		end
		table.clear(createdInstances)
	end)
	it("should export usePercentageConstraints as a function", function()
		expect(type(usePercentageConstraints) == "function").toBe(true)
	end)
	it("should return undefined when called with undefined style", function()
		local result = "NOT_SET"
		local TestComponent = function()
			result = usePercentageConstraints(nil)
			return createElement("Frame")
		end
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(TestComponent))
		end)
		expect(result).toBeUndefined()
		act(function()
			root:unmount()
		end)
	end)
	it("should return undefined when no ParentSizeContext is provided", function()
		local result = "NOT_SET"
		local TestComponent = function()
			result = usePercentageConstraints({
				width = "50%",
			})
			return createElement("Frame")
		end
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			-- No provider!
			root:render(createElement(TestComponent))
		end)
		expect(result).toBeUndefined()
		act(function()
			root:unmount()
		end)
	end)
	it("should return undefined when constraint dimensions have zero Scale", function()
		local result = "NOT_SET"
		local parentSizeBinding = React.createBinding(Vector2.new(100, 100))
		local TestComponent = function()
			result = usePercentageConstraints({
				minWidth = "20px",
				maxWidth = 50,
			})
			return createElement("Frame")
		end
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(ParentSizeContext.Provider, {
				value = parentSizeBinding,
			}, createElement(TestComponent)))
		end)
		expect(result).toBeUndefined()
		act(function()
			root:unmount()
		end)
	end)
	it("should return a uisizeconstraint element when a percentage constraint is present", function()
		local result = "NOT_SET"
		local parentSizeBinding = React.createBinding(Vector2.new(100, 100))
		local TestComponent = function()
			result = usePercentageConstraints({
				maxWidth = "50%",
			})
			return createElement("Frame")
		end
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(ParentSizeContext.Provider, {
				value = parentSizeBinding,
			}, createElement(TestComponent)))
		end)
		expect(result).toBeDefined()
		expect(result.type).toBe("UISizeConstraint")
		act(function()
			root:unmount()
		end)
	end)
	it("should correctly compute MinSize/MaxSize bindings from percentage constraints", function()
		local parentSizeBinding, setParentSize = React.createBinding(Vector2.new(200, 400))
		local TestComponent = function()
			local constraint = usePercentageConstraints({
				minWidth = "10%",
				minHeight = "20%",
				maxWidth = "50%",
				maxHeight = "80%",
			})
			return createElement("Frame", {}, constraint)
		end
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(ParentSizeContext.Provider, {
				value = parentSizeBinding,
			}, createElement(TestComponent)))
		end)
		local frame = container:FindFirstChildOfClass("Frame")
		expect(frame).toBeDefined()
		local constraint = frame:FindFirstChildOfClass("UISizeConstraint")
		expect(constraint).toBeDefined()
		-- 10% of 200 = 20, 20% of 400 = 80
		expect(constraint.MinSize.X).toBe(20)
		expect(constraint.MinSize.Y).toBe(80)
		-- 50% of 200 = 100, 80% of 400 = 320
		expect(constraint.MaxSize.X).toBe(100)
		expect(constraint.MaxSize.Y).toBe(320)
		-- Verify reactive updating
		act(function()
			setParentSize(Vector2.new(1000, 1000))
		end)
		expect(constraint.MinSize.X).toBe(100)
		expect(constraint.MinSize.Y).toBe(200)
		expect(constraint.MaxSize.X).toBe(500)
		expect(constraint.MaxSize.Y).toBe(800)
		act(function()
			root:unmount()
		end)
	end)
end)
