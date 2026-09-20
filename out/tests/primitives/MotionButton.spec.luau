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
local _binding = require(primitivesFolder:WaitForChild("MotionButton"))
local MotionButton = _binding.MotionButton
describe("MotionButton Component", function()
	local createdInstances = {}
	afterEach(function()
		for _, inst in createdInstances do
			inst:Destroy()
		end
		table.clear(createdInstances)
	end)
	it("should export MotionButton as a function or table", function()
		expect(type(MotionButton) == "function" or type(MotionButton) == "table").toBe(true)
	end)
	it("should render a TextButton instance without crashing", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionButton))
		end)
		local button = container:FindFirstChildWhichIsA("TextButton")
		expect(button).toBeDefined()
		act(function()
			root:unmount()
		end)
	end)
	it("should map string children to the Text property of the TextButton", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionButton, {
				children = "Click Me",
			}))
		end)
		local button = container:FindFirstChildWhichIsA("TextButton")
		expect(button.Text).toBe("Click Me")
		act(function()
			root:unmount()
		end)
	end)
	it("should apply default BackgroundTransparency and empty Text", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionButton))
		end)
		local button = container:FindFirstChildWhichIsA("TextButton")
		expect(button.BackgroundTransparency).toBe(1)
		expect(button.Text).toBe("")
		act(function()
			root:unmount()
		end)
	end)
	it("should set AutomaticSize.XY when no Size or style width/height is provided", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionButton))
		end)
		local button = container:FindFirstChildWhichIsA("TextButton")
		expect(button.AutomaticSize).toBe(Enum.AutomaticSize.XY)
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
			root:render(createElement(MotionButton, {
				variants = variants,
				animate = "visible",
			}))
		end)
		local button = container:FindFirstChildWhichIsA("TextButton")
		expect(button).toBeDefined()
		act(function()
			root:unmount()
		end)
	end)
	it("should apply textTransform uppercase", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionButton, {
				children = "hello",
				style = {
					textTransform = "uppercase",
				},
			}))
		end)
		local button = container:FindFirstChildWhichIsA("TextButton")
		expect(button.Text).toBe("HELLO")
		act(function()
			root:unmount()
		end)
	end)
	it("should apply textTransform lowercase", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionButton, {
				children = "HELLO",
				style = {
					textTransform = "lowercase",
				},
			}))
		end)
		local button = container:FindFirstChildWhichIsA("TextButton")
		expect(button.Text).toBe("hello")
		act(function()
			root:unmount()
		end)
	end)
	it("should apply textTransform capitalize", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionButton, {
				children = "hello world",
				style = {
					textTransform = "capitalize",
				},
			}))
		end)
		local button = container:FindFirstChildWhichIsA("TextButton")
		expect(button.Text).toBe("Hello World")
		act(function()
			root:unmount()
		end)
	end)
	it("should apply textTransform none (unchanged)", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionButton, {
				children = "Hello",
				style = {
					textTransform = "none",
				},
			}))
		end)
		local button = container:FindFirstChildWhichIsA("TextButton")
		expect(button.Text).toBe("Hello")
		act(function()
			root:unmount()
		end)
	end)
	it("should apply textDecoration underline", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionButton, {
				children = "Hello",
				style = {
					textDecoration = "underline",
				},
			}))
		end)
		local button = container:FindFirstChildWhichIsA("TextButton")
		expect(button.Text).toBe("<u>Hello</u>")
		act(function()
			root:unmount()
		end)
	end)
	it("should apply textDecoration line-through", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionButton, {
				children = "Hello",
				style = {
					textDecoration = "line-through",
				},
			}))
		end)
		local button = container:FindFirstChildWhichIsA("TextButton")
		expect(button.Text).toBe("<s>Hello</s>")
		act(function()
			root:unmount()
		end)
	end)
	it("should apply textDecoration none (unchanged)", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionButton, {
				children = "Hello",
				style = {
					textDecoration = "none",
				},
			}))
		end)
		local button = container:FindFirstChildWhichIsA("TextButton")
		expect(button.Text).toBe("Hello")
		act(function()
			root:unmount()
		end)
	end)
	it("should apply wordBreak break-all with zero-width spaces", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionButton, {
				children = "Hello",
				style = {
					wordBreak = "break-all",
				},
			}))
		end)
		local button = container:FindFirstChildWhichIsA("TextButton")
		expect(button.Text).toBe("H\u{200B}e\u{200B}l\u{200B}l\u{200B}o")
		act(function()
			root:unmount()
		end)
	end)
	it("should apply wordBreak keep-all with newline replacement", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionButton, {
				children = "Hello World",
				style = {
					wordBreak = "keep-all",
				},
			}))
		end)
		local button = container:FindFirstChildWhichIsA("TextButton")
		expect(button.Text).toBe("Hello\nWorld")
		act(function()
			root:unmount()
		end)
	end)
	it("should pass through uppercase native Roblox properties from style to the Virtual DOM", function()
		local container = Instance.new("Folder")
		table.insert(createdInstances, container)
		local root = ReactRoblox.createRoot(container)
		act(function()
			root:render(createElement(MotionButton, {
				style = {
					Position = UDim2.new(0, 10, 0, 20),
					TextTransparency = 0.5,
				},
			}))
		end)
		local button = container:FindFirstChildWhichIsA("TextButton")
		expect(button.Position).toBeDefined()
		expect(button.Position.X.Offset).toBe(10)
		expect(button.Position.Y.Offset).toBe(20)
		expect(button.TextTransparency).toBe(0.5)
		act(function()
			root:unmount()
		end)
	end)
end)
