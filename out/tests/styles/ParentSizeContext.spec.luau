-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local ReactRoblox = TS.import(script, TS.getModule(script, "@rbxts", "react-roblox"))
local _jest_globals = TS.import(script, TS.getModule(script, "@rbxts", "jest-globals").src)
local describe = _jest_globals.describe
local expect = _jest_globals.expect
local it = _jest_globals.it
-- Dynamically require client files to bypass roblox-ts isolated container checks
local robloxCSS = game:GetService("ReplicatedStorage"):WaitForChild("roblox-css")
local uiStyles = robloxCSS:WaitForChild("styles")
local ParentSizeContextModule = require(uiStyles:WaitForChild("ParentSizeContext"))
local ParentSizeContext = ParentSizeContextModule.ParentSizeContext
describe("ParentSizeContext", function()
	it("exports ParentSizeContext as a defined value", function()
		expect(ParentSizeContext).toBeDefined()
	end)
	it("ParentSizeContext is a table (React Context object)", function()
		expect(type(ParentSizeContext) == "table").toBe(true)
	end)
	it("has a Provider property", function()
		expect(ParentSizeContext.Provider).toBeDefined()
	end)
	it("default context value is undefined", function()
		local capturedValue = "not-undefined"
		local TestConsumer = function()
			local value = React.useContext(ParentSizeContext)
			capturedValue = value
			return React.createElement(React.Fragment)
		end
		local container = Instance.new("Folder")
		local root = ReactRoblox.createRoot(container)
		ReactRoblox.act(function()
			root:render(React.createElement(TestConsumer))
		end)
		expect(capturedValue).toBeUndefined()
		root:unmount()
	end)
end)
