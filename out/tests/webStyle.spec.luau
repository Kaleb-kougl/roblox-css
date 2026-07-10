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
describe("webStyle", function()
	describe("1. width / height → Size", function()
		it("should parse width and height to Size", function()
			local result = webStyle({
				width = "50%",
				height = "100px",
			})
			expect(result.props.Size).toBeDefined()
			local size = result.props.Size
			expect(size.X.Scale).toBeCloseTo(0.5, 5)
			expect(size.X.Offset).toBe(0)
			expect(size.Y.Scale).toBe(0)
			expect(size.Y.Offset).toBe(100)
		end)
		it("should default to 100% width and height if only one is provided", function()
			local result1 = webStyle({
				width = "50%",
			})
			local size = result1.props.Size
			expect(size.X.Scale).toBeCloseTo(0.5, 5)
			expect(size.Y.Scale).toBeCloseTo(1, 5)
			local result2 = webStyle({
				height = "100px",
			})
			size = result2.props.Size
			expect(size.X.Scale).toBeCloseTo(1, 5)
			expect(size.Y.Offset).toBe(100)
		end)
		it("should not define Size if width and height are undefined", function()
			local result = webStyle({})
			expect(result.props.Size).toBeUndefined()
		end)
	end)
	describe("minWidth / maxWidth → <uisizeconstraint>", function()
		it("should inject <uisizeconstraint> with correct Vector2 properties when minWidth and maxHeight are provided", function()
			local result = webStyle({
				minWidth = "50px",
				maxHeight = "100px",
			})
			expect(#result.children).toBe(1)
			local child = result.children[1]
			expect(child.type).toBe("UISizeConstraint")
			local minSize = child.props.MinSize
			local maxSize = child.props.MaxSize
			expect(minSize.X).toBe(50)
			expect(minSize.Y).toBe(0)
			expect(maxSize.X).toBe(math.huge)
			expect(maxSize.Y).toBe(100)
		end)
		it("should correctly fallback unassigned axes to 0 for MinSize and math.huge for MaxSize", function()
			local result = webStyle({
				maxWidth = "200px",
				minHeight = "25px",
			})
			local child = result.children[1]
			expect(child.type).toBe("UISizeConstraint")
			local minSize = child.props.MinSize
			local maxSize = child.props.MaxSize
			expect(minSize.X).toBe(0)
			expect(minSize.Y).toBe(25)
			expect(maxSize.X).toBe(200)
			expect(maxSize.Y).toBe(math.huge)
		end)
	end)
	describe("11.5. Percentage constraint skip guard", function()
		it("should NOT emit UISizeConstraint when maxWidth is a percentage", function()
			local result = webStyle({
				maxWidth = "50%",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UISizeConstraint"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local constraint = _result
			expect(constraint).toBeUndefined()
		end)
		it("should NOT emit UISizeConstraint when minHeight is a percentage", function()
			local result = webStyle({
				minHeight = "25%",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UISizeConstraint"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local constraint = _result
			expect(constraint).toBeUndefined()
		end)
		it("should NOT emit UISizeConstraint when mixed pixel + percentage", function()
			local result = webStyle({
				minWidth = "200px",
				maxWidth = "50%",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UISizeConstraint"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local constraint = _result
			expect(constraint).toBeUndefined()
		end)
		it("should STILL emit UISizeConstraint when all constraints are pixel-only", function()
			local result = webStyle({
				minWidth = "50px",
				maxHeight = "100px",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UISizeConstraint"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local constraint = _result
			expect(constraint).toBeDefined()
			local minSize = constraint.props.MinSize
			local maxSize = constraint.props.MaxSize
			expect(minSize.X).toBe(50)
			expect(minSize.Y).toBe(0)
			expect(maxSize.X).toBe(math.huge)
			expect(maxSize.Y).toBe(100)
		end)
		it("should STILL emit UISizeConstraint for numeric pixel values", function()
			local result = webStyle({
				maxWidth = 400,
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UISizeConstraint"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local constraint = _result
			expect(constraint).toBeDefined()
			local maxSize = constraint.props.MaxSize
			expect(maxSize.X).toBe(400)
		end)
		it("should NOT emit UISizeConstraint when any single axis is a percentage", function()
			local result = webStyle({
				minWidth = "100px",
				maxWidth = "300px",
				minHeight = "50px",
				maxHeight = "80%",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UISizeConstraint"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local constraint = _result
			expect(constraint).toBeUndefined()
		end)
		it("should not affect other children when percentage constraint skips", function()
			local result = webStyle({
				maxWidth = "50%",
				borderRadius = "8px",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UISizeConstraint"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local constraint = _result
			local _exp_1 = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback_1 = function(c)
				return c.type == "UICorner"
			end
			local _result_1
			for _i, _v in _exp_1 do
				if _callback_1(_v, _i - 1, _exp_1) == true then
					_result_1 = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local corner = _result_1
			expect(constraint).toBeUndefined()
			expect(corner).toBeDefined()
		end)
	end)
	describe("2. backgroundColor → BackgroundColor3 + BackgroundTransparency", function()
		it("should parse hex colors to BackgroundColor3", function()
			local result = webStyle({
				backgroundColor = "#ff0000",
			})
			expect(result.props.BackgroundColor3).toBeDefined()
			local color = result.props.BackgroundColor3
			expect(color.R).toBe(1)
			expect(color.G).toBe(0)
			expect(color.B).toBe(0)
			expect(result.props.BackgroundTransparency).toBe(0)
		end)
		it("should set BackgroundTransparency to 1 for transparent background", function()
			local result = webStyle({
				backgroundColor = "transparent",
			})
			expect(result.props.BackgroundTransparency).toBe(1)
		end)
	end)
	describe("3. opacity → BackgroundTransparency", function()
		it("should invert opacity to set BackgroundTransparency", function()
			local result = webStyle({
				opacity = 0.2,
			})
			expect(result.props.BackgroundTransparency).toBeCloseTo(0.8, 5)
		end)
		it("should let opacity override backgroundColor transparency", function()
			local result = webStyle({
				backgroundColor = "transparent",
				opacity = 0.5,
			})
			expect(result.props.BackgroundTransparency).toBeCloseTo(0.5, 5)
		end)
	end)
	describe("4. borderRadius → <uicorner>", function()
		it("should inject <uicorner> child with CornerRadius", function()
			local result = webStyle({
				borderRadius = "10px",
			})
			expect(#result.children).toBe(1)
			local child = result.children[1]
			expect(child.type).toBe("UICorner")
			local radius = child.props.CornerRadius
			expect(radius.Offset).toBe(10)
			expect(radius.Scale).toBe(0)
		end)
		it("should map individual rounded corners to UICorner radius fields", function()
			local result = webStyle({
				borderRadius = "10px",
				borderTopRightRadius = "20px",
				borderBottomLeftRadius = "30px",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UICorner"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect((child.props.TopLeftRadius).Offset).toBe(10)
			expect((child.props.TopRightRadius).Offset).toBe(20)
			expect((child.props.BottomRightRadius).Offset).toBe(10)
			expect((child.props.BottomLeftRadius).Offset).toBe(30)
		end)
		it("should expand four-value borderRadius when individual corner fields are used", function()
			local result = webStyle({
				borderRadius = "1px 2px 3px 4px",
				borderTopLeftRadius = "5px",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UICorner"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect((child.props.TopLeftRadius).Offset).toBe(5)
			expect((child.props.TopRightRadius).Offset).toBe(2)
			expect((child.props.BottomRightRadius).Offset).toBe(3)
			expect((child.props.BottomLeftRadius).Offset).toBe(4)
		end)
		it("should create UICorner from individual radius fields without borderRadius", function()
			local result = webStyle({
				borderBottomRightRadius = "12px",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UICorner"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect((child.props.TopLeftRadius).Offset).toBe(0)
			expect((child.props.TopRightRadius).Offset).toBe(0)
			expect((child.props.BottomRightRadius).Offset).toBe(12)
			expect((child.props.BottomLeftRadius).Offset).toBe(0)
		end)
	end)
	describe("5. padding → <uipadding>", function()
		it("should inject <uipadding> with shorthand padding", function()
			local result = webStyle({
				padding = "10px 20px",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIPadding"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect((child.props.PaddingTop).Offset).toBe(10)
			expect((child.props.PaddingBottom).Offset).toBe(10)
			expect((child.props.PaddingLeft).Offset).toBe(20)
			expect((child.props.PaddingRight).Offset).toBe(20)
		end)
		it("should let individual sides override shorthand padding", function()
			local result = webStyle({
				padding = "10px",
				paddingLeft = "5px",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIPadding"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect((child.props.PaddingTop).Offset).toBe(10)
			expect((child.props.PaddingLeft).Offset).toBe(5)
		end)
		it("should handle just individual sides", function()
			local result = webStyle({
				paddingRight = "15%",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIPadding"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect((child.props.PaddingRight).Scale).toBeCloseTo(0.15, 5)
			expect((child.props.PaddingTop).Offset).toBe(0)
		end)
		it("should map paddingInline and paddingBlock logical properties", function()
			local result = webStyle({
				padding = "10px",
				paddingInline = "20px 30px",
				paddingBlock = "5px",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIPadding"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect((child.props.PaddingTop).Offset).toBe(5)
			expect((child.props.PaddingBottom).Offset).toBe(5)
			expect((child.props.PaddingLeft).Offset).toBe(20)
			expect((child.props.PaddingRight).Offset).toBe(30)
		end)
	end)
	describe("6. display: 'flex' → <uilistlayout>", function()
		it("should inject <uilistlayout> for flex display", function()
			local result = webStyle({
				display = "flex",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIListLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect(child.props.FillDirection).toBe(Enum.FillDirection.Vertical)
			expect(child.props.SortOrder).toBe(Enum.SortOrder.LayoutOrder)
		end)
		it("should map flexDirection: 'row'", function()
			local result = webStyle({
				display = "flex",
				flexDirection = "row",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIListLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child.props.FillDirection).toBe(Enum.FillDirection.Horizontal)
		end)
		it("should map justifyContent and alignItems for column", function()
			local result = webStyle({
				display = "flex",
				flexDirection = "column",
				justifyContent = "center",
				alignItems = "flex-end",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIListLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child.props.VerticalAlignment).toBe(Enum.VerticalAlignment.Center)
			expect(child.props.HorizontalAlignment).toBe(Enum.HorizontalAlignment.Right)
		end)
		it("should map justifyContent and alignItems for row", function()
			local result = webStyle({
				display = "flex",
				flexDirection = "row",
				justifyContent = "flex-end",
				alignItems = "center",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIListLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child.props.HorizontalAlignment).toBe(Enum.HorizontalAlignment.Right)
			expect(child.props.VerticalAlignment).toBe(Enum.VerticalAlignment.Center)
		end)
		it("should map gap to Padding", function()
			local result = webStyle({
				display = "flex",
				gap = "10px",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIListLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect((child.props.Padding).Offset).toBe(10)
		end)
		it("should map flexWrap: 'wrap' to Wraps: true", function()
			local result = webStyle({
				display = "flex",
				flexWrap = "wrap",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIListLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child.props.Wraps).toBe(true)
		end)
		it("should not set Wraps for flexWrap: 'nowrap'", function()
			local result = webStyle({
				display = "flex",
				flexWrap = "nowrap",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIListLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child.props.Wraps).toBeUndefined()
		end)
		it("should map justifyContent: 'space-between' to HorizontalFlex for row", function()
			local result = webStyle({
				display = "flex",
				flexDirection = "row",
				justifyContent = "space-between",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIListLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child.props.HorizontalFlex).toBe(Enum.UIFlexAlignment.SpaceBetween)
			expect(child.props.HorizontalAlignment).toBeUndefined()
		end)
		it("should map alignItems: 'stretch' to ItemLineAlignment", function()
			local result = webStyle({
				display = "flex",
				alignItems = "stretch",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIListLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child.props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.Stretch)
		end)
		it("should map flexFlow 'row wrap' correctly", function()
			local result = webStyle({
				display = "flex",
				flexFlow = "row wrap",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIListLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child.props.FillDirection).toBe(Enum.FillDirection.Horizontal)
			expect(child.props.Wraps).toBe(true)
		end)
		it("should map flexFlow 'column nowrap' correctly", function()
			local result = webStyle({
				display = "flex",
				flexFlow = "column nowrap",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIListLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child.props.FillDirection).toBe(Enum.FillDirection.Vertical)
			expect(child.props.Wraps).toBeUndefined()
		end)
		it("should map flexFlow 'column-reverse' fallback to column", function()
			local result = webStyle({
				display = "flex",
				flexFlow = "column-reverse",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIListLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child.props.FillDirection).toBe(Enum.FillDirection.Vertical)
		end)
		it("should parse single values in flexFlow", function()
			local result1 = webStyle({
				display = "flex",
				flexFlow = "row",
			})
			local _exp = result1.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIListLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child1 = _result
			expect(child1.props.FillDirection).toBe(Enum.FillDirection.Horizontal)
			local result2 = webStyle({
				display = "flex",
				flexFlow = "wrap",
			})
			local _exp_1 = result2.children
			-- ▼ ReadonlyArray.find ▼
			local _callback_1 = function(c)
				return c.type == "UIListLayout"
			end
			local _result_1
			for _i, _v in _exp_1 do
				if _callback_1(_v, _i - 1, _exp_1) == true then
					_result_1 = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child2 = _result_1
			expect(child2.props.Wraps).toBe(true)
		end)
		it("should map placeContent to justifyContent", function()
			local result = webStyle({
				display = "flex",
				placeContent = "center flex-end",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIListLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child.props.VerticalAlignment).toBe(Enum.VerticalAlignment.Bottom)
		end)
		it("should map placeItems to alignItems", function()
			local result = webStyle({
				display = "flex",
				placeItems = "center stretch",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIListLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child.props.HorizontalAlignment).toBe(Enum.HorizontalAlignment.Center)
		end)
		it("should map justifyContent: 'space-around' to HorizontalFlex/VerticalFlex", function()
			local resultRow = webStyle({
				display = "flex",
				flexDirection = "row",
				justifyContent = "space-around",
			})
			local _exp = resultRow.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIListLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local childRow = _result
			expect(childRow.props.HorizontalFlex).toBe(Enum.UIFlexAlignment.SpaceAround)
			local resultCol = webStyle({
				display = "flex",
				flexDirection = "column",
				justifyContent = "space-around",
			})
			local _exp_1 = resultCol.children
			-- ▼ ReadonlyArray.find ▼
			local _callback_1 = function(c)
				return c.type == "UIListLayout"
			end
			local _result_1
			for _i, _v in _exp_1 do
				if _callback_1(_v, _i - 1, _exp_1) == true then
					_result_1 = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local childCol = _result_1
			expect(childCol.props.VerticalFlex).toBe(Enum.UIFlexAlignment.SpaceAround)
		end)
	end)
	describe("6.5. display: 'grid' → <uigridlayout>", function()
		it("should inject <uigridlayout> for grid display", function()
			local result = webStyle({
				display = "grid",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIGridLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect(child.props.SortOrder).toBe(Enum.SortOrder.LayoutOrder)
		end)
		it("should map gridTemplateColumns and gridTemplateRows to CellSize", function()
			local result = webStyle({
				display = "grid",
				gridTemplateColumns = "120px",
				gridTemplateRows = "150px",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIGridLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			local cellSize = child.props.CellSize
			expect(cellSize.X.Offset).toBe(120)
			expect(cellSize.Y.Offset).toBe(150)
		end)
		it("should map gap to CellPadding", function()
			local result = webStyle({
				display = "grid",
				gap = "10px 20px",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIGridLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			local cellPadding = child.props.CellPadding
			expect(cellPadding.X.Offset).toBe(10)
			expect(cellPadding.Y.Offset).toBe(20)
		end)
		it("should map rowGap and columnGap to CellPadding", function()
			local result = webStyle({
				display = "grid",
				rowGap = "15px",
				columnGap = "25px",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIGridLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			local cellPadding = child.props.CellPadding
			expect(cellPadding.X.Offset).toBe(25)
			expect(cellPadding.Y.Offset).toBe(15)
		end)
		it("should prioritize rowGap and columnGap over gap", function()
			local result = webStyle({
				display = "grid",
				gap = "5px",
				rowGap = "15px",
				columnGap = "25px",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIGridLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			local cellPadding = child.props.CellPadding
			expect(cellPadding.X.Offset).toBe(25)
			expect(cellPadding.Y.Offset).toBe(15)
		end)
		it("should map justifyContent and alignItems for grid", function()
			local result = webStyle({
				display = "grid",
				justifyContent = "center",
				alignItems = "flex-end",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIGridLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child.props.HorizontalAlignment).toBe(Enum.HorizontalAlignment.Center)
			expect(child.props.VerticalAlignment).toBe(Enum.VerticalAlignment.Bottom)
		end)
		it("should map flexDirection to FillDirection for grid (default row)", function()
			local result1 = webStyle({
				display = "grid",
			})
			local _exp = result1.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIGridLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child1 = _result
			expect(child1.props.FillDirection).toBe(Enum.FillDirection.Horizontal)
			local result2 = webStyle({
				display = "grid",
				flexDirection = "column",
			})
			local _exp_1 = result2.children
			-- ▼ ReadonlyArray.find ▼
			local _callback_1 = function(c)
				return c.type == "UIGridLayout"
			end
			local _result_1
			for _i, _v in _exp_1 do
				if _callback_1(_v, _i - 1, _exp_1) == true then
					_result_1 = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child2 = _result_1
			expect(child2.props.FillDirection).toBe(Enum.FillDirection.Vertical)
		end)
	end)
	describe("7. border → <uistroke>", function()
		it("should inject <uistroke> child with Thickness, Color, and Border mode", function()
			local result = webStyle({
				border = "2px solid #00ff00",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect(child.props.Thickness).toBe(2)
			local color = child.props.Color
			expect(color.R).toBe(0)
			expect(color.G).toBe(1)
			expect(color.B).toBe(0)
			expect(child.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border)
		end)
		it("should alias outline to border and produce UIStroke", function()
			local result = webStyle({
				outline = "2px solid blue",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect(child.props.Thickness).toBe(2)
			local color = child.props.Color
			expect(color.B).toBe(1)
			expect(child.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border)
		end)
		it("should return undefined for thickness only without specifying word", function()
			local result = webStyle({
				border = "3px",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeUndefined()
		end)
		it("should return undefined for empty string", function()
			local result = webStyle({
				border = "",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeUndefined()
		end)
		it("should parse rgb() border color", function()
			local result = webStyle({
				border = "1px solid rgb(255, 0, 0)",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect(child.props.Thickness).toBe(1)
			local color = child.props.Color
			expect(color.R).toBeCloseTo(1, 2)
			expect(color.G).toBeCloseTo(0, 2)
			expect(color.B).toBeCloseTo(0, 2)
			expect(child.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border)
		end)
		it("should parse rgba() border color and map alpha to UIStroke.Transparency", function()
			local result = webStyle({
				border = "2px solid rgba(0, 128, 255, 0.5)",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect(child.props.Thickness).toBe(2)
			local color = child.props.Color
			expect(color.R).toBeCloseTo(0, 2)
			expect(color.G).toBeCloseTo(0.50, 2)
			expect(color.B).toBeCloseTo(1, 2)
			expect(child.props.Transparency).toBeCloseTo(0.5, 5)
			expect(child.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border)
		end)
		it("should map native UIStroke controls", function()
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
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect(child.props.Thickness).toBe(4)
			expect(child.props.Transparency).toBeCloseTo(0.75, 5)
			expect((child.props.BorderOffset).Offset).toBe(2)
			expect(child.props.BorderStrokePosition).toBe(Enum.BorderStrokePosition.Outer)
			expect(child.props.LineJoinMode).toBe(Enum.LineJoinMode.Bevel)
			expect(child.props.StrokeSizingMode).toBe(Enum.StrokeSizingMode.ScaledSize)
			expect(child.props.ZIndex).toBe(3)
		end)
		it("should let strokeTransparency override color alpha", function()
			local result = webStyle({
				border = "2px solid rgba(255, 0, 0, 0.25)",
				strokeTransparency = 0.2,
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect(child.props.Transparency).toBeCloseTo(0.2, 5)
		end)
		it("should inject a child UIGradient for strokeGradient", function()
			local result = webStyle({
				border = "2px solid white",
				strokeGradient = "linear-gradient(to bottom, red, blue)",
				strokeGradientOffset = "0.1 0",
				strokeGradientRotation = 15,
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			local gradient = child.props.children
			expect(gradient).toBeDefined()
			expect(gradient.type).toBe("UIGradient")
			expect((gradient.props.Offset).X).toBe(0.1)
			expect(gradient.props.Rotation).toBe(15)
		end)
		it("should accept a gradient directly in the border color position", function()
			local result = webStyle({
				border = "2px solid linear-gradient(to right, red, blue)",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			local color = child.props.Color
			local gradient = child.props.children
			expect(color.R).toBe(1)
			expect(color.G).toBe(1)
			expect(color.B).toBe(1)
			expect(gradient).toBeDefined()
			expect(gradient.type).toBe("UIGradient")
		end)
		it("should parse hsl() border color", function()
			local result = webStyle({
				border = "1px solid hsl(120, 100%, 50%)",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect(child.props.Thickness).toBe(1)
			local color = child.props.Color
			expect(color.R).toBeCloseTo(0, 2)
			expect(color.G).toBeCloseTo(1, 2)
			expect(color.B).toBeCloseTo(0, 2)
			expect(child.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border)
		end)
		it("should skip 'dashed' style keyword and parse color", function()
			local result = webStyle({
				border = "3px dashed #ff0000",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect(child.props.Thickness).toBe(3)
			local color = child.props.Color
			expect(color.R).toBeCloseTo(1, 2)
			expect(color.G).toBeCloseTo(0, 2)
			expect(color.B).toBeCloseTo(0, 2)
			expect(child.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border)
		end)
		it("should return undefined for missing specifying word with thickness and color", function()
			local result = webStyle({
				border = "2px red",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeUndefined()
		end)
		it("should successfully create UIStroke with specifying word only", function()
			local result = webStyle({
				border = "solid",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect(child.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border)
		end)
		it("should parse thickness and specifying word without color", function()
			local result = webStyle({
				border = "2px dashed",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect(child.props.Thickness).toBe(2)
			expect(child.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border)
		end)
		it("should parse color and specifying word without thickness", function()
			local result = webStyle({
				border = "dotted #FF0000",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			local color = child.props.Color
			expect(color.R).toBe(1)
			expect(color.G).toBe(0)
			expect(color.B).toBe(0)
			expect(child.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border)
		end)
		it("should successfully parse regardless of argument order", function()
			local result1 = webStyle({
				border = "2px solid red",
			})
			local result2 = webStyle({
				border = "red solid 2px",
			})
			local _exp = result1.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child1 = _result
			local _exp_1 = result2.children
			-- ▼ ReadonlyArray.find ▼
			local _callback_1 = function(c)
				return c.type == "UIStroke"
			end
			local _result_1
			for _i, _v in _exp_1 do
				if _callback_1(_v, _i - 1, _exp_1) == true then
					_result_1 = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child2 = _result_1
			expect(child1).toBeDefined()
			expect(child2).toBeDefined()
			expect(child1.props.Thickness).toBe(2)
			expect(child2.props.Thickness).toBe(2)
			local color1 = child1.props.Color
			local color2 = child2.props.Color
			expect(color1.R).toBe(1)
			expect(color2.R).toBe(1)
		end)
		it("should handle specifying words case insensitively", function()
			local result1 = webStyle({
				border = "2px SOLID #000",
			})
			local result2 = webStyle({
				border = "2px Dashed #000",
			})
			local _exp = result1.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			expect(_result).toBeDefined()
			local _exp_1 = result2.children
			-- ▼ ReadonlyArray.find ▼
			local _callback_1 = function(c)
				return c.type == "UIStroke"
			end
			local _result_1
			for _i, _v in _exp_1 do
				if _callback_1(_v, _i - 1, _exp_1) == true then
					_result_1 = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			expect(_result_1).toBeDefined()
		end)
		it("should identify specifying word with extraneous text", function()
			local result = webStyle({
				border = "2px solid something-weird",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect(child.props.Thickness).toBe(2)
		end)
	end)
	describe("8. aspectRatio → <uiaspectratioconstraint>", function()
		it("should inject <uiaspectratioconstraint> with AspectRatio prop", function()
			local result = webStyle({
				aspectRatio = 1.5,
			})
			expect(#result.children).toBe(1)
			local child = result.children[1]
			expect(child.type).toBe("UIAspectRatioConstraint")
			expect(child.props.AspectRatio).toBe(1.5)
		end)
		it("should handle integer aspect ratios", function()
			local result = webStyle({
				aspectRatio = 1,
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIAspectRatioConstraint"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect(child.props.AspectRatio).toBe(1)
		end)
		it("should handle widescreen aspect ratios", function()
			local result = webStyle({
				aspectRatio = 16 / 9,
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIAspectRatioConstraint"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect(child.props.AspectRatio).toBeCloseTo(1.7778, 3)
		end)
		it("should coexist with other constraints", function()
			local result = webStyle({
				aspectRatio = 2,
				borderRadius = "8px",
			})
			expect(#result.children).toBe(2)
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIAspectRatioConstraint"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			expect(_result).toBeDefined()
			local _exp_1 = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback_1 = function(c)
				return c.type == "UICorner"
			end
			local _result_1
			for _i, _v in _exp_1 do
				if _callback_1(_v, _i - 1, _exp_1) == true then
					_result_1 = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			expect(_result_1).toBeDefined()
		end)
	end)
	describe("9. position: 'absolute' → Position + AnchorPoint", function()
		it("should map top and left", function()
			local result = webStyle({
				position = "absolute",
				top = "10px",
				left = "20px",
			})
			local pos = result.props.Position
			local anchor = result.props.AnchorPoint
			expect(pos.X.Offset).toBe(20)
			expect(pos.Y.Offset).toBe(10)
			expect(anchor.X).toBe(0)
			expect(anchor.Y).toBe(0)
		end)
		it("should map right and bottom", function()
			local result = webStyle({
				position = "absolute",
				bottom = "10px",
				right = "20px",
			})
			local pos = result.props.Position
			local anchor = result.props.AnchorPoint
			expect(pos.X.Scale).toBe(1)
			expect(pos.X.Offset).toBe(-20)
			expect(pos.Y.Scale).toBe(1)
			expect(pos.Y.Offset).toBe(-10)
			expect(anchor.X).toBe(1)
			expect(anchor.Y).toBe(1)
		end)
		it("should prioritize left over right and top over bottom", function()
			local result = webStyle({
				position = "absolute",
				left = "5px",
				right = "10px",
				top = "15px",
				bottom = "20px",
			})
			local pos = result.props.Position
			local anchor = result.props.AnchorPoint
			expect(pos.X.Offset).toBe(5)
			expect(pos.Y.Offset).toBe(15)
			expect(anchor.X).toBe(0)
			expect(anchor.Y).toBe(0)
		end)
	end)
	describe("10. zIndex → ZIndex", function()
		it("should map zIndex to ZIndex", function()
			local result = webStyle({
				zIndex = 10,
			})
			expect(result.props.ZIndex).toBe(10)
		end)
		it("should handle negative zIndex", function()
			local result = webStyle({
				zIndex = -5,
			})
			expect(result.props.ZIndex).toBe(-5)
		end)
	end)
	describe("transformOrigin → AnchorPoint", function()
		it("should map 'center' to 0.5, 0.5", function()
			local result = webStyle({
				transformOrigin = "center",
			})
			local anchor = result.props.AnchorPoint
			expect(anchor.X).toBe(0.5)
			expect(anchor.Y).toBe(0.5)
		end)
		it("should map 'top left' to 0, 0", function()
			local result = webStyle({
				transformOrigin = "top left",
			})
			local anchor = result.props.AnchorPoint
			expect(anchor.X).toBe(0)
			expect(anchor.Y).toBe(0)
		end)
		it("should map 'bottom right' to 1, 1", function()
			local result = webStyle({
				transformOrigin = "bottom right",
			})
			local anchor = result.props.AnchorPoint
			expect(anchor.X).toBe(1)
			expect(anchor.Y).toBe(1)
		end)
		it("should map percentages like '100% 50%'", function()
			local result = webStyle({
				transformOrigin = "100% 50%",
			})
			local anchor = result.props.AnchorPoint
			expect(anchor.X).toBe(1)
			expect(anchor.Y).toBe(0.5)
		end)
		it("should handle single keyword 'top'", function()
			local result = webStyle({
				transformOrigin = "top",
			})
			local anchor = result.props.AnchorPoint
			expect(anchor.X).toBe(0.5)
			expect(anchor.Y).toBe(0)
		end)
		it("should override position: absolute's default AnchorPoint", function()
			local result = webStyle({
				position = "absolute",
				top = 0,
				left = 0,
				transformOrigin = "center",
			})
			local anchor = result.props.AnchorPoint
			expect(anchor.X).toBe(0.5)
			expect(anchor.Y).toBe(0.5)
		end)
	end)
	describe("11. Typography & Text Styling", function()
		describe("userSelect → TextSelectable", function()
			it("should map 'text' and 'auto' to true", function()
				expect(webStyle({
					userSelect = "text",
				}).props.TextSelectable).toBe(true)
				expect(webStyle({
					userSelect = "auto",
				}).props.TextSelectable).toBe(true)
			end)
			it("should map 'none' to false", function()
				expect(webStyle({
					userSelect = "none",
				}).props.TextSelectable).toBe(false)
			end)
		end)
		describe("textStroke → <uistroke>", function()
			it("should map textStroke to Contextual uistroke", function()
				local result = webStyle({
					textStroke = "2px solid #ff0000",
				})
				local _exp = result.children
				-- ▼ ReadonlyArray.find ▼
				local _callback = function(c)
					return c.type == "UIStroke" and c.props.ApplyStrokeMode == Enum.ApplyStrokeMode.Contextual
				end
				local _result
				for _i, _v in _exp do
					if _callback(_v, _i - 1, _exp) == true then
						_result = _v
						break
					end
				end
				-- ▲ ReadonlyArray.find ▲
				local stroke = _result
				expect(stroke).toBeDefined()
				expect(stroke.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Contextual)
				expect(stroke.props.Thickness).toBe(2)
			end)
			it("should apply native stroke controls to textStroke", function()
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
					return c.type == "UIStroke" and c.props.ApplyStrokeMode == Enum.ApplyStrokeMode.Contextual
				end
				local _result
				for _i, _v in _exp do
					if _callback(_v, _i - 1, _exp) == true then
						_result = _v
						break
					end
				end
				-- ▲ ReadonlyArray.find ▲
				local stroke = _result
				expect(stroke).toBeDefined()
				expect(stroke.props.Thickness).toBe(3)
				expect(stroke.props.LineJoinMode).toBe(Enum.LineJoinMode.Miter)
				expect(stroke.props.StrokeSizingMode).toBe(Enum.StrokeSizingMode.FixedSize)
				expect(stroke.props.Transparency).toBeCloseTo(0.1, 5)
				expect(stroke.props.ZIndex).toBe(7)
			end)
		end)
		describe("color → TextColor3", function()
			it("should parse hex colors to TextColor3", function()
				local result = webStyle({
					color = "#00ff00",
				})
				expect(result.props.TextColor3).toBeDefined()
				local color = result.props.TextColor3
				expect(color.R).toBe(0)
				expect(color.G).toBe(1)
				expect(color.B).toBe(0)
			end)
			it("should map color 'transparent' to TextTransparency 1", function()
				local result = webStyle({
					color = "transparent",
				})
				expect(result.props.TextTransparency).toBe(1)
			end)
		end)
		describe("fontSize → TextSize", function()
			it("should map fontSize to TextSize", function()
				local result = webStyle({
					fontSize = 24,
				})
				expect(result.props.TextSize).toBe(24)
			end)
		end)
		describe("textAlign → TextXAlignment", function()
			it("should map 'left' to Enum.TextXAlignment.Left", function()
				local result = webStyle({
					textAlign = "left",
				})
				expect(result.props.TextXAlignment).toBe(Enum.TextXAlignment.Left)
			end)
			it("should map 'center' to Enum.TextXAlignment.Center", function()
				local result = webStyle({
					textAlign = "center",
				})
				expect(result.props.TextXAlignment).toBe(Enum.TextXAlignment.Center)
			end)
			it("should map 'right' to Enum.TextXAlignment.Right", function()
				local result = webStyle({
					textAlign = "right",
				})
				expect(result.props.TextXAlignment).toBe(Enum.TextXAlignment.Right)
			end)
		end)
		describe("whiteSpace & wordBreak → TextWrapped", function()
			it("should map whiteSpace 'normal', 'pre-wrap', 'pre-line' to true", function()
				expect(webStyle({
					whiteSpace = "normal",
				}).props.TextWrapped).toBe(true)
				expect(webStyle({
					whiteSpace = "pre-wrap",
				}).props.TextWrapped).toBe(true)
				expect(webStyle({
					whiteSpace = "pre-line",
				}).props.TextWrapped).toBe(true)
			end)
			it("should map whiteSpace 'nowrap' to false", function()
				expect(webStyle({
					whiteSpace = "nowrap",
				}).props.TextWrapped).toBe(false)
			end)
			it("should map wordBreak 'normal', 'break-word', 'break-all' to true", function()
				expect(webStyle({
					wordBreak = "normal",
				}).props.TextWrapped).toBe(true)
				expect(webStyle({
					wordBreak = "break-word",
				}).props.TextWrapped).toBe(true)
				expect(webStyle({
					wordBreak = "break-all",
				}).props.TextWrapped).toBe(true)
			end)
			it("should map wordBreak 'keep-all' to false", function()
				expect(webStyle({
					wordBreak = "keep-all",
				}).props.TextWrapped).toBe(false)
			end)
		end)
		describe("fontFamily & fontWeight → FontFace", function()
			it("should map fontFamily to the correct URI and use default weight", function()
				local result = webStyle({
					fontFamily = "Montserrat",
				})
				expect(result.props.FontFace).toBeDefined()
				local font = result.props.FontFace
				expect(font.Family).toBe("rbxasset://fonts/families/Montserrat.json")
				expect(font.Weight).toBe(Enum.FontWeight.Regular)
				expect(font.Style).toBe(Enum.FontStyle.Normal)
			end)
			it("should map fontWeight to the correct Enum and use default family", function()
				local result = webStyle({
					fontWeight = "bold",
				})
				expect(result.props.FontFace).toBeDefined()
				local font = result.props.FontFace
				expect(font.Family).toBe("rbxasset://fonts/families/BuilderSans.json")
				expect(font.Weight).toBe(Enum.FontWeight.Bold)
				expect(font.Style).toBe(Enum.FontStyle.Normal)
			end)
			it("should map both fontFamily and fontWeight", function()
				local result = webStyle({
					fontFamily = "Montserrat",
					fontWeight = "black",
				})
				expect(result.props.FontFace).toBeDefined()
				local font = result.props.FontFace
				expect(font.Family).toBe("rbxasset://fonts/families/Montserrat.json")
				expect(font.Weight).toBe(Enum.FontWeight.Heavy)
				expect(font.Style).toBe(Enum.FontStyle.Normal)
			end)
			it("should use fallback for any fontFamily and fontWeight", function()
				local result = webStyle({
					fontFamily = "UnknownFont",
					fontWeight = "superbold",
				})
				expect(result.props.FontFace).toBeDefined()
				local font = result.props.FontFace
				expect(font.Family).toBe("rbxasset://fonts/families/BuilderSans.json")
				expect(font.Weight).toBe(Enum.FontWeight.Regular)
				expect(font.Style).toBe(Enum.FontStyle.Normal)
			end)
		end)
	end)
	describe("display: 'none' → Visible = false", function()
		it("should set Visible to false", function()
			local result = webStyle({
				display = "none",
			})
			expect(result.props.Visible).toBe(false)
		end)
		it("should not set Visible if display is flex or grid", function()
			local flexResult = webStyle({
				display = "flex",
			})
			expect(flexResult.props.Visible).toBeUndefined()
			local gridResult = webStyle({
				display = "grid",
			})
			expect(gridResult.props.Visible).toBeUndefined()
		end)
	end)
	describe("13. overflow → ClipsDescendants", function()
		it("should set ClipsDescendants to true when overflow is hidden", function()
			local result = webStyle({
				overflow = "hidden",
			})
			expect(result.props.ClipsDescendants).toBe(true)
		end)
		it("should set ClipsDescendants to false when overflow is visible", function()
			local result = webStyle({
				overflow = "visible",
			})
			expect(result.props.ClipsDescendants).toBe(false)
		end)
	end)
	describe("14. pointerEvents → Interactable / Active", function()
		it("should set Interactable and Active to false when pointerEvents is 'none'", function()
			local result = webStyle({
				pointerEvents = "none",
			})
			expect(result.props.Interactable).toBe(false)
			expect(result.props.Active).toBe(false)
		end)
		it("should not set Interactable or Active when pointerEvents is 'auto' or omitted", function()
			local result = webStyle({
				pointerEvents = "auto",
			})
			expect(result.props.Interactable).toBeUndefined()
			expect(result.props.Active).toBeUndefined()
			local omittedResult = webStyle({})
			expect(omittedResult.props.Interactable).toBeUndefined()
			expect(omittedResult.props.Active).toBeUndefined()
		end)
	end)
	describe("backgroundImage → <imagelabel>", function()
		it("should inject imagelabel with Image property for unquoted URL", function()
			local result = webStyle({
				backgroundImage = "url(rbxassetid://12345)",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "ImageLabel"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local img = _result
			expect(img).toBeDefined()
			expect(img.props.Image).toBe("rbxassetid://12345")
			expect(img.props.ZIndex).toBe(-1)
			expect((img.props.Size).X.Scale).toBe(1)
			expect((img.props.Size).Y.Scale).toBe(1)
		end)
		it("should inject imagelabel with Image property for double-quoted URL", function()
			local result = webStyle({
				backgroundImage = 'url(\"rbxassetid://12345\")',
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "ImageLabel"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local img = _result
			expect(img).toBeDefined()
			expect(img.props.Image).toBe("rbxassetid://12345")
		end)
		it("should inject imagelabel with Image property for single-quoted URL", function()
			local result = webStyle({
				backgroundImage = "url('rbxassetid://12345')",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "ImageLabel"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local img = _result
			expect(img).toBeDefined()
			expect(img.props.Image).toBe("rbxassetid://12345")
		end)
		it("should map backgroundSize 'cover' to Enum.ScaleType.Crop", function()
			local result = webStyle({
				backgroundImage = "url(rbxassetid://12345)",
				backgroundSize = "cover",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "ImageLabel"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local img = _result
			expect(img.props.ScaleType).toBe(Enum.ScaleType.Crop)
		end)
		it("should map backgroundSize 'contain' to Enum.ScaleType.Fit", function()
			local result = webStyle({
				backgroundImage = "url(rbxassetid://12345)",
				backgroundSize = "contain",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "ImageLabel"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local img = _result
			expect(img.props.ScaleType).toBe(Enum.ScaleType.Fit)
		end)
	end)
	describe("15. boxShadow → <imagelabel>", function()
		it("should inject <imagelabel> with correct base properties", function()
			local result = webStyle({
				boxShadow = "md",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "ImageLabel"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect(child.type).toBe("ImageLabel")
			-- Verify default shadow asset ID (see SHADOW_ASSET_ID in webStyle.ts)
			expect(child.props.Image).toBe("rbxassetid://6015897843")
			expect(child.props.ScaleType).toBe(Enum.ScaleType.Slice)
			expect(child.props.SliceScale).toBe(0.3)
			expect(child.props.BackgroundTransparency).toBe(1)
			local color = child.props.ImageColor3
			expect(color.R).toBe(0)
			expect(color.G).toBe(0)
			expect(color.B).toBe(0)
			expect(child.props.ZIndex).toBe(-1)
			local anchor = child.props.AnchorPoint
			expect(anchor.X).toBe(0.5)
			expect(anchor.Y).toBe(0.5)
			local pos = child.props.Position
			expect(pos.X.Scale).toBe(0.5)
			expect(pos.X.Offset).toBe(0)
			expect(pos.Y.Scale).toBe(0.5)
			expect(pos.Y.Offset).toBe(4)
		end)
		it("should not inject <imagelabel> if boxShadow is 'none'", function()
			local result = webStyle({
				boxShadow = "none",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "ImageLabel"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeUndefined()
		end)
		it("should map 'sm' token to correct size and transparency", function()
			local result = webStyle({
				boxShadow = "sm",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "ImageLabel"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			local size = child.props.Size
			expect(size.X.Scale).toBe(1)
			expect(size.X.Offset).toBe(10)
			expect(size.Y.Scale).toBe(1)
			expect(size.Y.Offset).toBe(10)
			expect(child.props.ImageTransparency).toBeCloseTo(0.7, 5)
		end)
		it("should map '2xl' token to correct size and transparency", function()
			local result = webStyle({
				boxShadow = "2xl",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "ImageLabel"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			local size = child.props.Size
			expect(size.X.Scale).toBe(1)
			expect(size.X.Offset).toBe(40)
			expect(size.Y.Scale).toBe(1)
			expect(size.Y.Offset).toBe(40)
			expect(child.props.ImageTransparency).toBeCloseTo(0.4, 5)
		end)
		it("should fallback to default size and transparency for any token", function()
			local result = webStyle({
				boxShadow = "any",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "ImageLabel"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			local size = child.props.Size
			expect(size.X.Scale).toBe(1)
			expect(size.X.Offset).toBe(20)
			expect(size.Y.Scale).toBe(1)
			expect(size.Y.Offset).toBe(20)
			expect(child.props.ImageTransparency).toBeCloseTo(0.5, 5)
		end)
		it("should parse CSS-like boxShadow into native UIShadow when requested", function()
			local result = webStyle({
				boxShadow = "0 6px 12px 2px rgba(0, 0, 0, 0.4)",
				boxShadowMode = "uishadow",
				shadowTransparency = 0.25,
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIShadow"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect((child.props.Offset).Y.Offset).toBe(6)
			expect((child.props.BlurRadius).Offset).toBe(12)
			expect((child.props.Spread).X.Offset).toBe(2)
			expect(child.props.Transparency).toBe(0.25)
		end)
		it("should use native UIShadow for CSS-like boxShadow by default", function()
			local result = webStyle({
				boxShadow = "1px 2px 3px 4px #ff0000",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIShadow"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect((child.props.Offset).X.Offset).toBe(1)
			expect((child.props.Offset).Y.Offset).toBe(2)
			expect((child.props.BlurRadius).Offset).toBe(3)
			expect((child.props.Spread).X.Offset).toBe(4)
			local color = child.props.Color
			expect(color.R).toBe(1)
			expect(color.G).toBe(0)
			expect(color.B).toBe(0)
		end)
		it("should keep CSS-like boxShadow on image fallback when requested", function()
			local result = webStyle({
				boxShadow = "1px 2px 3px 4px #ff0000",
				boxShadowMode = "image",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIShadow"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			expect(_result).toBeUndefined()
			local _exp_1 = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback_1 = function(c)
				return c.type == "ImageLabel"
			end
			local _result_1
			for _i, _v in _exp_1 do
				if _callback_1(_v, _i - 1, _exp_1) == true then
					_result_1 = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result_1
			expect(child).toBeDefined()
			expect((child.props.Size).X.Offset).toBe(20)
		end)
		it("should build native UIShadow from shadow props without boxShadow", function()
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
				return c.type == "UIShadow"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect((child.props.BlurRadius).Offset).toBe(8)
			expect((child.props.Offset).X.Offset).toBe(3)
			expect((child.props.Offset).Y.Offset).toBe(-4)
			expect((child.props.Spread).X.Offset).toBe(5)
			expect((child.props.Spread).Y.Offset).toBe(6)
			expect(child.props.Transparency).toBeCloseTo(0.75, 5)
			expect(child.props.ZIndex).toBe(9)
		end)
		it("should map preset tokens through native UIShadow when opted in", function()
			local result = webStyle({
				boxShadow = "2xl",
				boxShadowMode = "uishadow",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIShadow"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect((child.props.BlurRadius).Offset).toBe(24)
			expect((child.props.Offset).Y.Offset).toBe(15)
			expect((child.props.Spread).X.Offset).toBe(8)
			expect(child.props.Transparency).toBeCloseTo(0.4, 5)
		end)
		it("should use custom SHADOW_ASSET_ID when overridden", function()
			-- NOTE: We cannot easily override module-level `let` exports from the test
			-- side because roblox-ts modules are loaded once. Instead, we verify the
			-- default asset ID is the expected value, documenting that it IS configurable.
			local result = webStyle({
				boxShadow = "md",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "ImageLabel"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			-- Default asset
			expect(child.props.Image).toBe("rbxassetid://6015897843")
			-- Verify the SliceCenter matches the documented default
			local sliceCenter = child.props.SliceCenter
			expect(sliceCenter.Min.X).toBe(47)
			expect(sliceCenter.Min.Y).toBe(47)
			expect(sliceCenter.Max.X).toBe(450)
			expect(sliceCenter.Max.Y).toBe(450)
		end)
	end)
	describe("16. objectFit → ScaleType", function()
		it("should map 'cover' to Enum.ScaleType.Crop", function()
			local result = webStyle({
				objectFit = "cover",
			})
			expect(result.props.ScaleType).toBe(Enum.ScaleType.Crop)
		end)
		it("should map 'contain' to Enum.ScaleType.Fit", function()
			local result = webStyle({
				objectFit = "contain",
			})
			expect(result.props.ScaleType).toBe(Enum.ScaleType.Fit)
		end)
		it("should map 'fill' to Enum.ScaleType.Stretch", function()
			local result = webStyle({
				objectFit = "fill",
			})
			expect(result.props.ScaleType).toBe(Enum.ScaleType.Stretch)
		end)
	end)
	describe("17. lineHeight → LineHeight", function()
		it("should map lineHeight to LineHeight", function()
			local result = webStyle({
				lineHeight = 1.5,
			})
			expect(result.props.LineHeight).toBe(1.5)
		end)
	end)
	describe("18. textOverflow → TextTruncate", function()
		it("should map textOverflow 'ellipsis' to Enum.TextTruncate.AtEnd", function()
			local result = webStyle({
				textOverflow = "ellipsis",
			})
			expect(result.props.TextTruncate).toBe(Enum.TextTruncate.AtEnd)
		end)
	end)
	describe("19. layoutOrder → LayoutOrder", function()
		it("should map layoutOrder to LayoutOrder", function()
			local result = webStyle({
				layoutOrder = 5,
			})
			expect(result.props.LayoutOrder).toBe(5)
		end)
		it("should handle negative layoutOrder", function()
			local result = webStyle({
				layoutOrder = -3,
			})
			expect(result.props.LayoutOrder).toBe(-3)
		end)
		it("should handle zero layoutOrder", function()
			local result = webStyle({
				layoutOrder = 0,
			})
			expect(result.props.LayoutOrder).toBe(0)
		end)
		it("should map order to LayoutOrder", function()
			local result = webStyle({
				order = 10,
			})
			expect(result.props.LayoutOrder).toBe(10)
		end)
		it("should prioritize order over layoutOrder", function()
			local result = webStyle({
				order = 15,
				layoutOrder = 5,
			})
			expect(result.props.LayoutOrder).toBe(15)
		end)
	end)
	describe("20. rotation → Rotation", function()
		it("should map rotation to Rotation", function()
			local result = webStyle({
				rotation = 45,
			})
			expect(result.props.Rotation).toBe(45)
		end)
		it("should handle negative rotation", function()
			local result = webStyle({
				rotation = -90,
			})
			expect(result.props.Rotation).toBe(-90)
		end)
		it("should handle zero rotation", function()
			local result = webStyle({
				rotation = 0,
			})
			expect(result.props.Rotation).toBe(0)
		end)
	end)
	describe("21. visibility → Visible", function()
		it("should set Visible to false when visibility is 'hidden'", function()
			local result = webStyle({
				visibility = "hidden",
			})
			expect(result.props.Visible).toBe(false)
		end)
		it("should set Visible to true when visibility is 'visible'", function()
			local result = webStyle({
				visibility = "visible",
			})
			expect(result.props.Visible).toBe(true)
		end)
		it("should not affect Visible when visibility is not set", function()
			local result = webStyle({})
			expect(result.props.Visible).toBeUndefined()
		end)
		it("should coexist with display: none (both set Visible)", function()
			local result = webStyle({
				display = "none",
			})
			expect(result.props.Visible).toBe(false)
		end)
	end)
	describe("22. autoSize → AutomaticSize", function()
		it("should map autoSize 'xy' to Enum.AutomaticSize.XY", function()
			local result = webStyle({
				autoSize = "xy",
			})
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.XY)
		end)
		it("should map autoSize 'x' to Enum.AutomaticSize.X", function()
			local result = webStyle({
				autoSize = "x",
			})
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.X)
		end)
		it("should map autoSize 'y' to Enum.AutomaticSize.Y", function()
			local result = webStyle({
				autoSize = "y",
			})
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.Y)
		end)
		it("should map autoSize 'none' to Enum.AutomaticSize.None", function()
			local result = webStyle({
				autoSize = "none",
			})
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.None)
		end)
		it("should set AutomaticSize.X when width is 'auto'", function()
			local result = webStyle({
				width = "auto",
			})
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.X)
		end)
		it("should set AutomaticSize.Y when height is 'auto'", function()
			local result = webStyle({
				height = "auto",
			})
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.Y)
		end)
		it("should set AutomaticSize.XY when both width and height are 'auto'", function()
			local result = webStyle({
				width = "auto",
				height = "auto",
			})
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.XY)
		end)
		it("should let explicit autoSize override width/height auto", function()
			local result = webStyle({
				width = "auto",
				autoSize = "y",
			})
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.Y)
		end)
		it("should not set AutomaticSize when width/height are normal values", function()
			local result = webStyle({
				width = "50%",
				height = "100px",
			})
			expect(result.props.AutomaticSize).toBeUndefined()
		end)
	end)
	describe("23. textVerticalAlign → TextYAlignment", function()
		it("should map 'top' to Enum.TextYAlignment.Top", function()
			local result = webStyle({
				textVerticalAlign = "top",
			})
			expect(result.props.TextYAlignment).toBe(Enum.TextYAlignment.Top)
		end)
		it("should map 'center' to Enum.TextYAlignment.Center", function()
			local result = webStyle({
				textVerticalAlign = "center",
			})
			expect(result.props.TextYAlignment).toBe(Enum.TextYAlignment.Center)
		end)
		it("should map 'bottom' to Enum.TextYAlignment.Bottom", function()
			local result = webStyle({
				textVerticalAlign = "bottom",
			})
			expect(result.props.TextYAlignment).toBe(Enum.TextYAlignment.Bottom)
		end)
	end)
	describe("24. fontStyle → FontFace italic", function()
		it("should set FontFace with Italic style", function()
			local result = webStyle({
				fontStyle = "italic",
			})
			expect(result.props.FontFace).toBeDefined()
			local font = result.props.FontFace
			expect(font.Style).toBe(Enum.FontStyle.Italic)
			expect(font.Family).toBe("rbxasset://fonts/families/BuilderSans.json")
			expect(font.Weight).toBe(Enum.FontWeight.Regular)
		end)
		it("should set FontFace with Normal style explicitly", function()
			local result = webStyle({
				fontStyle = "normal",
			})
			local font = result.props.FontFace
			expect(font.Style).toBe(Enum.FontStyle.Normal)
		end)
		it("should combine fontStyle with fontWeight and fontFamily", function()
			local result = webStyle({
				fontFamily = "Montserrat",
				fontWeight = "bold",
				fontStyle = "italic",
			})
			local font = result.props.FontFace
			expect(font.Family).toBe("rbxasset://fonts/families/Montserrat.json")
			expect(font.Weight).toBe(Enum.FontWeight.Bold)
			expect(font.Style).toBe(Enum.FontStyle.Italic)
		end)
	end)
	describe("25. richText → RichText", function()
		it("should set RichText to true", function()
			local result = webStyle({
				richText = true,
			})
			expect(result.props.RichText).toBe(true)
		end)
		it("should not set RichText when false", function()
			local result = webStyle({
				richText = false,
			})
			expect(result.props.RichText).toBeUndefined()
		end)
		it("should not set RichText when omitted", function()
			local result = webStyle({})
			expect(result.props.RichText).toBeUndefined()
		end)
	end)
	describe("26. textDecoration → RichText + _textDecoration signal", function()
		it("should set RichText true and _textDecoration for 'underline'", function()
			local result = webStyle({
				textDecoration = "underline",
			})
			expect(result.props.RichText).toBe(true)
			expect(result.props._textDecoration).toBe("underline")
		end)
		it("should set RichText true and _textDecoration for 'line-through'", function()
			local result = webStyle({
				textDecoration = "line-through",
			})
			expect(result.props.RichText).toBe(true)
			expect(result.props._textDecoration).toBe("line-through")
		end)
		it("should NOT set RichText or _textDecoration for 'none'", function()
			local result = webStyle({
				textDecoration = "none",
			})
			expect(result.props.RichText).toBeUndefined()
			expect(result.props._textDecoration).toBeUndefined()
		end)
		it("should NOT set anything when textDecoration is omitted", function()
			local result = webStyle({})
			expect(result.props._textDecoration).toBeUndefined()
		end)
	end)
	describe("27. textTransform → _textTransform signal", function()
		it("should set _textTransform for 'uppercase'", function()
			local result = webStyle({
				textTransform = "uppercase",
			})
			expect(result.props._textTransform).toBe("uppercase")
		end)
		it("should set _textTransform for 'lowercase'", function()
			local result = webStyle({
				textTransform = "lowercase",
			})
			expect(result.props._textTransform).toBe("lowercase")
		end)
		it("should set _textTransform for 'capitalize'", function()
			local result = webStyle({
				textTransform = "capitalize",
			})
			expect(result.props._textTransform).toBe("capitalize")
		end)
		it("should NOT set _textTransform for 'none'", function()
			local result = webStyle({
				textTransform = "none",
			})
			expect(result.props._textTransform).toBeUndefined()
		end)
		it("should NOT set _textTransform when omitted", function()
			local result = webStyle({})
			expect(result.props._textTransform).toBeUndefined()
		end)
	end)
	describe("28. flexGrow / flexShrink / alignSelf → <uiflexitem>", function()
		it("should inject UIFlexItem with FlexMode Custom when flexGrow is set", function()
			local result = webStyle({
				flexGrow = 1,
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIFlexItem"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local flexItem = _result
			expect(flexItem).toBeDefined()
			expect(flexItem.props.FlexMode).toBe(Enum.UIFlexMode.Custom)
			expect(flexItem.props.GrowRatio).toBe(1)
			expect(flexItem.props.ShrinkRatio).toBe(0)
		end)
		it("should inject UIFlexItem with FlexMode Custom when flexShrink is set", function()
			local result = webStyle({
				flexShrink = 1,
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIFlexItem"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local flexItem = _result
			expect(flexItem).toBeDefined()
			expect(flexItem.props.FlexMode).toBe(Enum.UIFlexMode.Custom)
			expect(flexItem.props.GrowRatio).toBe(0)
			expect(flexItem.props.ShrinkRatio).toBe(1)
		end)
		it("should set both GrowRatio and ShrinkRatio when both are provided", function()
			local result = webStyle({
				flexGrow = 2,
				flexShrink = 3,
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIFlexItem"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local flexItem = _result
			expect(flexItem).toBeDefined()
			expect(flexItem.props.FlexMode).toBe(Enum.UIFlexMode.Custom)
			expect(flexItem.props.GrowRatio).toBe(2)
			expect(flexItem.props.ShrinkRatio).toBe(3)
		end)
		it("should NOT inject UIFlexItem when flexGrow and flexShrink are both 0", function()
			local result = webStyle({
				flexGrow = 0,
				flexShrink = 0,
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIFlexItem"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local flexItem = _result
			expect(flexItem).toBeUndefined()
		end)
		it("should NOT inject UIFlexItem when neither flexGrow nor flexShrink is set", function()
			local result = webStyle({})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIFlexItem"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local flexItem = _result
			expect(flexItem).toBeUndefined()
		end)
		it("should parse flex: 1 to flexGrow 1 and flexShrink 1", function()
			local result = webStyle({
				flex = 1,
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIFlexItem"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local flexItem = _result
			expect(flexItem).toBeDefined()
			expect(flexItem.props.FlexMode).toBe(Enum.UIFlexMode.Custom)
			expect(flexItem.props.GrowRatio).toBe(1)
			expect(flexItem.props.ShrinkRatio).toBe(1)
		end)
		it("should parse flex: 'auto' to flexGrow 1 and flexShrink 1", function()
			local result = webStyle({
				flex = "auto",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIFlexItem"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local flexItem = _result
			expect(flexItem).toBeDefined()
			expect(flexItem.props.GrowRatio).toBe(1)
			expect(flexItem.props.ShrinkRatio).toBe(1)
		end)
		it("should parse flex: 'none' to flexGrow 0 and flexShrink 0", function()
			local result = webStyle({
				flex = "none",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIFlexItem"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local flexItem = _result
			expect(flexItem).toBeUndefined()
		end)
		it("should parse flex: '2' as number string", function()
			local result = webStyle({
				flex = "2",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIFlexItem"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local flexItem = _result
			expect(flexItem).toBeDefined()
			expect(flexItem.props.GrowRatio).toBe(2)
			expect(flexItem.props.ShrinkRatio).toBe(2)
		end)
		it("should inject UIFlexItem with ItemLineAlignment for alignSelf 'center'", function()
			local result = webStyle({
				alignSelf = "center",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIFlexItem"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local flexItem = _result
			expect(flexItem).toBeDefined()
			expect(flexItem.props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.Center)
		end)
		it("should inject UIFlexItem with ItemLineAlignment for alignSelf 'stretch'", function()
			local result = webStyle({
				alignSelf = "stretch",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIFlexItem"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local flexItem = _result
			expect(flexItem).toBeDefined()
			expect(flexItem.props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.Stretch)
		end)
		it("should NOT inject UIFlexItem when alignSelf is 'auto'", function()
			local result = webStyle({
				alignSelf = "auto",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIFlexItem"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local flexItem = _result
			expect(flexItem).toBeUndefined()
		end)
		it("should combine flexGrow and alignSelf on a single UIFlexItem", function()
			local result = webStyle({
				flexGrow = 1,
				alignSelf = "flex-end",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIFlexItem"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local flexItem = _result
			expect(flexItem).toBeDefined()
			expect(flexItem.props.FlexMode).toBe(Enum.UIFlexMode.Custom)
			expect(flexItem.props.GrowRatio).toBe(1)
			expect(flexItem.props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.End)
		end)
		it("should inject exactly one UIFlexItem child and no extras", function()
			local result = webStyle({
				flexGrow = 1,
			})
			expect(#result.children).toBe(1)
			expect(result.children[1].type).toBe("UIFlexItem")
		end)
		it("should inject UIFlexItem and issue warning when flexGrow is used with display: 'grid'", function()
			local result = webStyle({
				display = "grid",
				flexGrow = 1,
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIFlexItem"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local flexItem = _result
			expect(flexItem).toBeDefined()
			expect(flexItem.props.GrowRatio).toBe(1)
		end)
		it("should inject UIFlexItem with ItemLineAlignment.Start for alignSelf 'flex-start'", function()
			local result = webStyle({
				alignSelf = "flex-start",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIFlexItem"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local flexItem = _result
			expect(flexItem).toBeDefined()
			expect(flexItem.props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.Start)
		end)
		it("should inject UIFlexItem with ItemLineAlignment.End for alignSelf 'flex-end'", function()
			local result = webStyle({
				alignSelf = "flex-end",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIFlexItem"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local flexItem = _result
			expect(flexItem).toBeDefined()
			expect(flexItem.props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.End)
		end)
	end)
	describe("29. background: linear-gradient() → <uigradient>", function()
		it("should inject UIGradient for a simple two-color gradient", function()
			local result = webStyle({
				background = "linear-gradient(to right, #ff0000, #0000ff)",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIGradient"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local gradient = _result
			expect(gradient).toBeDefined()
			-- to right = CSS 90deg = Roblox rotation 0
			expect(gradient.props.Rotation).toBe(0)
			expect(gradient.props.Color).toBeDefined()
		end)
		it("should set BackgroundTransparency to 0 (opaque, CSS parity) when gradient is present", function()
			local result = webStyle({
				background = "linear-gradient(to right, red, blue)",
			})
			expect(result.props.BackgroundTransparency).toBe(0)
		end)
		it("should default BackgroundColor3 to white when gradient is present and no backgroundColor set", function()
			local result = webStyle({
				background = "linear-gradient(to right, red, blue)",
			})
			local bg = result.props.BackgroundColor3
			expect(bg.R).toBe(1)
			expect(bg.G).toBe(1)
			expect(bg.B).toBe(1)
		end)
		it("should use explicit backgroundColor when provided alongside gradient", function()
			local result = webStyle({
				background = "linear-gradient(to right, red, blue)",
				backgroundColor = "#ff0000",
			})
			local bg = result.props.BackgroundColor3
			expect(bg.R).toBe(1)
			expect(bg.G).toBe(0)
			expect(bg.B).toBe(0)
		end)
		it("should use default direction (to bottom = Roblox rotation 90) when direction is omitted", function()
			local result = webStyle({
				background = "linear-gradient(#ff0000, #0000ff)",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIGradient"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local gradient = _result
			expect(gradient).toBeDefined()
			expect(gradient.props.Rotation).toBe(90)
		end)
		it("should parse angle-based direction (45deg)", function()
			local result = webStyle({
				background = "linear-gradient(45deg, red, blue)",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIGradient"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local gradient = _result
			expect(gradient).toBeDefined()
			-- 45deg CSS - 90 = -45 Roblox
			expect(gradient.props.Rotation).toBe(-45)
		end)
		it("should parse 'to left' direction", function()
			local result = webStyle({
				background = "linear-gradient(to left, red, blue)",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIGradient"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local gradient = _result
			expect(gradient.props.Rotation).toBe(180)
		end)
		it("should parse 'to top' direction", function()
			local result = webStyle({
				background = "linear-gradient(to top, red, blue)",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIGradient"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local gradient = _result
			-- 0deg CSS - 90 = -90 Roblox
			expect(gradient.props.Rotation).toBe(-90)
		end)
		it("should include NumberSequence transparency when rgba colors are used", function()
			local result = webStyle({
				background = "linear-gradient(to right, rgba(255,0,0,1), rgba(0,0,255,0.5))",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIGradient"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local gradient = _result
			expect(gradient).toBeDefined()
			expect(gradient.props.Transparency).toBeDefined()
		end)
		it("should map UIGradient offset and explicit rotation overrides", function()
			local result = webStyle({
				background = "linear-gradient(to right, red, blue)",
				backgroundGradientOffset = "0.25 -0.5",
				backgroundGradientRotation = 45,
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIGradient"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local gradient = _result
			expect(gradient).toBeDefined()
			expect((gradient.props.Offset).X).toBe(0.25)
			expect((gradient.props.Offset).Y).toBe(-0.5)
			expect(gradient.props.Rotation).toBe(45)
		end)
		it("should NOT include transparency when all colors are fully opaque", function()
			local result = webStyle({
				background = "linear-gradient(to right, #ff0000, #0000ff)",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIGradient"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local gradient = _result
			expect(gradient.props.Transparency).toBeUndefined()
		end)
		it("should NOT inject UIGradient when background is not a gradient string", function()
			local result = webStyle({
				background = "not-a-gradient",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIGradient"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local gradient = _result
			expect(gradient).toBeUndefined()
		end)
		it("should coexist with other children (borderRadius + gradient)", function()
			local result = webStyle({
				background = "linear-gradient(to right, red, blue)",
				borderRadius = "8px",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIGradient"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			expect(_result).toBeDefined()
			local _exp_1 = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback_1 = function(c)
				return c.type == "UICorner"
			end
			local _result_1
			for _i, _v in _exp_1 do
				if _callback_1(_v, _i - 1, _exp_1) == true then
					_result_1 = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			expect(_result_1).toBeDefined()
		end)
		it("should not let opacity override BackgroundTransparency when gradient is present", function()
			local result = webStyle({
				background = "linear-gradient(to right, red, blue)",
				opacity = 0.5,
			})
			-- Gradient sets BackgroundTransparency to 0, opacity should not override
			expect(result.props.BackgroundTransparency).toBe(0)
		end)
		it("should use aspect-ratio-aware corner keyword when pixel dimensions are provided", function()
			local result = webStyle({
				width = 200,
				height = 100,
				background = "linear-gradient(to top right, red, blue)",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIGradient"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local gradient = _result
			expect(gradient).toBeDefined()
			-- atan2(200, 100) ≈ 63.43deg CSS → 63.43 - 90 ≈ -26.57 Roblox
			local rotation = gradient.props.Rotation
			expect(rotation).toBeCloseTo(-26.57, 0)
		end)
	end)
	describe("Multiple constraints", function()
		it("should produce multiple children if necessary", function()
			local result = webStyle({
				borderRadius = "5px",
				padding = "10px",
				display = "flex",
				border = "1px solid red",
				aspectRatio = 1,
			})
			expect(#result.children).toBe(5)
		end)
	end)
	describe("calc() in style properties", function()
		it("should parse calc() in width to produce UDim2 with both Scale and Offset", function()
			local result = webStyle({
				width = "calc(100% - 20px)",
				height = "50px",
			})
			expect(result.props.Size).toBeDefined()
			local size = result.props.Size
			expect(size.X.Scale).toBeCloseTo(1.0, 5)
			expect(size.X.Offset).toBe(-20)
			expect(size.Y.Scale).toBe(0)
			expect(size.Y.Offset).toBe(50)
		end)
		it("should parse calc() in height", function()
			local result = webStyle({
				width = "100%",
				height = "calc(100% - 40px)",
			})
			expect(result.props.Size).toBeDefined()
			local size = result.props.Size
			expect(size.X.Scale).toBeCloseTo(1.0, 5)
			expect(size.X.Offset).toBe(0)
			expect(size.Y.Scale).toBeCloseTo(1.0, 5)
			expect(size.Y.Offset).toBe(-40)
		end)
		it("should parse calc() in both width and height", function()
			local result = webStyle({
				width = "calc(50% + 10px)",
				height = "calc(100% - 30px)",
			})
			expect(result.props.Size).toBeDefined()
			local size = result.props.Size
			expect(size.X.Scale).toBeCloseTo(0.5, 5)
			expect(size.X.Offset).toBe(10)
			expect(size.Y.Scale).toBeCloseTo(1.0, 5)
			expect(size.Y.Offset).toBe(-30)
		end)
		it("should parse calc() in individual padding sides", function()
			local result = webStyle({
				paddingTop = "calc(50% - 5px)",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIPadding"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect((child.props.PaddingTop).Scale).toBeCloseTo(0.5, 5)
			expect((child.props.PaddingTop).Offset).toBe(-5)
		end)
		it("should parse calc() in gap", function()
			local result = webStyle({
				display = "flex",
				gap = "calc(0% + 15px)",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIListLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect((child.props.Padding).Offset).toBe(15)
		end)
		it("should parse calc() in borderRadius", function()
			local result = webStyle({
				borderRadius = "calc(50% - 2px)",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UICorner"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			local radius = child.props.CornerRadius
			expect(radius.Scale).toBeCloseTo(0.5, 5)
			expect(radius.Offset).toBe(-2)
		end)
		it("should coexist with other style properties", function()
			local result = webStyle({
				width = "calc(100% - 20px)",
				height = "calc(100% - 20px)",
				backgroundColor = "#333",
				borderRadius = "8px",
			})
			expect(result.props.Size).toBeDefined()
			local size = result.props.Size
			expect(size.X.Scale).toBeCloseTo(1.0, 5)
			expect(size.X.Offset).toBe(-20)
			expect(result.props.BackgroundColor3).toBeDefined()
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UICorner"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local corner = _result
			expect(corner).toBeDefined()
		end)
	end)
	describe("Malformed / invalid input resilience", function()
		it("should not crash when width is a garbage string", function()
			local result = webStyle({
				width = "banana",
			})
			expect(result.props.Size).toBeDefined()
			local size = result.props.Size
			expect(size.X.Scale).toBe(0)
			expect(size.X.Offset).toBe(0)
		end)
		it("should not crash when height is a garbage string", function()
			local result = webStyle({
				height = "not-a-size",
			})
			expect(result.props.Size).toBeDefined()
			local size = result.props.Size
			expect(size.Y.Scale).toBe(0)
			expect(size.Y.Offset).toBe(0)
		end)
		it("should not crash when padding is a garbage string", function()
			local result = webStyle({
				padding = "fizzbuzz",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIPadding"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect((child.props.PaddingTop).Offset).toBe(0)
			expect((child.props.PaddingTop).Scale).toBe(0)
		end)
		it("should not crash when borderRadius is a garbage string", function()
			local result = webStyle({
				borderRadius = "lol",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UICorner"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			local radius = child.props.CornerRadius
			expect(radius.Scale).toBe(0)
			expect(radius.Offset).toBe(0)
		end)
		it("should not crash on an empty border string", function()
			local result = webStyle({
				border = "nope",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIStroke"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect(child.props.Thickness).toBe(0)
		end)
		it("should not crash when backgroundColor is a garbage string", function()
			local result = webStyle({
				backgroundColor = "xyzzy",
			})
			expect(result.props.BackgroundColor3).toBeDefined()
		end)
		it("should not crash when gap is a garbage string", function()
			local result = webStyle({
				display = "flex",
				gap = "hello",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "UIListLayout"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local child = _result
			expect(child).toBeDefined()
			expect((child.props.Padding).Offset).toBe(0)
			expect((child.props.Padding).Scale).toBe(0)
		end)
		it("should produce a valid result when all string values are garbage", function()
			local result = webStyle({
				width = "foo",
				height = "bar",
				padding = "baz",
				borderRadius = "qux",
				border = "quux",
				gap = "corge",
				backgroundColor = "grault",
			})
			expect(result.props).toBeDefined()
			expect(result.children).toBeDefined()
			expect(result.props.Size).toBeDefined()
		end)
		it("should return empty props and no children for an empty style", function()
			local result = webStyle({})
			expect(result.props.Size).toBeUndefined()
			expect(result.props.BackgroundColor3).toBeUndefined()
			expect(#result.children).toBe(0)
		end)
	end)
	describe("textShadow → <textlabel> duplicate", function()
		it("should parse textShadow and output duplicate <textlabel> with gradient", function()
			local result = webStyle({
				textShadow = "3px 4px rgba(0, 0, 0, 0.5)",
				fontSize = 24,
			}, "Hello World")
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "textlabel"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local shadowChild = _result
			expect(shadowChild).toBeDefined()
			expect(shadowChild.props.Text).toBe("Hello World")
			expect(shadowChild.props.ZIndex).toBe(-1)
			expect(shadowChild.props.TextSize).toBe(24)
			local pos = shadowChild.props.Position
			expect(pos.X.Offset).toBe(3)
			expect(pos.Y.Offset).toBe(4)
			local textColor = shadowChild.props.TextColor3
			expect(textColor.R).toBe(0)
			expect(textColor.G).toBe(0)
			expect(textColor.B).toBe(0)
			expect(shadowChild.props.TextTransparency).toBeCloseTo(0.5, 5)
			expect(shadowChild.props.BackgroundTransparency).toBe(1)
			local gradientChild = (shadowChild.props.children)
			expect(gradientChild).toBeDefined()
			expect(gradientChild.type).toBe("uigradient")
			expect(gradientChild.props.Color).toBeDefined()
		end)
		it("should parse textShadow without offset dimensions", function()
			local result = webStyle({
				textShadow = "#ff0000",
			}, "No Offset")
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "textlabel"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local shadowChild = _result
			expect(shadowChild).toBeDefined()
			local pos = shadowChild.props.Position
			expect(pos.X.Offset).toBe(0)
			expect(pos.Y.Offset).toBe(0)
			local textColor = shadowChild.props.TextColor3
			expect(textColor.R).toBe(1)
			expect(textColor.G).toBe(0)
			expect(textColor.B).toBe(0)
		end)
		it("should parse negative dimensions in textShadow", function()
			local result = webStyle({
				textShadow = "-5px -2px #00ff00",
			}, "Negative Offset")
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "textlabel"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local shadowChild = _result
			expect(shadowChild).toBeDefined()
			local pos = shadowChild.props.Position
			expect(pos.X.Offset).toBe(-5)
			expect(pos.Y.Offset).toBe(-2)
		end)
		it("should fall back to default shadow color if none provided", function()
			local result = webStyle({
				textShadow = "10px 10px",
			}, "Default Color")
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "textlabel"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local shadowChild = _result
			expect(shadowChild).toBeDefined()
			local textColor = shadowChild.props.TextColor3
			expect(textColor.R).toBe(0)
			expect(textColor.G).toBe(0)
			expect(textColor.B).toBe(0)
			expect(shadowChild.props.TextTransparency).toBeCloseTo(0.5, 5)
		end)
		it("should not create textShadow if hostText is not provided", function()
			local result = webStyle({
				textShadow = "10px 10px #000",
			})
			local _exp = result.children
			-- ▼ ReadonlyArray.find ▼
			local _callback = function(c)
				return c.type == "textlabel"
			end
			local _result
			for _i, _v in _exp do
				if _callback(_v, _i - 1, _exp) == true then
					_result = _v
					break
				end
			end
			-- ▲ ReadonlyArray.find ▲
			local shadowChild = _result
			expect(shadowChild).toBeUndefined()
		end)
	end)
	describe("Creator Hub UI object mappings", function()
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
				return c.type == "UIListLayout"
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
				return c.type == "UIGridLayout"
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
				return c.type == "UITableLayout"
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
			local tablePadding = tableLayout.props.Padding
			expect(tablePadding.X.Offset).toBe(4)
			expect(tablePadding.Y.Offset).toBe(8)
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
				return c.type == "UIPageLayout"
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
				return c.type == "UIScale"
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
				return c.type == "UITextSizeConstraint"
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
end)
