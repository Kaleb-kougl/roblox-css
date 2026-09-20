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
local _binding = require(primitivesFolder:WaitForChild("InlineText"))
local InlineText = _binding.InlineText
describe("InlineText Component", function()
	local createdInstances = {}
	afterEach(function()
		for _, inst in createdInstances do
			inst:Destroy()
		end
		table.clear(createdInstances)
	end)
	it("should export InlineText as a function or table", function()
		expect(type(InlineText) == "function" or type(InlineText) == "table").toBe(true)
	end)
	it("should apply opacity math to the Transparency properties of its children", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(InlineText, {
				Text = 'Hello <img src="rbxassetid://123" width="20" height="20" /> World',
				style = {
					opacity = 0.5,
				},
			}))
		end)
		-- The component should render a Box (Frame) with display: flex, containing Text and Image segments
		local frame = container:FindFirstChildWhichIsA("Frame")
		expect(frame).toBeDefined()
		expect(frame.BackgroundTransparency).toBe(0.5)
		local textLabel = frame:FindFirstChildWhichIsA("TextLabel")
		expect(textLabel).toBeDefined()
		expect(textLabel.TextTransparency).toBe(0.5)
		local imageLabel = frame:FindFirstChildWhichIsA("ImageLabel")
		expect(imageLabel).toBeDefined()
		expect(imageLabel.ImageTransparency).toBe(0.5)
		act(function()
			root:unmount()
		end)
	end)
end)
