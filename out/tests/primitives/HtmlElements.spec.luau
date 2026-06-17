-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _jest_globals = TS.import(script, TS.getModule(script, "@rbxts", "jest-globals").src)
local describe = _jest_globals.describe
local it = _jest_globals.it
local expect = _jest_globals.expect
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local ReactRoblox = TS.import(script, TS.getModule(script, "@rbxts", "react-roblox"))
local _HtmlElements = TS.import(script, script.Parent.Parent.Parent, "primitives", "HtmlElements")
local Div = _HtmlElements.Div
local Span = _HtmlElements.Span
local P = _HtmlElements.P
local H1 = _HtmlElements.H1
local H2 = _HtmlElements.H2
local H3 = _HtmlElements.H3
describe("HtmlElements", function()
	it("should render a Div as a Frame via Box", function()
		local container = Instance.new("Folder")
		local root = ReactRoblox.createRoot(container)
		ReactRoblox.act(function()
			root:render(React.createElement(Div, {
				style = {
					backgroundColor = "#FF0000",
				},
			}))
		end)
		local frame = container:FindFirstChildOfClass("Frame")
		expect(frame).toBeDefined()
		expect(frame:IsA("Frame")).toBe(true)
		root:unmount()
	end)
	it("should render a Span as a TextLabel via InlineText", function()
		local container = Instance.new("Folder")
		local root = ReactRoblox.createRoot(container)
		ReactRoblox.act(function()
			root:render(React.createElement(Span, {
				Text = "Hello World",
			}))
		end)
		-- InlineText may render a Text primitive inside
		local label = container:FindFirstChildOfClass("TextLabel")
		expect(label).toBeDefined()
		expect(label.Text).toBe("Hello World")
		root:unmount()
	end)
	it("should render P, H1, H2, H3 as TextLabels with varying default font sizes", function()
		local container = Instance.new("Folder")
		local root = ReactRoblox.createRoot(container)
		ReactRoblox.act(function()
			root:render(React.createElement(Div, nil, React.createElement(P, {
				Text = "Paragraph",
			}), React.createElement(H1, {
				Text = "Heading 1",
			}), React.createElement(H2, {
				Text = "Heading 2",
			}), React.createElement(H3, {
				Text = "Heading 3",
			})))
		end)
		local frame = container:FindFirstChildOfClass("Frame")
		expect(frame).toBeDefined()
		local p = frame:FindFirstChild("1")
		local h1 = frame:FindFirstChild("2")
		local h2 = frame:FindFirstChild("3")
		local h3 = frame:FindFirstChild("4")
		expect(p).toBeDefined()
		expect(p.Text).toBe("Paragraph")
		expect(p.TextSize).toBe(16)
		expect(h1).toBeDefined()
		expect(h1.Text).toBe("Heading 1")
		expect(h1.TextSize).toBe(32)
		expect(h2).toBeDefined()
		expect(h2.TextSize).toBe(24)
		expect(h3).toBeDefined()
		expect(h3.TextSize).toBe(18)
		root:unmount()
	end)
end)
