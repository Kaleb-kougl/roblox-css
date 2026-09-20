-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
--[[
	*
	 * styleCaching.spec.tsx — Regression tests for the useWebStyle parse cache.
	 *
	 * The primitives reuse a cached webStyle() result across renders. Text and
	 * Image post-process that result (multiplying transparency by `opacity`), so
	 * these tests pin the behaviour that would break if the cached table were
	 * mutated in place: the value must be identical after a re-render, not
	 * compounded.
	 
]]
local _jest_globals = TS.import(script, TS.getModule(script, "@rbxts", "jest-globals").src)
local describe = _jest_globals.describe
local it = _jest_globals.it
local expect = _jest_globals.expect
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local ReactRoblox = TS.import(script, TS.getModule(script, "@rbxts", "react-roblox"))
local Text = TS.import(script, script.Parent.Parent.Parent, "primitives", "Text").Text
local Image = TS.import(script, script.Parent.Parent.Parent, "primitives", "Image").Image
local Box = TS.import(script, script.Parent.Parent.Parent, "primitives", "Box").Box
describe("useWebStyle parse cache", function()
	it("should not compound Text opacity across re-renders", function()
		local container = Instance.new("Folder")
		local root = ReactRoblox.createRoot(container)
		ReactRoblox.act(function()
			-- A fresh style table each render — the shape the cache must handle.
			root:render(React.createElement(Text, {
				Text = "hi",
				style = {
					color = "#ffffff",
					opacity = 0.5,
				},
			}))
		end)
		local label = container:FindFirstChildOfClass("TextLabel")
		local afterFirst = label.TextTransparency
		ReactRoblox.act(function()
			root:render(React.createElement(Text, {
				Text = "hi",
				style = {
					color = "#ffffff",
					opacity = 0.5,
				},
			}))
		end)
		ReactRoblox.act(function()
			root:render(React.createElement(Text, {
				Text = "hi",
				style = {
					color = "#ffffff",
					opacity = 0.5,
				},
			}))
		end)
		expect(label.TextTransparency).toBe(afterFirst)
		root:unmount()
		container:Destroy()
	end)
	it("should not compound Image opacity across re-renders", function()
		local container = Instance.new("Folder")
		local root = ReactRoblox.createRoot(container)
		ReactRoblox.act(function()
			root:render(React.createElement(Image, {
				src = "rbxassetid://12345",
				style = {
					opacity = 0.5,
				},
			}))
		end)
		local image = container:FindFirstChildOfClass("ImageLabel")
		local afterFirst = image.ImageTransparency
		ReactRoblox.act(function()
			root:render(React.createElement(Image, {
				src = "rbxassetid://12345",
				style = {
					opacity = 0.5,
				},
			}))
		end)
		ReactRoblox.act(function()
			root:render(React.createElement(Image, {
				src = "rbxassetid://12345",
				style = {
					opacity = 0.5,
				},
			}))
		end)
		expect(image.ImageTransparency).toBe(afterFirst)
		root:unmount()
		container:Destroy()
	end)
	it("should still apply a changed style after a cached render", function()
		local container = Instance.new("Folder")
		local root = ReactRoblox.createRoot(container)
		ReactRoblox.act(function()
			root:render(React.createElement(Box, {
				style = {
					width = "100px",
					height = "50px",
				},
			}))
		end)
		ReactRoblox.act(function()
			-- Same values, new table — should hit the cache and change nothing.
			root:render(React.createElement(Box, {
				style = {
					width = "100px",
					height = "50px",
				},
			}))
		end)
		local frame = container:FindFirstChildOfClass("Frame")
		expect(frame.Size.X.Offset).toBe(100)
		ReactRoblox.act(function()
			root:render(React.createElement(Box, {
				style = {
					width = "200px",
					height = "50px",
				},
			}))
		end)
		expect(frame.Size.X.Offset).toBe(200)
		root:unmount()
		container:Destroy()
	end)
	it("should reparse when only the text content changes", function()
		-- hostText is part of the cache key because webStyle() lays out
		-- textShadow against the final string.
		local container = Instance.new("Folder")
		local root = ReactRoblox.createRoot(container)
		ReactRoblox.act(function()
			root:render(React.createElement(Text, {
				Text = "first",
				style = {
					textShadow = "2px 2px #000000",
				},
			}))
		end)
		local label = container:FindFirstChildOfClass("TextLabel")
		local shadow = label:FindFirstChild("textShadow")
		expect(shadow.Text).toBe("first")
		ReactRoblox.act(function()
			root:render(React.createElement(Text, {
				Text = "second",
				style = {
					textShadow = "2px 2px #000000",
				},
			}))
		end)
		expect((label:FindFirstChild("textShadow")).Text).toBe("second")
		root:unmount()
		container:Destroy()
	end)
end)
