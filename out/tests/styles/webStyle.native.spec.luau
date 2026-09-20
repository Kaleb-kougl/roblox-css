-- Compiled with roblox-ts v3.0.0
local _jestGlobals = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("node_modules"):WaitForChild("@rbxts"):WaitForChild("jest-globals"):WaitForChild("src"))
local _binding = _jestGlobals
local describe = _binding.describe
local expect = _binding.expect
local it = _binding.it
-- Dynamically require client files to bypass roblox-ts isolated container checks
local robloxCSS = game:GetService("ReplicatedStorage"):WaitForChild("roblox-css")
local uiStyles = robloxCSS:WaitForChild("styles")
local webStyleModule = require(uiStyles:WaitForChild("webStyle"))
local webStyle = webStyleModule.webStyle
describe("webStyle middleware", function()
	it("maps order to LayoutOrder", function()
		local result = webStyle({
			order = 5,
		})
		expect(result.props.LayoutOrder).toBe(5)
	end)
	it("paddingInline and paddingBlock override padding but yield to specific sides", function()
		local result = webStyle({
			padding = "10px",
			paddingInline = "20px",
			paddingBlock = "30px",
			paddingLeft = "40px",
		})
		local _exp = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uipadding"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local paddingEl = _result
		expect(paddingEl).toBeDefined()
		expect((paddingEl.props.PaddingTop).Offset).toBe(30)
		expect((paddingEl.props.PaddingBottom).Offset).toBe(30)
		expect((paddingEl.props.PaddingRight).Offset).toBe(20)
		expect((paddingEl.props.PaddingLeft).Offset).toBe(40)
	end)
	it("outline injects UIStroke like border", function()
		local result = webStyle({
			outline = "2px solid #FF0000",
		})
		local _exp = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uistroke"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local strokeEl = _result
		expect(strokeEl).toBeDefined()
		expect(strokeEl.props.Thickness).toBe(2)
		expect(strokeEl.props.Color).toBeDefined()
	end)
	it("placeItems and placeContent map correctly", function()
		local result = webStyle({
			display = "flex",
			flexDirection = "column",
			placeItems = "center stretch",
			placeContent = "flex-end space-between",
		})
		local _exp = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uilistlayout"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local layoutEl = _result
		expect(layoutEl).toBeDefined()
		expect(layoutEl.props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.Stretch)
		expect(layoutEl.props.VerticalFlex).toBe(Enum.UIFlexAlignment.SpaceBetween)
	end)
	it("flexFlow maps to FillDirection and Wraps", function()
		local result = webStyle({
			display = "flex",
			flexFlow = "row wrap",
		})
		local _exp = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uilistlayout"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local layoutEl = _result
		expect(layoutEl).toBeDefined()
		expect(layoutEl.props.FillDirection).toBe(Enum.FillDirection.Horizontal)
		expect(layoutEl.props.Wraps).toBe(true)
	end)
	it("borderRadius degradation", function()
		local result = webStyle({
			borderRadius = "10px 5px",
		})
		local _exp = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uicorner"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local cornerEl = _result
		expect(cornerEl).toBeDefined()
		expect((cornerEl.props.CornerRadius).Offset).toBe(10)
	end)
	it("individual rounded corners map to UICorner corner radius fields", function()
		local result = webStyle({
			borderRadius = "10px",
			borderTopRightRadius = "20px",
			borderBottomLeftRadius = "30px",
		})
		local _exp = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uicorner"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local cornerEl = _result
		expect(cornerEl).toBeDefined()
		expect((cornerEl.props.TopLeftRadius).Offset).toBe(10)
		expect((cornerEl.props.TopRightRadius).Offset).toBe(20)
		expect((cornerEl.props.BottomRightRadius).Offset).toBe(10)
		expect((cornerEl.props.BottomLeftRadius).Offset).toBe(30)
	end)
	it("individual rounded corners expand shorthand fallbacks", function()
		local result = webStyle({
			borderRadius = "1px 2px 3px 4px",
			borderTopLeftRadius = "5px",
		})
		local _exp = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uicorner"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local cornerEl = _result
		expect(cornerEl).toBeDefined()
		expect((cornerEl.props.TopLeftRadius).Offset).toBe(5)
		expect((cornerEl.props.TopRightRadius).Offset).toBe(2)
		expect((cornerEl.props.BottomRightRadius).Offset).toBe(3)
		expect((cornerEl.props.BottomLeftRadius).Offset).toBe(4)
	end)
	it("background gradients can set UIGradient offset and rotation overrides", function()
		local result = webStyle({
			background = "linear-gradient(to right, red, blue)",
			backgroundGradientOffset = "0.25 -0.5",
			backgroundGradientRotation = 45,
		})
		local _exp = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uigradient"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local gradientEl = _result
		expect(gradientEl).toBeDefined()
		expect((gradientEl.props.Offset).X).toBe(0.25)
		expect((gradientEl.props.Offset).Y).toBe(-0.5)
		expect(gradientEl.props.Rotation).toBe(45)
	end)
	it("border strokes map native UIStroke controls and alpha", function()
		local result = webStyle({
			border = "4px solid rgba(255, 0, 0, 0.25)",
			borderOffset = "2px",
			borderStrokePosition = "outer",
			lineJoinMode = "bevel",
			strokeSizingMode = "scaled",
			strokeZIndex = 3,
		})
		local _exp = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uistroke"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local strokeEl = _result
		expect(strokeEl).toBeDefined()
		expect(strokeEl.props.Thickness).toBe(4)
		expect(strokeEl.props.Transparency).toBe(0.75)
		expect((strokeEl.props.BorderOffset).Offset).toBe(2)
		expect(strokeEl.props.BorderStrokePosition).toBe(Enum.BorderStrokePosition.Outer)
		expect(strokeEl.props.LineJoinMode).toBe(Enum.LineJoinMode.Bevel)
		expect(strokeEl.props.StrokeSizingMode).toBe(Enum.StrokeSizingMode.ScaledSize)
		expect(strokeEl.props.ZIndex).toBe(3)
	end)
	it("strokeTransparency overrides rgba alpha", function()
		local result = webStyle({
			border = "2px solid rgba(255, 0, 0, 0.25)",
			strokeTransparency = 0.2,
		})
		local _exp = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uistroke"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local strokeEl = _result
		expect(strokeEl).toBeDefined()
		expect(strokeEl.props.Transparency).toBe(0.2)
	end)
	it("strokeGradient injects a child UIGradient on UIStroke", function()
		local result = webStyle({
			border = "2px solid white",
			strokeGradient = "linear-gradient(to bottom, red, blue)",
			strokeGradientOffset = "0.1 0",
			strokeGradientRotation = 15,
		})
		local _exp = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uistroke"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local strokeEl = _result
		local gradientEl = strokeEl.props.children
		expect(strokeEl).toBeDefined()
		expect(gradientEl).toBeDefined()
		expect(gradientEl.props.key).toBe("uistroke-gradient")
		expect((gradientEl.props.Offset).X).toBe(0.1)
		expect(gradientEl.props.Rotation).toBe(15)
	end)
	it("border color can be a gradient child", function()
		local result = webStyle({
			border = "2px solid linear-gradient(to right, red, blue)",
		})
		local _exp = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uistroke"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local strokeEl = _result
		local gradientEl = strokeEl.props.children
		expect(strokeEl).toBeDefined()
		expect(gradientEl).toBeDefined()
		expect(gradientEl.props.key).toBe("uistroke-gradient")
	end)
	it("textStroke receives native UIStroke controls", function()
		local result = webStyle({
			textStroke = "3px solid rgba(0, 0, 0, 0.5)",
			lineJoinMode = "miter",
			strokeSizingMode = "fixed",
			strokeTransparency = 0.1,
			strokeZIndex = 7,
		})
		local _exp = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uitextstroke"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local strokeEl = _result
		expect(strokeEl).toBeDefined()
		expect(strokeEl.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Contextual)
		expect(strokeEl.props.LineJoinMode).toBe(Enum.LineJoinMode.Miter)
		expect(strokeEl.props.StrokeSizingMode).toBe(Enum.StrokeSizingMode.FixedSize)
		expect(strokeEl.props.Transparency).toBe(0.1)
		expect(strokeEl.props.ZIndex).toBe(7)
	end)
	it("boxShadow can opt into native UIShadow properties", function()
		local result = webStyle({
			boxShadow = "0 6px 12px 2px rgba(0, 0, 0, 0.4)",
			boxShadowMode = "uishadow",
			shadowTransparency = 0.25,
		})
		local _exp = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uishadow"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local shadowEl = _result
		expect(shadowEl).toBeDefined()
		expect((shadowEl.props.Offset).Y.Offset).toBe(6)
		expect((shadowEl.props.BlurRadius).Offset).toBe(12)
		expect((shadowEl.props.Spread).X.Offset).toBe(2)
		expect(shadowEl.props.Transparency).toBe(0.25)
	end)
	it("shadow props create native UIShadow without boxShadow", function()
		local result = webStyle({
			shadowBlurRadius = "8px",
			shadowColor = "rgba(10, 20, 30, 0.25)",
			shadowOffset = "3px -4px",
			shadowSpread = "5px 6px",
			shadowZIndex = 9,
		})
		local _exp = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uishadow"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local shadowEl = _result
		expect(shadowEl).toBeDefined()
		expect((shadowEl.props.BlurRadius).Offset).toBe(8)
		expect((shadowEl.props.Offset).X.Offset).toBe(3)
		expect((shadowEl.props.Offset).Y.Offset).toBe(-4)
		expect((shadowEl.props.Spread).X.Offset).toBe(5)
		expect((shadowEl.props.Spread).Y.Offset).toBe(6)
		expect(shadowEl.props.Transparency).toBe(0.75)
		expect(shadowEl.props.ZIndex).toBe(9)
	end)
	it("CSS-like boxShadow can stay on image fallback when requested", function()
		local result = webStyle({
			boxShadow = "1px 2px 3px 4px #ff0000",
			boxShadowMode = "image",
		})
		local _exp = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "box-shadow"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local imageEl = _result
		local _exp_1 = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback_1 = function(c)
			return c.props.key == "uishadow"
		end
		local _result_1
		for _i, _v in _exp_1 do
			if _callback_1(_v, _i - 1, _exp_1) == true then
				_result_1 = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local shadowEl = _result_1
		expect(imageEl).toBeDefined()
		expect(shadowEl).toBeUndefined()
	end)
	it("backgroundSize cover maps to Crop", function()
		local result = webStyle({
			backgroundImage = "url('rbxassetid://123')",
			backgroundSize = "cover",
		})
		local _exp = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uibackgroundimage"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local imageEl = _result
		expect(imageEl).toBeDefined()
		expect(imageEl.props.ScaleType).toBe(Enum.ScaleType.Crop)
	end)
	it("maps documented image label and image button properties", function()
		local result = webStyle({
			image = "rbxassetid://1",
			hoverImage = "rbxassetid://2",
			pressedImage = "rbxassetid://3",
			imageColor = "#336699",
			imageTransparency = 0.25,
		})
		expect(result.props.Image).toBe("rbxassetid://1")
		expect(result.props.HoverImage).toBe("rbxassetid://2")
		expect(result.props.PressedImage).toBe("rbxassetid://3")
		expect(result.props.ImageTransparency).toBe(0.25)
		expect(result.props.ImageColor3).toBeDefined()
	end)
	it("maps documented scrolling frame canvas, inset, scrollbar, and elasticity properties", function()
		local result = webStyle({
			canvasSize = "100% 420px",
			automaticCanvasSize = "y",
			canvasPosition = "4 12",
			verticalScrollBarInset = "scrollbar",
			horizontalScrollBarInset = "always",
			verticalScrollBarPosition = "left",
			scrollBarThickness = 10,
			scrollBarImageColor = "white",
			scrollBarImageTransparency = 0.4,
			scrollBarTopImage = "rbxassetid://top",
			scrollBarMidImage = "rbxassetid://mid",
			scrollBarBottomImage = "rbxassetid://bottom",
			elasticBehavior = "never",
		})
		local canvasSize = result.props.CanvasSize
		local canvasPosition = result.props.CanvasPosition
		expect(canvasSize.X.Scale).toBe(1)
		expect(canvasSize.Y.Offset).toBe(420)
		expect(result.props.AutomaticCanvasSize).toBe(Enum.AutomaticSize.Y)
		expect(canvasPosition.X).toBe(4)
		expect(canvasPosition.Y).toBe(12)
		expect(result.props.VerticalScrollBarInset).toBe(Enum.ScrollBarInset.ScrollBar)
		expect(result.props.HorizontalScrollBarInset).toBe(Enum.ScrollBarInset.Always)
		expect(result.props.VerticalScrollBarPosition).toBe(Enum.VerticalScrollBarPosition.Left)
		expect(result.props.ScrollBarThickness).toBe(10)
		expect(result.props.ScrollBarImageColor3).toBeDefined()
		expect(result.props.ScrollBarImageTransparency).toBe(0.4)
		expect(result.props.TopImage).toBe("rbxassetid://top")
		expect(result.props.MidImage).toBe("rbxassetid://mid")
		expect(result.props.BottomImage).toBe("rbxassetid://bottom")
		expect(result.props.ElasticBehavior).toBe(Enum.ElasticBehavior.Never)
	end)
	it("maps documented viewport, video, and 2D path visual properties", function()
		local result = webStyle({
			viewportAmbient = "rgb(200, 200, 200)",
			viewportLightColor = "rgb(140, 140, 140)",
			viewportLightDirection = "-1 -1 -1",
			video = "rbxassetid://5608384572",
			looped = true,
			playing = true,
			pathColor = "#ff0032",
			pathThickness = 10,
		})
		local lightDirection = result.props.LightDirection
		expect(result.props.Ambient).toBeDefined()
		expect(result.props.LightColor).toBeDefined()
		expect(lightDirection.X).toBe(-1)
		expect(lightDirection.Y).toBe(-1)
		expect(lightDirection.Z).toBe(-1)
		expect(result.props.Video).toBe("rbxassetid://5608384572")
		expect(result.props.Looped).toBe(true)
		expect(result.props.Playing).toBe(true)
		expect(result.props.Color3).toBeDefined()
		expect(result.props.Thickness).toBe(10)
	end)
	it("maps documented proximity prompt properties", function()
		local result = webStyle({
			promptObjectText = "Door",
			promptActionText = "Open",
			promptKeyboardKeyCode = "E",
			promptGamepadKeyCode = "ButtonR1",
			promptMaxActivationDistance = 12,
			promptRequiresLineOfSight = false,
			promptExclusivity = "always-show",
			promptHoldDuration = 0.5,
			promptClickable = true,
		})
		expect(result.props.ObjectText).toBe("Door")
		expect(result.props.ActionText).toBe("Open")
		expect(result.props.KeyboardKeyCode).toBe(Enum.KeyCode.E)
		expect(result.props.GamepadKeyCode).toBe(Enum.KeyCode.ButtonR1)
		expect(result.props.MaxActivationDistance).toBe(12)
		expect(result.props.RequiresLineOfSight).toBe(false)
		expect(result.props.Exclusivity).toBe(Enum.ProximityPromptExclusivity.AlwaysShow)
		expect(result.props.HoldDuration).toBe(0.5)
		expect(result.props.ClickablePrompt).toBe(true)
	end)
	it("maps documented UI drag detector properties", function()
		local result = webStyle({
			uiDragStyle = "translate-line",
			uiDragResponseStyle = "custom-scale",
			uiDragAxis = "0 1",
			uiDragMinTranslation = "0px 0px",
			uiDragMaxTranslation = "100% 12px",
			uiDragMinAngle = -45,
			uiDragMaxAngle = 45,
			uiDragBoundingBehavior = "hit-point",
			uiDragSpeedAxisMapping = "xx",
		})
		local dragAxis = result.props.DragAxis
		local maxTranslation = result.props.MaxDragTranslation
		expect(result.props.DragStyle).toBe(Enum.UIDragDetectorDragStyle.TranslateLine)
		expect(result.props.ResponseStyle).toBe(Enum.UIDragDetectorResponseStyle.CustomScale)
		expect(dragAxis.X).toBe(0)
		expect(dragAxis.Y).toBe(1)
		expect(maxTranslation.X.Scale).toBe(1)
		expect(maxTranslation.Y.Offset).toBe(12)
		expect(result.props.MinDragAngle).toBe(-45)
		expect(result.props.MaxDragAngle).toBe(45)
		expect(result.props.BoundingBehavior).toBe(Enum.UIDragDetectorBoundingBehavior.HitPoint)
		expect(result.props.UIDragSpeedAxisMapping).toBe(Enum.UIDragSpeedAxisMapping.XX)
	end)
	it("maps documented list and grid layout ordering controls", function()
		local list = webStyle({
			display = "flex",
			flexDirection = "row",
			justifyContent = "space-evenly",
			sortOrder = "name",
		})
		local _exp = list.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uilistlayout"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local listLayout = _result
		expect(listLayout).toBeDefined()
		expect(listLayout.props.FillDirection).toBe(Enum.FillDirection.Horizontal)
		expect(listLayout.props.HorizontalFlex).toBe(Enum.UIFlexAlignment.SpaceEvenly)
		expect(listLayout.props.SortOrder).toBe(Enum.SortOrder.Name)
		local grid = webStyle({
			display = "grid",
			gridMaxCells = 3,
			gridStartCorner = "bottom-right",
			sortOrder = "name",
		})
		local _exp_1 = grid.children
		-- ▼ ReadonlyArray.find ▼
		local _callback_1 = function(c)
			return c.props.key == "uigridlayout"
		end
		local _result_1
		for _i, _v in _exp_1 do
			if _callback_1(_v, _i - 1, _exp_1) == true then
				_result_1 = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local gridLayout = _result_1
		expect(gridLayout).toBeDefined()
		expect(gridLayout.props.FillDirectionMaxCells).toBe(3)
		expect(gridLayout.props.StartCorner).toBe(Enum.StartCorner.BottomRight)
		expect(gridLayout.props.SortOrder).toBe(Enum.SortOrder.Name)
	end)
	it("maps documented table and page layout properties", function()
		local tableResult = webStyle({
			display = "table",
			tableMajorAxis = "column-major",
			tableFillEmptySpaceColumns = true,
			tableFillEmptySpaceRows = true,
			tablePadding = "4px 8px",
		})
		local _exp = tableResult.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uitablelayout"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local tableLayout = _result
		expect(tableLayout).toBeDefined()
		expect(tableLayout.props.FillDirection).toBe(Enum.FillDirection.Vertical)
		expect(tableLayout.props.MajorAxis).toBe(Enum.TableMajorAxis.ColumnMajor)
		expect(tableLayout.props.FillEmptySpaceColumns).toBe(true)
		expect(tableLayout.props.FillEmptySpaceRows).toBe(true)
		expect((tableLayout.props.Padding).X.Offset).toBe(4)
		expect((tableLayout.props.Padding).Y.Offset).toBe(8)
		local page = webStyle({
			display = "page",
			pageFillDirection = "row",
			pagePadding = "12px",
			pageAnimated = true,
			pageCircular = true,
			pageTweenTime = 0.35,
			pageEasingStyle = "cubic",
			pageEasingDirection = "in-out",
			pageGamepadInputEnabled = false,
			pageScrollWheelInputEnabled = false,
			pageTouchInputEnabled = true,
		})
		local _exp_1 = page.children
		-- ▼ ReadonlyArray.find ▼
		local _callback_1 = function(c)
			return c.props.key == "uipagelayout"
		end
		local _result_1
		for _i, _v in _exp_1 do
			if _callback_1(_v, _i - 1, _exp_1) == true then
				_result_1 = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local pageLayout = _result_1
		expect(pageLayout).toBeDefined()
		expect(pageLayout.props.FillDirection).toBe(Enum.FillDirection.Horizontal)
		expect((pageLayout.props.Padding).Offset).toBe(12)
		expect(pageLayout.props.Animated).toBe(true)
		expect(pageLayout.props.Circular).toBe(true)
		expect(pageLayout.props.TweenTime).toBe(0.35)
		expect(pageLayout.props.EasingStyle).toBe(Enum.EasingStyle.Cubic)
		expect(pageLayout.props.EasingDirection).toBe(Enum.EasingDirection.InOut)
		expect(pageLayout.props.GamepadInputEnabled).toBe(false)
		expect(pageLayout.props.ScrollWheelInputEnabled).toBe(false)
		expect(pageLayout.props.TouchInputEnabled).toBe(true)
	end)
	it("maps documented size, text animation, and CanvasGroup properties", function()
		local result = webStyle({
			scale = 1.5,
			textScaled = true,
			minTextSize = 9,
			maxTextSize = 48,
			maxVisibleGraphemes = 12,
			textStrokeColor = "#00ff00",
			textStrokeTransparency = 0.25,
			autoLocalize = false,
			groupColor = "#336699",
			groupTransparency = 0.4,
		})
		local _exp = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback = function(c)
			return c.props.key == "uiscale"
		end
		local _result
		for _i, _v in _exp do
			if _callback(_v, _i - 1, _exp) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local scale = _result
		local _exp_1 = result.children
		-- ▼ ReadonlyArray.find ▼
		local _callback_1 = function(c)
			return c.props.key == "uitextsizeconstraint"
		end
		local _result_1
		for _i, _v in _exp_1 do
			if _callback_1(_v, _i - 1, _exp_1) == true then
				_result_1 = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		local textConstraint = _result_1
		expect(scale).toBeDefined()
		expect(scale.props.Scale).toBe(1.5)
		expect(textConstraint).toBeDefined()
		expect(textConstraint.props.MinTextSize).toBe(9)
		expect(textConstraint.props.MaxTextSize).toBe(48)
		expect(result.props.TextScaled).toBe(true)
		expect(result.props.MaxVisibleGraphemes).toBe(12)
		expect(result.props.TextStrokeColor3).toBeDefined()
		expect(result.props.TextStrokeTransparency).toBe(0.25)
		expect(result.props.AutoLocalize).toBe(false)
		expect(result.props.GroupColor3).toBeDefined()
		expect(result.props.GroupTransparency).toBe(0.4)
	end)
	it("maps documented 3D drag detector properties", function()
		local result = webStyle({
			dragStyle = "translate-view-plane",
			dragResponseStyle = "physical",
			dragAxis = "0 1 0",
			dragOrientation = "0 90 0",
			dragMinTranslation = "0 0 0",
			dragMaxTranslation = "10 0 10",
			dragMinAngle = 0,
			dragMaxAngle = 90,
			dragPermissionPolicy = "scriptable",
			dragApplyAtCenterOfMass = true,
			dragMaxForce = 100000,
			dragMaxTorque = 5000,
			dragResponsiveness = 20,
			dragRunLocally = true,
		})
		local axis = result.props.Axis
		local orientation = result.props.Orientation
		local maxTranslation = result.props.MaxDragTranslation
		expect(result.props.DragStyle).toBe(Enum.DragDetectorDragStyle.TranslateViewPlane)
		expect(result.props.ResponseStyle).toBe(Enum.DragDetectorResponseStyle.Physical)
		expect(axis.Y).toBe(1)
		expect(orientation.Y).toBe(90)
		expect(maxTranslation.X).toBe(10)
		expect(maxTranslation.Z).toBe(10)
		expect(result.props.PermissionPolicy).toBe(Enum.DragDetectorPermissionPolicy.Scriptable)
		expect(result.props.ApplyAtCenterOfMass).toBe(true)
		expect(result.props.MaxForce).toBe(100000)
		expect(result.props.MaxTorque).toBe(5000)
		expect(result.props.Responsiveness).toBe(20)
		expect(result.props.RunLocally).toBe(true)
	end)
end)
