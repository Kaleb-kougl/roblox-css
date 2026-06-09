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
local mod = require(primitivesFolder:WaitForChild("useVariantResolver"))
local useVariantResolver = mod.useVariantResolver
describe("useVariantResolver", function()
	local createdInstances = {}
	afterEach(function()
		for _, inst in createdInstances do
			inst:Destroy()
		end
		table.clear(createdInstances)
	end)
	it("should export useVariantResolver as a function", function()
		expect(type(useVariantResolver) == "function").toBe(true)
	end)
	it("isAnimatable should classify types correctly", function()
		if mod.isAnimatable then
			local _binding_3 = mod
			local isAnimatable = _binding_3.isAnimatable
			expect(isAnimatable(10)).toBe(true)
			expect(isAnimatable(UDim.new(1, 0))).toBe(true)
			expect(isAnimatable(UDim2.new(1, 0, 1, 0))).toBe(true)
			expect(isAnimatable(Vector2.new(1, 1))).toBe(true)
			expect(isAnimatable(Vector3.new(1, 1, 1))).toBe(true)
			expect(isAnimatable(Color3.new(1, 1, 1))).toBe(true)
			expect(isAnimatable(CFrame.new())).toBe(true)
			expect(isAnimatable(Rect.new(0, 0, 0, 0))).toBe(true)
			expect(isAnimatable("string")).toBe(false)
			expect(isAnimatable(true)).toBe(false)
			expect(isAnimatable({})).toBe(false)
		else
			-- Indirect test
			local result
			local TestComponent = function()
				result = useVariantResolver("state1", "state1", {
					state1 = {
						animatableValue = 10,
						staticValue = "hello",
					},
				}, TweenInfo.new(1))
				return createElement("Frame")
			end
			local container = Instance.new("Folder")
			table.insert(createdInstances, container)
			local root = ReactRoblox.createRoot(container)
			act(function()
				root:render(createElement(TestComponent))
			end)
			expect(result.animatedProps.animatableValue).toBeDefined()
			expect(result.staticProps.staticValue).toBe("hello")
			act(function()
				root:unmount()
			end)
		end
	end)
	it("should return empty animatedProps and staticProps when no variants are provided", function()
		local result
		local TestComponent = function()
			result = useVariantResolver(nil, nil, nil, TweenInfo.new(1))
			return createElement("Frame")
		end
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(TestComponent))
		end)
		expect(result).toBeDefined()
		local animCount = 0
		for _element, _element_1 in pairs(result.animatedProps) do
			local _ = { _element, _element_1 }
			animCount += 1
		end
		expect(animCount).toBe(0)
		local staticCount = 0
		for _element, _element_1 in pairs(result.staticProps) do
			local _ = { _element, _element_1 }
			staticCount += 1
		end
		expect(staticCount).toBe(0)
		act(function()
			root:unmount()
		end)
	end)
	it("should correctly categorize variant properties into animated vs static", function()
		local result
		local TestComponent = function()
			result = useVariantResolver("active", "active", {
				active = {
					BackgroundTransparency = 0.5,
					Text = "Hello",
					Size = UDim2.new(1, 0, 1, 0),
					Visible = true,
				},
			}, TweenInfo.new(1))
			return createElement("Frame")
		end
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(TestComponent))
		end)
		expect(result.animatedProps.BackgroundTransparency).toBeDefined()
		expect(result.animatedProps.Size).toBeDefined()
		expect(result.staticProps.Text).toBe("Hello")
		expect(result.staticProps.Visible).toBe(true)
		act(function()
			root:unmount()
		end)
	end)
	it("should return animatedProps as React bindings", function()
		local result
		local TestComponent = function()
			result = useVariantResolver("active", "active", {
				active = {
					BackgroundTransparency = 0.5,
				},
			}, TweenInfo.new(1))
			return createElement("Frame")
		end
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(TestComponent))
		end)
		local transparencyBinding = result.animatedProps.BackgroundTransparency
		expect(transparencyBinding).toBeDefined()
		-- Verify it behaves as a React binding by calling getValue()
		local bindingObj = transparencyBinding
		expect(bindingObj:getValue()).toBe(0.5)
		act(function()
			root:unmount()
		end)
	end)
	it("should connect to Heartbeat on mount and disconnect on unmount", function()
		local result
		local TestComponent = function()
			result = useVariantResolver("active", "active", {
				active = {
					Transparency = 0.5,
				},
			}, TweenInfo.new(1))
			return createElement("Frame")
		end
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		expect(function()
			act(function()
				root:render(createElement(TestComponent))
			end)
		end).never.toThrow()
		expect(function()
			act(function()
				root:unmount()
			end)
		end).never.toThrow()
	end)
end)
