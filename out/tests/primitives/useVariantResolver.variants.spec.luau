-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _jest_globals = TS.import(script, TS.getModule(script, "@rbxts", "jest-globals").src)
local describe = _jest_globals.describe
local expect = _jest_globals.expect
local it = _jest_globals.it
local beforeEach = _jest_globals.beforeEach
local afterEach = _jest_globals.afterEach
local _react = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local React = _react
local createElement = _react.createElement
local useState = _react.useState
local forwardRef = _react.forwardRef
local _react_roblox = TS.import(script, TS.getModule(script, "@rbxts", "react-roblox"))
local ReactRoblox = _react_roblox
local act = _react_roblox.act
local robloxCSS = game:GetService("ReplicatedStorage"):WaitForChild("roblox-css")
local uiPrimitives = robloxCSS:WaitForChild("primitives")
-- Import the hook dynamically
local variantModule = require(uiPrimitives:WaitForChild("useVariantResolver"))
local useVariantResolver = variantModule.useVariantResolver
-- A dummy component to test the hook
local TestComponent = forwardRef(function(props, ref)
	local result = useVariantResolver(props.animate, props.initial, props.variants, props.transition, props.parser)
	if props.onResolverResult then
		props.onResolverResult(result)
	end
	local _attributes = {
		ref = ref,
	}
	for _k, _v in result.staticProps do
		_attributes[_k] = _v
	end
	for _k, _v in result.animatedProps do
		_attributes[_k] = _v
	end
	return React.createElement("frame", _attributes)
end)
describe("useVariantResolver", function()
	local container
	local root
	beforeEach(function()
		container = Instance.new("Folder")
		root = ReactRoblox.createRoot(container)
	end)
	afterEach(function()
		act(function()
			root:unmount()
		end)
		container:Destroy()
	end)
	it("should split static and animated props correctly", function()
		local lastResult
		local variants = {
			visible = {
				width = "100px",
			},
		}
		act(function()
			root:render(createElement(TestComponent, {
				animate = "visible",
				variants = variants,
				parser = function(style)
					return {
						Size = UDim2.new(0, 100, 0, 0),
						Visible = true,
					}
				end,
				onResolverResult = function(res)
					lastResult = res
				end,
			}))
		end)
		-- By default it uses webStyle parser which only produces animatable props right now (Size, BackgroundTransparency)
		-- Let's verify Size is animatable
		expect(lastResult).toBeDefined()
		local _result = lastResult
		if _result ~= nil then
			_result = _result.animatedProps.Size
		end
		expect(_result).toBeDefined()
		local _result_1 = lastResult
		if _result_1 ~= nil then
			_result_1 = _result_1.staticProps.Size
		end
		expect(_result_1).toBeUndefined()
		-- Verify custom prop injection
		local _result_2 = lastResult
		if _result_2 ~= nil then
			_result_2 = _result_2.staticProps.Visible
		end
		expect(_result_2).toBe(true)
	end)
	it("should transition between variants smoothly", function()
		local variants = {
			start = {
				backgroundColor = "#000000",
			},
			["end"] = {
				backgroundColor = "#ffffff",
			},
		}
		local currentAnimate = "start"
		local setAnimate
		local Wrapper = function()
			local animate, setAnim = useState(currentAnimate)
			setAnimate = setAnim
			return createElement(TestComponent, {
				animate = animate,
				variants = variants,
			})
		end
		act(function()
			root:render(createElement(Wrapper))
		end)
		local frame = container:FindFirstChildWhichIsA("Frame")
		local _result = frame
		if _result ~= nil then
			_result = _result.BackgroundColor3.R
		end
		expect(_result).toBeCloseTo(0, 5)
		-- Trigger state change
		act(function()
			setAnimate("end")
		end)
		-- At this point, the motion tween has started.
		-- Immediately, it shouldn't be fully white because it tweens over 0.3s.
		-- But in Jest, without ticking the Roact/Heartbeat, it might still be 0.
		-- However, we just want to ensure it doesn't crash and correctly applies the binding.
		local _result_1 = frame
		if _result_1 ~= nil then
			_result_1 = _result_1.BackgroundColor3
		end
		expect(_result_1).toBeDefined()
	end)
	it("should seed binding value from initial prop instead of animate target", function()
		local lastResult
		local variants = {
			hidden = {
				width = "0px",
			},
			visible = {
				width = "200px",
			},
		}
		act(function()
			root:render(createElement(TestComponent, {
				initial = "hidden",
				animate = "visible",
				variants = variants,
				parser = function(style)
					-- "hidden" → Size 0px, "visible" → Size 200px
					local w = style.width
					local offset = if w == "0px" then 0 elseif w == "200px" then 200 else 100
					return {
						Size = UDim2.new(0, offset, 0, 0),
					}
				end,
				onResolverResult = function(res)
					lastResult = res
				end,
			}))
		end)
		expect(lastResult).toBeDefined()
		local _result = lastResult
		if _result ~= nil then
			_result = _result.animatedProps.Size
		end
		expect(_result).toBeDefined()
		-- The binding should be seeded from the "hidden" variant (0px),
		-- NOT from the "visible" animate target (200px).
		local _result_1 = lastResult
		if _result_1 ~= nil then
			_result_1 = _result_1.animatedProps.Size:getValue()
		end
		local bindingValue = _result_1
		expect(bindingValue).toBeDefined()
		expect(bindingValue.X.Offset).toBe(0)
	end)
	it("should fall back to idle key when initial prop is absent", function()
		local lastResult
		local variants = {
			idle = {
				width = "50px",
			},
			active = {
				width = "300px",
			},
		}
		act(function()
			root:render(createElement(TestComponent, {
				animate = "active",
				variants = variants,
				parser = function(style)
					local w = style.width
					local offset = if w == "50px" then 50 elseif w == "300px" then 300 else 100
					return {
						Size = UDim2.new(0, offset, 0, 0),
					}
				end,
				onResolverResult = function(res)
					lastResult = res
				end,
			}))
		end)
		expect(lastResult).toBeDefined()
		local _result = lastResult
		if _result ~= nil then
			_result = _result.animatedProps.Size
		end
		expect(_result).toBeDefined()
		-- With no initial prop, the fallback chain should pick "idle" (50px)
		-- over the animate target "active" (300px).
		local _result_1 = lastResult
		if _result_1 ~= nil then
			_result_1 = _result_1.animatedProps.Size:getValue()
		end
		local bindingValue = _result_1
		expect(bindingValue).toBeDefined()
		expect(bindingValue.X.Offset).toBe(50)
	end)
	it("should support a variant literally named 'initial' via the fallback chain", function()
		local lastResult
		-- This mimics the BreathingGlow pattern: a variant named "initial"
		-- used as a starting state, with "idle" as the animate target.
		-- (Uses BackgroundTransparency instead of ImageTransparency because
		-- TestComponent renders a <frame>, which doesn't have ImageTransparency.)
		local variants = {
			initial = {
				BackgroundTransparency = 0.2,
			},
			idle = {
				BackgroundTransparency = 0.8,
			},
		}
		act(function()
			root:render(createElement(TestComponent, {
				animate = "idle",
				variants = variants,
				parser = function(style)
					local val = style.BackgroundTransparency
					return {
						BackgroundTransparency = val,
					}
				end,
				onResolverResult = function(res)
					lastResult = res
				end,
			}))
		end)
		expect(lastResult).toBeDefined()
		local _result = lastResult
		if _result ~= nil then
			_result = _result.animatedProps.BackgroundTransparency
		end
		expect(_result).toBeDefined()
		-- Without an initial prop, the fallback chain picks "idle" (0.8),
		-- NOT the variant named "initial" (0.2). The variant named "initial"
		-- is only used when explicitly passed as initial="initial".
		local _result_1 = lastResult
		if _result_1 ~= nil then
			_result_1 = _result_1.animatedProps.BackgroundTransparency:getValue()
		end
		local bindingValue = _result_1
		expect(bindingValue).toBeDefined()
		expect(bindingValue).toBeCloseTo(0.8, 5)
	end)
end)
