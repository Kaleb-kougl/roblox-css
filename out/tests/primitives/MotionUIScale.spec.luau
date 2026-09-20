-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local createElement = TS.import(script, TS.getModule(script, "@rbxts", "react")).createElement
local _react_roblox = TS.import(script, TS.getModule(script, "@rbxts", "react-roblox"))
local ReactRoblox = _react_roblox
local act = _react_roblox.act
local _jest_globals = TS.import(script, TS.getModule(script, "@rbxts", "jest-globals").src)
local describe = _jest_globals.describe
local expect = _jest_globals.expect
local it = _jest_globals.it
local afterEach = _jest_globals.afterEach
local robloxCSS = game:GetService("ReplicatedStorage"):WaitForChild("roblox-css")
local primitivesFolder = robloxCSS:WaitForChild("primitives")
local _binding = require(primitivesFolder:WaitForChild("MotionUIScale"))
local MotionUIScale = _binding.MotionUIScale
describe("MotionUIScale Component", function()
	local createdInstances = {}
	afterEach(function()
		for _, inst in createdInstances do
			inst:Destroy()
		end
		table.clear(createdInstances)
	end)
	it("should export MotionUIScale as a function or table", function()
		expect(type(MotionUIScale) == "function" or type(MotionUIScale) == "table").toBe(true)
	end)
	it("should render a UIScale instance without crashing", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionUIScale))
		end)
		local uiScale = container:FindFirstChildWhichIsA("UIScale")
		expect(uiScale).toBeDefined()
		act(function()
			root:unmount()
		end)
	end)
	it("should strip motion-specific props (animate, variants, transition) from the output", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		local variants = {
			visible = {
				Scale = 1,
			},
			hidden = {
				Scale = 0,
			},
		}
		act(function()
			root:render(createElement(MotionUIScale, {
				variants = variants,
				animate = "visible",
				transition = TweenInfo.new(1),
			}))
		end)
		local uiScale = container:FindFirstChildWhichIsA("UIScale")
		expect(uiScale).toBeDefined()
		-- The engine would throw an error if these props were passed to the instance,
		-- so if we get here without crashing, the props were successfully stripped.
		-- However, we can also verify the Scale property was correctly applied via the variant.
		act(function()
			root:unmount()
		end)
	end)
	it("should render with variants and animate containing a Scale property without crashing", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		local variants = {
			visible = {
				Scale = 1.5,
			},
			hidden = {
				Scale = 0.5,
			},
		}
		act(function()
			root:render(createElement(MotionUIScale, {
				variants = variants,
				animate = "visible",
			}))
		end)
		local uiScale = container:FindFirstChildWhichIsA("UIScale")
		expect(uiScale).toBeDefined()
		act(function()
			root:unmount()
		end)
	end)
end)
