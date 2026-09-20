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
local _binding = require(primitivesFolder:WaitForChild("MotionImage"))
local MotionImage = _binding.MotionImage
describe("MotionImage Component", function()
	local createdInstances = {}
	afterEach(function()
		for _, inst in createdInstances do
			inst:Destroy()
		end
		table.clear(createdInstances)
	end)
	it("should export MotionImage as a function or table", function()
		expect(type(MotionImage) == "function" or type(MotionImage) == "table").toBe(true)
	end)
	it("should render an ImageLabel instance without crashing", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionImage))
		end)
		local image = container:FindFirstChildWhichIsA("ImageLabel")
		expect(image).toBeDefined()
		act(function()
			root:unmount()
		end)
	end)
	it("should map src prop to the Image property of the ImageLabel", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionImage, {
				src = "rbxassetid://12345",
			}))
		end)
		local image = container:FindFirstChildWhichIsA("ImageLabel")
		expect(image.Image).toBe("rbxassetid://12345")
		act(function()
			root:unmount()
		end)
	end)
	it("should apply default BackgroundTransparency of 1", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionImage))
		end)
		local image = container:FindFirstChildWhichIsA("ImageLabel")
		expect(image.BackgroundTransparency).toBe(1)
		act(function()
			root:unmount()
		end)
	end)
	it("should render children passed via props.children", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionImage, nil, createElement("textlabel", {
				Text = "ChildText",
			})))
		end)
		local image = container:FindFirstChildWhichIsA("ImageLabel")
		local child = image:FindFirstChildWhichIsA("TextLabel")
		expect(child).toBeDefined()
		local _result = child
		if _result ~= nil then
			_result = _result.Text
		end
		expect(_result).toBe("ChildText")
		act(function()
			root:unmount()
		end)
	end)
	it("should render with variants and animate without crashing", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		local variants = {
			visible = {
				BackgroundTransparency = 0,
			},
			hidden = {
				BackgroundTransparency = 1,
			},
		}
		act(function()
			root:render(createElement(MotionImage, {
				variants = variants,
				animate = "visible",
			}))
		end)
		local image = container:FindFirstChildWhichIsA("ImageLabel")
		expect(image).toBeDefined()
		act(function()
			root:unmount()
		end)
	end)
end)
