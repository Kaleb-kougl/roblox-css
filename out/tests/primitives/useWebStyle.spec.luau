-- Compiled with roblox-ts v3.0.0
local _jestGlobals = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("node_modules"):WaitForChild("@rbxts"):WaitForChild("jest-globals"):WaitForChild("src"))
local _binding = _jestGlobals
local describe = _binding.describe
local expect = _binding.expect
local it = _binding.it
local afterEach = _binding.afterEach
local _react = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("node_modules"):WaitForChild("@rbxts"):WaitForChild("react"))
local _binding_1 = _react
local createElement = _binding_1.createElement
local _reactRoblox = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("node_modules"):WaitForChild("@rbxts"):WaitForChild("react-roblox"))
local ReactRoblox = _reactRoblox
local _binding_2 = _reactRoblox
local act = _binding_2.act
local robloxCSS = game:GetService("ReplicatedStorage"):WaitForChild("roblox-css")
local primitivesFolder = robloxCSS:WaitForChild("primitives")
local _binding_3 = require(primitivesFolder:WaitForChild("useWebStyle"))
local useWebStyle = _binding_3.useWebStyle
describe("useWebStyle", function()
	local createdInstances = {}
	afterEach(function()
		for _, inst in createdInstances do
			inst:Destroy()
		end
		table.clear(createdInstances)
	end)
	--[[
		*
			 * Renders `component` once per entry in `styles`, returning the hook result
			 * from each render so tests can compare identity across renders.
			 
	]]
	local function renderWithStyles(styles, hostTexts)
		-- Results are boxed because Luau arrays cannot hold nil elements.
		local results = {}
		local index = 0
		local TestComponent = function()
			local value = useWebStyle(styles[index + 1], if hostTexts ~= nil then hostTexts[index + 1] else nil)
			local _arg0 = {
				value = value,
			}
			table.insert(results, _arg0)
			return createElement("Frame")
		end
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		for i = 0, #styles - 1 do
			index = i
			act(function()
				root:render(createElement(TestComponent))
			end)
		end
		act(function()
			root:unmount()
		end)
		return results
	end
	it("should export useWebStyle as a function", function()
		expect(type(useWebStyle) == "function").toBe(true)
	end)
	it("should return undefined when called with undefined style", function()
		local _binding_4 = renderWithStyles({ nil })
		local result = _binding_4[1]
		expect(result.value).toBeUndefined()
	end)
	it("should parse the style on first render", function()
		local _binding_4 = renderWithStyles({ {
			width = "100px",
			height = "50px",
		} })
		local result = _binding_4[1]
		expect(result.value).never.toBeUndefined()
		expect((result.value).props.Size).never.toBeUndefined()
	end)
	it("should reuse the cached result for a new table with identical values", function()
		-- The point of the shallow comparison: inline style literals allocate a
		-- fresh table every render, so identity-keyed caching would never hit.
		local _binding_4 = renderWithStyles({ {
			width = "100px",
			backgroundColor = "#ff0000",
		}, {
			width = "100px",
			backgroundColor = "#ff0000",
		} })
		local first = _binding_4[1]
		local second = _binding_4[2]
		expect(first.value).never.toBeUndefined()
		expect(second.value).toBe(first.value)
	end)
	it("should reparse when a style value changes", function()
		local _binding_4 = renderWithStyles({ {
			width = "100px",
		}, {
			width = "200px",
		} })
		local first = _binding_4[1]
		local second = _binding_4[2]
		expect(second.value).never.toBe(first.value)
	end)
	it("should reparse when a style key is added", function()
		local _binding_4 = renderWithStyles({ {
			width = "100px",
		}, {
			width = "100px",
			height = "50px",
		} })
		local first = _binding_4[1]
		local second = _binding_4[2]
		expect(second.value).never.toBe(first.value)
	end)
	it("should reparse when a style key is removed", function()
		local _binding_4 = renderWithStyles({ {
			width = "100px",
			height = "50px",
		}, {
			width = "100px",
		} })
		local first = _binding_4[1]
		local second = _binding_4[2]
		expect(second.value).never.toBe(first.value)
	end)
	it("should reparse when hostText changes but the style does not", function()
		local _binding_4 = renderWithStyles({ {
			textShadow = "2px 2px #000000",
		}, {
			textShadow = "2px 2px #000000",
		} }, { "Hello", "Goodbye" })
		local first = _binding_4[1]
		local second = _binding_4[2]
		expect(second.value).never.toBe(first.value)
	end)
	it("should not serve a stale result when the caller mutates its style table in place", function()
		local shared = {
			width = "100px",
		}
		local results = {}
		local TestComponent = function()
			local _arg0 = {
				value = useWebStyle(shared),
			}
			table.insert(results, _arg0)
			return createElement("Frame")
		end
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(TestComponent))
		end)
		shared.width = "200px"
		act(function()
			root:render(createElement(TestComponent))
		end)
		act(function()
			root:unmount()
		end)
		expect(results[2].value).never.toBe(results[1].value)
	end)
end)
