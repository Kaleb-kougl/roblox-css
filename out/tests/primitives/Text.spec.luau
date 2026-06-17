-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _jest_globals = TS.import(script, TS.getModule(script, "@rbxts", "jest-globals").src)
local describe = _jest_globals.describe
local it = _jest_globals.it
local expect = _jest_globals.expect
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local ReactRoblox = TS.import(script, TS.getModule(script, "@rbxts", "react-roblox"))
local Text = TS.import(script, script.Parent.Parent.Parent, "primitives", "Text").Text
describe("Text primitive textShadow integration", function()
	it("should properly pass mutated text to webStyle for textShadow", function()
		local container = Instance.new("Folder")
		local root = ReactRoblox.createRoot(container)
		ReactRoblox.act(function()
			root:render(React.createElement(Text, {
				Text = "hello shadow",
				style = {
					textShadow = "5px 5px #ff0000",
					textTransform = "uppercase",
				},
			}))
		end)
		local mainText = container:FindFirstChildOfClass("TextLabel")
		expect(mainText).toBeDefined()
		expect(mainText.Text).toBe("HELLO SHADOW")
		local shadowChild = mainText:FindFirstChild("textShadow")
		expect(shadowChild).toBeDefined()
		expect(shadowChild.Text).toBe("HELLO SHADOW")
		expect(shadowChild.Position.X.Offset).toBe(5)
		expect(shadowChild.Position.Y.Offset).toBe(5)
		root:unmount()
	end)
	it("should apply wordBreak formatting to textShadow", function()
		local container = Instance.new("Folder")
		local root = ReactRoblox.createRoot(container)
		ReactRoblox.act(function()
			root:render(React.createElement(Text, {
				Text = "Hello World",
				style = {
					textShadow = "2px 2px #0000ff",
					wordBreak = "keep-all",
				},
			}))
		end)
		local mainText = container:FindFirstChildOfClass("TextLabel")
		expect(mainText).toBeDefined()
		expect(mainText.Text).toBe("Hello\nWorld")
		local shadowChild = mainText:FindFirstChild("textShadow")
		expect(shadowChild).toBeDefined()
		expect(shadowChild.Text).toBe("Hello\nWorld")
		root:unmount()
	end)
end)
