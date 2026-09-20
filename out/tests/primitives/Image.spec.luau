-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _jest_globals = TS.import(script, TS.getModule(script, "@rbxts", "jest-globals").src)
local describe = _jest_globals.describe
local expect = _jest_globals.expect
local it = _jest_globals.it
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local renderElement = TS.import(script, script.Parent.Parent, "renderProbe").renderElement
-- Dynamically require client files to bypass roblox-ts isolated container checks
local robloxCSS = game:GetService("ReplicatedStorage"):WaitForChild("roblox-css")
local uiPrimitives = robloxCSS:WaitForChild("primitives")
local imageModule = require(uiPrimitives:WaitForChild("Image"))
local Image = imageModule.Image
local makeImageProps = imageModule.makeImageProps
describe("Image primitives", function()
	describe("makeImageProps", function()
		it("should return the exact same object provided (branded cast)", function()
			local input = {
				src = "rbxassetid://12345",
			}
			local result = makeImageProps(input)
			expect(result).toBe(input)
		end)
		it("should preserve identity of empty objects", function()
			local input = {}
			local result = makeImageProps(input)
			expect(result).toBe(input)
		end)
	end)
	describe("Image component", function()
		local renderImage = function(props, ref)
			if ref == nil then
				ref = nil
			end
			-- Runs through a probe component: the primitive calls hooks now.
			return renderElement(Image.render, props, ref)
		end
		it("should apply opacity math to ImageTransparency", function()
			local element = renderImage({
				style = {
					opacity = 0.5,
				},
			})
			expect(element.props.ImageTransparency).toBe(0.5)
		end)
		it("should apply opacity math to existing ImageTransparency in style", function()
			local element = renderImage({
				style = {
					opacity = 0.5,
					ImageTransparency = 0.5,
				},
			})
			expect(element.props.ImageTransparency).toBe(0.75)
		end)
		it("should render an imagelabel element without style or src", function()
			local element = renderImage({
				BackgroundColor3 = Color3.new(1, 0, 0),
			})
			expect(element).toBeDefined()
			expect(element.type).toBe("ImageLabel")
			-- Native props passed through
			expect(element.props.BackgroundColor3).toBeDefined()
			local color = element.props.BackgroundColor3
			expect(color.R).toBe(1)
			expect(color.G).toBe(0)
			expect(color.B).toBe(0)
			-- Defaults should be applied
			expect(element.props.BackgroundTransparency).toBe(1)
			-- Custom props should be stripped
			expect(element.props.style).toBeUndefined()
			expect(element.props.src).toBeUndefined()
			-- Image property should not be set if src wasn't passed
			expect(element.props.Image).toBeUndefined()
		end)
		it("should map src prop to Image property", function()
			local element = renderImage({
				src = "rbxassetid://12345",
			})
			expect(element.type).toBe("ImageLabel")
			expect(element.props.Image).toBe("rbxassetid://12345")
			expect(element.props.src).toBeUndefined()
		end)
		it("should apply webStyle and merge its props and children", function()
			local element = renderImage({
				style = {
					width = "100px",
					borderRadius = "5px",
				},
				src = "rbxassetid://54321",
			})
			expect(element.type).toBe("ImageLabel")
			-- Explicit props mapped
			expect(element.props.Image).toBe("rbxassetid://54321")
			-- Style props should be mapped
			local size = element.props.Size
			expect(size).toBeDefined()
			expect(size.X.Offset).toBe(100)
			expect(size.Y.Scale).toBeCloseTo(1, 5)
			-- Style children should be injected
			expect(element.props.children).toBeDefined()
			-- React stores multiple children as an array.
			local childrenArray = element.props.children
			local parsedChildren = childrenArray[1]
			expect(parsedChildren).toBeDefined()
			expect(#parsedChildren).toBe(1)
			expect(parsedChildren[1].type).toBe("UICorner")
			expect((parsedChildren[1].props.CornerRadius).Offset).toBe(5)
		end)
		it("should let explicit props override style props due to spread order", function()
			-- Image.tsx uses: <imagelabel {...defaultProps} {...parsedStyleProps} {...explicitProps}>
			-- Therefore, explicit props should overwrite parsedStyleProps.
			local element = renderImage({
				BackgroundColor3 = Color3.new(1, 1, 1),
				style = {
					backgroundColor = "#000000",
				},
			})
			expect(element.props.BackgroundColor3).toBeDefined()
			local color = element.props.BackgroundColor3
			expect(color.R).toBe(1)
			expect(color.G).toBe(1)
			expect(color.B).toBe(1)
		end)
		it("should render explicit children alongside style children", function()
			local mockChild = React.createElement("textlabel", {
				Text = "Hello World",
			})
			local element = renderImage({
				style = {
					padding = "10px",
				},
				children = mockChild,
			})
			expect(element.type).toBe("ImageLabel")
			local childrenArray = element.props.children
			expect(childrenArray).toBeDefined()
			local parsedChildren = childrenArray[1]
			local explicitChildren = childrenArray[2]
			-- Ensure style constraint was added
			expect(#parsedChildren).toBe(1)
			expect(parsedChildren[1].type).toBe("UIPadding")
			-- Ensure explicit child was preserved
			expect(explicitChildren).toBe(mockChild)
		end)
		it("should forward refs correctly", function()
			local mockRef = React.createRef()
			local element = renderImage({}, mockRef)
			expect(element.ref).toBe(mockRef)
		end)
		it("should forward refs correctly when style is provided", function()
			local mockRef = React.createRef()
			local element = renderImage({
				style = {
					width = "10px",
				},
			}, mockRef)
			expect(element.ref).toBe(mockRef)
		end)
	end)
end)
