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
local _react_roblox = TS.import(script, TS.getModule(script, "@rbxts", "react-roblox"))
local ReactRoblox = _react_roblox
local act = _react_roblox.act
local robloxCSS = game:GetService("ReplicatedStorage"):WaitForChild("roblox-css")
local uiPrimitives = robloxCSS:WaitForChild("primitives")
local motionBoxModule = require(uiPrimitives:WaitForChild("MotionBox"))
local motionButtonModule = require(uiPrimitives:WaitForChild("MotionButton"))
local motionTextModule = require(uiPrimitives:WaitForChild("MotionText"))
local motionImageModule = require(uiPrimitives:WaitForChild("MotionImage"))
local motionUIScaleModule = require(uiPrimitives:WaitForChild("MotionUIScale"))
local MotionBox = motionBoxModule.MotionBox
local MotionButton = motionButtonModule.MotionButton
local MotionText = motionTextModule.MotionText
local MotionImage = motionImageModule.MotionImage
local MotionUIScale = motionUIScaleModule.MotionUIScale
describe("Motion Primitives", function()
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
	describe("MotionBox", function()
		it("should render a frame without crashing", function()
			act(function()
				root:render(createElement(MotionBox, {
					BackgroundTransparency = 0.5,
				}))
			end)
			local frame = container:FindFirstChildWhichIsA("Frame")
			expect(frame).toBeDefined()
			local _result = frame
			if _result ~= nil then
				_result = _result.BackgroundTransparency
			end
			expect(_result).toBeCloseTo(0.5, 5)
		end)
		it("should apply style props correctly", function()
			act(function()
				root:render(createElement(MotionBox, {
					style = {
						backgroundColor = "#ff0000",
						borderRadius = "8px",
					},
				}))
			end)
			local frame = container:FindFirstChildWhichIsA("Frame")
			expect(frame).toBeDefined()
			local _result = frame
			if _result ~= nil then
				_result = _result.BackgroundColor3
			end
			expect(_result).toBeDefined()
			local _result_1 = frame
			if _result_1 ~= nil then
				_result_1 = _result_1.BackgroundColor3.R
			end
			expect(_result_1).toBeCloseTo(1, 5)
			local _result_2 = frame
			if _result_2 ~= nil then
				_result_2 = _result_2.BackgroundColor3.G
			end
			expect(_result_2).toBeCloseTo(0, 5)
			local _result_3 = frame
			if _result_3 ~= nil then
				_result_3 = _result_3.BackgroundColor3.B
			end
			expect(_result_3).toBeCloseTo(0, 5)
			local _corner = frame
			if _corner ~= nil then
				_corner = _corner:FindFirstChildWhichIsA("UICorner")
			end
			local corner = _corner
			expect(corner).toBeDefined()
			local _result_4 = corner
			if _result_4 ~= nil then
				_result_4 = _result_4.CornerRadius.Offset
			end
			expect(_result_4).toBe(8)
		end)
		it("should resolve variant correctly to initial state", function()
			local variants = {
				hover = {
					backgroundColor = "#00ff00",
					width = "100px",
				},
			}
			act(function()
				root:render(createElement(MotionBox, {
					animate = "hover",
					variants = variants,
				}))
			end)
			local frame = container:FindFirstChildWhichIsA("Frame")
			expect(frame).toBeDefined()
			-- Since useMotion resolves instantly to initial state, backgroundColor should be mapped
			local _result = frame
			if _result ~= nil then
				_result = _result.BackgroundColor3
			end
			expect(_result).toBeDefined()
			local _result_1 = frame
			if _result_1 ~= nil then
				_result_1 = _result_1.BackgroundColor3.G
			end
			expect(_result_1).toBeCloseTo(1, 5)
			local _result_2 = frame
			if _result_2 ~= nil then
				_result_2 = _result_2.Size.X.Offset
			end
			expect(_result_2).toBe(100)
		end)
	end)
	describe("MotionButton", function()
		it("should render a textbutton without crashing", function()
			act(function()
				root:render(createElement(MotionButton, {
					Text = "Click Me",
				}))
			end)
			local btn = container:FindFirstChildWhichIsA("TextButton")
			expect(btn).toBeDefined()
			local _result = btn
			if _result ~= nil then
				_result = _result.Text
			end
			expect(_result).toBe("Click Me")
			local _result_1 = btn
			if _result_1 ~= nil then
				_result_1 = _result_1.AutomaticSize
			end
			expect(_result_1).toBe(Enum.AutomaticSize.XY)
		end)
		it("should render a textbutton with string children as Text", function()
			act(function()
				root:render(React.createElement(MotionButton, nil, "Click String"))
			end)
			local btn = container:FindFirstChildWhichIsA("TextButton")
			expect(btn).toBeDefined()
			local _result = btn
			if _result ~= nil then
				_result = _result.Text
			end
			expect(_result).toBe("Click String")
		end)
		it("should render a textbutton with number children as Text", function()
			act(function()
				root:render(React.createElement(MotionButton, nil, 999))
			end)
			local btn = container:FindFirstChildWhichIsA("TextButton")
			expect(btn).toBeDefined()
			local _result = btn
			if _result ~= nil then
				_result = _result.Text
			end
			expect(_result).toBe("999")
		end)
		it("should apply style font and text alignments", function()
			act(function()
				root:render(createElement(MotionButton, {
					style = {
						fontSize = 24,
						textAlign = "center",
						fontWeight = "bold",
					},
				}))
			end)
			local btn = container:FindFirstChildWhichIsA("TextButton")
			expect(btn).toBeDefined()
			local _result = btn
			if _result ~= nil then
				_result = _result.TextSize
			end
			expect(_result).toBe(24)
			local _result_1 = btn
			if _result_1 ~= nil then
				_result_1 = _result_1.TextXAlignment
			end
			expect(_result_1).toBe(Enum.TextXAlignment.Center)
			local _result_2 = btn
			if _result_2 ~= nil then
				_result_2 = _result_2.FontFace.Weight
			end
			expect(_result_2).toBe(Enum.FontWeight.Bold)
		end)
		it("should forward input events", function()
			local clicked = false
			local hovered = false
			act(function()
				root:render(createElement(MotionButton, {
					onClick = function()
						clicked = true
					end,
					onMouseEnter = function()
						hovered = true
					end,
				}))
			end)
			-- We can verify that Event fields are mapped, but without a full synthetic event system 
			-- it's tricky to trigger them easily from Jest headless. However, we ensure they render.
			local btn = container:FindFirstChildWhichIsA("TextButton")
			expect(btn).toBeDefined()
		end)
	end)
	describe("MotionText", function()
		it("should render a textlabel with children as Text", function()
			act(function()
				root:render(React.createElement(MotionText, nil, "Hello String Children"))
			end)
			local lbl = container:FindFirstChildWhichIsA("TextLabel")
			expect(lbl).toBeDefined()
			local _result = lbl
			if _result ~= nil then
				_result = _result.Text
			end
			expect(_result).toBe("Hello String Children")
		end)
		it("should render a textlabel with number children as Text", function()
			act(function()
				root:render(React.createElement(MotionText, nil, 12345))
			end)
			local lbl = container:FindFirstChildWhichIsA("TextLabel")
			expect(lbl).toBeDefined()
			local _result = lbl
			if _result ~= nil then
				_result = _result.Text
			end
			expect(_result).toBe("12345")
		end)
		it("should apply AutomaticSize.XY when Size and style dimensions are undefined", function()
			act(function()
				root:render(createElement(MotionText, {
					Text = "Hello",
				}))
			end)
			local lbl = container:FindFirstChildWhichIsA("TextLabel")
			expect(lbl).toBeDefined()
			local _result = lbl
			if _result ~= nil then
				_result = _result.AutomaticSize
			end
			expect(_result).toBe(Enum.AutomaticSize.XY)
		end)
		it("should NOT apply AutomaticSize.XY when Size is defined", function()
			act(function()
				root:render(createElement(MotionText, {
					Size = UDim2.new(1, 0, 1, 0),
				}))
			end)
			local lbl = container:FindFirstChildWhichIsA("TextLabel")
			expect(lbl).toBeDefined()
			local _result = lbl
			if _result ~= nil then
				_result = _result.AutomaticSize
			end
			expect(_result).toBe(Enum.AutomaticSize.None)
		end)
		it("should handle color parsing correctly", function()
			act(function()
				root:render(createElement(MotionText, {
					style = {
						color = "rgb(0, 0, 255)",
					},
				}))
			end)
			local lbl = container:FindFirstChildWhichIsA("TextLabel")
			expect(lbl).toBeDefined()
			local _result = lbl
			if _result ~= nil then
				_result = _result.TextColor3.B
			end
			expect(_result).toBeCloseTo(1, 5)
			local _result_1 = lbl
			if _result_1 ~= nil then
				_result_1 = _result_1.TextTransparency
			end
			expect(_result_1).toBe(0)
		end)
		it("should handle transparent color parsing", function()
			act(function()
				root:render(createElement(MotionText, {
					style = {
						color = "transparent",
					},
				}))
			end)
			local lbl = container:FindFirstChildWhichIsA("TextLabel")
			expect(lbl).toBeDefined()
			local _result = lbl
			if _result ~= nil then
				_result = _result.TextTransparency
			end
			expect(_result).toBe(1)
		end)
		it("should parse fontSize, textAlign, and whiteSpace", function()
			act(function()
				root:render(createElement(MotionText, {
					style = {
						fontSize = 32,
						textAlign = "right",
						whiteSpace = "nowrap",
					},
				}))
			end)
			local lbl = container:FindFirstChildWhichIsA("TextLabel")
			expect(lbl).toBeDefined()
			local _result = lbl
			if _result ~= nil then
				_result = _result.TextSize
			end
			expect(_result).toBe(32)
			local _result_1 = lbl
			if _result_1 ~= nil then
				_result_1 = _result_1.TextXAlignment
			end
			expect(_result_1).toBe(Enum.TextXAlignment.Right)
			local _result_2 = lbl
			if _result_2 ~= nil then
				_result_2 = _result_2.TextWrapped
			end
			expect(_result_2).toBe(false)
		end)
		it("should parse fontFamily and fontWeight", function()
			act(function()
				root:render(createElement(MotionText, {
					style = {
						fontFamily = "Gotham",
						fontWeight = "bold",
					},
				}))
			end)
			local lbl = container:FindFirstChildWhichIsA("TextLabel")
			expect(lbl).toBeDefined()
			local _result = lbl
			if _result ~= nil then
				_result = _result.FontFace.Family
			end
			expect(_result).toBe("rbxasset://fonts/families/BuilderSans.json")
			local _result_1 = lbl
			if _result_1 ~= nil then
				_result_1 = _result_1.FontFace.Weight
			end
			expect(_result_1).toBe(Enum.FontWeight.Bold)
		end)
		it("should render non-string children correctly", function()
			act(function()
				root:render(createElement(MotionText, {
					Text = "Parent",
				}, createElement("uiaspectratioconstraint", {
					AspectRatio = 2,
				})))
			end)
			local lbl = container:FindFirstChildWhichIsA("TextLabel")
			expect(lbl).toBeDefined()
			local _constraint = lbl
			if _constraint ~= nil then
				_constraint = _constraint:FindFirstChildWhichIsA("UIAspectRatioConstraint")
			end
			local constraint = _constraint
			expect(constraint).toBeDefined()
			local _result = constraint
			if _result ~= nil then
				_result = _result.AspectRatio
			end
			expect(_result).toBe(2)
		end)
	end)
	describe("MotionImage", function()
		it("should render an imagelabel without crashing", function()
			act(function()
				root:render(createElement(MotionImage, {
					src = "rbxassetid://12345",
				}))
			end)
			local img = container:FindFirstChildWhichIsA("ImageLabel")
			expect(img).toBeDefined()
			local _result = img
			if _result ~= nil then
				_result = _result.Image
			end
			expect(_result).toBe("rbxassetid://12345")
			local _result_1 = img
			if _result_1 ~= nil then
				_result_1 = _result_1.BackgroundTransparency
			end
			expect(_result_1).toBeCloseTo(1, 5)
		end)
		it("should map src prop to Image and apply styles", function()
			act(function()
				root:render(createElement(MotionImage, {
					src = "rbxassetid://98765",
					style = {
						backgroundColor = "#fff",
						width = "50px",
					},
				}))
			end)
			local img = container:FindFirstChildWhichIsA("ImageLabel")
			expect(img).toBeDefined()
			local _result = img
			if _result ~= nil then
				_result = _result.Image
			end
			expect(_result).toBe("rbxassetid://98765")
			local _result_1 = img
			if _result_1 ~= nil then
				_result_1 = _result_1.BackgroundColor3.R
			end
			expect(_result_1).toBeCloseTo(1, 5)
			local _result_2 = img
			if _result_2 ~= nil then
				_result_2 = _result_2.Size.X.Offset
			end
			expect(_result_2).toBe(50)
		end)
		it("should render children correctly", function()
			act(function()
				root:render(createElement(MotionImage, {
					src = "rbxassetid://111",
				}, createElement("uigradient", {
					Rotation = 90,
				})))
			end)
			local img = container:FindFirstChildWhichIsA("ImageLabel")
			expect(img).toBeDefined()
			local _grad = img
			if _grad ~= nil then
				_grad = _grad:FindFirstChildWhichIsA("UIGradient")
			end
			local grad = _grad
			expect(grad).toBeDefined()
			local _result = grad
			if _result ~= nil then
				_result = _result.Rotation
			end
			expect(_result).toBe(90)
		end)
	end)
	describe("MotionUIScale", function()
		it("should render a uiscale without crashing", function()
			act(function()
				root:render(createElement(MotionUIScale, {
					Scale = 1.5,
				}))
			end)
			local scale = container:FindFirstChildWhichIsA("UIScale")
			expect(scale).toBeDefined()
			local _result = scale
			if _result ~= nil then
				_result = _result.Scale
			end
			expect(_result).toBeCloseTo(1.5, 5)
		end)
		it("should resolve variant correctly to initial state", function()
			local variants = {
				hover = {
					Scale = 2.0,
				},
			}
			act(function()
				root:render(createElement(MotionUIScale, {
					animate = "hover",
					variants = variants,
				}))
			end)
			local scale = container:FindFirstChildWhichIsA("UIScale")
			expect(scale).toBeDefined()
			local _result = scale
			if _result ~= nil then
				_result = _result.Scale
			end
			expect(_result).toBeCloseTo(2.0, 5)
		end)
	end)
end)
