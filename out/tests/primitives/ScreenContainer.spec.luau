-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _jest_globals = TS.import(script, TS.getModule(script, "@rbxts", "jest-globals").src)
local describe = _jest_globals.describe
local expect = _jest_globals.expect
local it = _jest_globals.it
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local _ScreenContainer = TS.import(script, script.Parent.Parent.Parent, "primitives", "ScreenContainer")
local ScreenContainer = _ScreenContainer.ScreenContainer
local makeScreenContainerProps = _ScreenContainer.makeScreenContainerProps
describe("ScreenContainer primitive", function()
	local screenContainer = ScreenContainer
	local renderScreenContainer = function(props, ref)
		if ref == nil then
			ref = nil
		end
		return screenContainer.render(props, ref)
	end
	describe("makeScreenContainerProps", function()
		it("should return the exact same object provided (branded cast)", function()
			local props = {
				DisplayOrder = 10,
			}
			local result = makeScreenContainerProps(props)
			expect(result).toBe(props)
		end)
	end)
	it("should render a ScreenGui element", function()
		local element = renderScreenContainer({})
		expect(element).toBeDefined()
		expect(element.type).toBe("ScreenGui")
	end)
	it("should use Roblox on-screen container defaults for interactive UI", function()
		local element = renderScreenContainer({})
		expect(element.props.Enabled).toBe(true)
		expect(element.props.DisplayOrder).toBe(0)
		expect(element.props.ResetOnSpawn).toBe(false)
		expect(element.props.ScreenInsets).toBe(Enum.ScreenInsets.CoreUISafeInsets)
		expect(element.props.ZIndexBehavior).toBe(Enum.ZIndexBehavior.Sibling)
	end)
	it("should allow explicit props to choose layering, visibility, spawn resets, and inset behavior", function()
		local element = renderScreenContainer({
			Enabled = false,
			DisplayOrder = 100,
			ResetOnSpawn = true,
			ScreenInsets = Enum.ScreenInsets.None,
			ZIndexBehavior = Enum.ZIndexBehavior.Global,
		})
		expect(element.props.Enabled).toBe(false)
		expect(element.props.DisplayOrder).toBe(100)
		expect(element.props.ResetOnSpawn).toBe(true)
		expect(element.props.ScreenInsets).toBe(Enum.ScreenInsets.None)
		expect(element.props.ZIndexBehavior).toBe(Enum.ZIndexBehavior.Global)
	end)
	it("should preserve child GuiObjects", function()
		local child = React.createElement("frame", {
			BackgroundTransparency = 1,
		})
		local element = renderScreenContainer({
			children = child,
		})
		expect(element.props.children).toBe(child)
	end)
	it("should forward refs correctly", function()
		local ref = React.createRef()
		local element = renderScreenContainer({}, ref)
		expect(element.ref).toBe(ref)
	end)
end)
