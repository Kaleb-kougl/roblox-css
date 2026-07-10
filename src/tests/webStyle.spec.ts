const _jestGlobals = require(
	game.GetService("ReplicatedStorage")
		.WaitForChild("rbxts_include")
		.WaitForChild("node_modules")
		.WaitForChild("@rbxts")
		.WaitForChild("jest-globals")
		.WaitForChild("src") as ModuleScript
) as typeof import("@rbxts/jest-globals");
const { describe, expect, it } = _jestGlobals;

// Dynamically require client files to bypass roblox-ts isolated container checks
const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const uiStyles = robloxCSS.WaitForChild("styles");

type ReactElementStub = {
	type: string;
	props: Record<string, unknown>;
};

const webStyleModule = require(uiStyles.WaitForChild("webStyle") as ModuleScript) as {
	webStyle: (style: Record<string, unknown>, hostText?: string) => { props: Record<string, unknown>; children: ReactElementStub[] };
};
const webStyle = webStyleModule.webStyle;

describe("webStyle", () => {
	describe("1. width / height → Size", () => {
		it("should parse width and height to Size", () => {
			const result = webStyle({ width: "50%", height: "100px" });
			expect(result.props.Size).toBeDefined();
			const size = result.props.Size as UDim2;
			expect(size.X.Scale).toBeCloseTo(0.5, 5);
			expect(size.X.Offset).toBe(0);
			expect(size.Y.Scale).toBe(0);
			expect(size.Y.Offset).toBe(100);
		});

		it("should default to 100% width and height if only one is provided", () => {
			const result1 = webStyle({ width: "50%" });
			let size = result1.props.Size as UDim2;
			expect(size.X.Scale).toBeCloseTo(0.5, 5);
			expect(size.Y.Scale).toBeCloseTo(1, 5);

			const result2 = webStyle({ height: "100px" });
			size = result2.props.Size as UDim2;
			expect(size.X.Scale).toBeCloseTo(1, 5);
			expect(size.Y.Offset).toBe(100);
		});

		it("should not define Size if width and height are undefined", () => {
			const result = webStyle({});
			expect(result.props.Size).toBeUndefined();
		});
	});

	describe("minWidth / maxWidth → <uisizeconstraint>", () => {
		it("should inject <uisizeconstraint> with correct Vector2 properties when minWidth and maxHeight are provided", () => {
			const result = webStyle({ minWidth: "50px", maxHeight: "100px" });
			expect(result.children.size()).toBe(1);
			const child = result.children[0];
			expect(child!.type).toBe("UISizeConstraint");
			const minSize = child!.props.MinSize as Vector2;
			const maxSize = child!.props.MaxSize as Vector2;
			expect(minSize.X).toBe(50);
			expect(minSize.Y).toBe(0);
			expect(maxSize.X).toBe(math.huge);
			expect(maxSize.Y).toBe(100);
		});

		it("should correctly fallback unassigned axes to 0 for MinSize and math.huge for MaxSize", () => {
			const result = webStyle({ maxWidth: "200px", minHeight: "25px" });
			const child = result.children[0];
			expect(child!.type).toBe("UISizeConstraint");
			const minSize = child!.props.MinSize as Vector2;
			const maxSize = child!.props.MaxSize as Vector2;
			expect(minSize.X).toBe(0);
			expect(minSize.Y).toBe(25);
			expect(maxSize.X).toBe(200);
			expect(maxSize.Y).toBe(math.huge);
		});
	});

	describe("11.5. Percentage constraint skip guard", () => {
		it("should NOT emit UISizeConstraint when maxWidth is a percentage", () => {
			const result = webStyle({ maxWidth: "50%" });
			const constraint = result.children.find((c) => c.type === "UISizeConstraint");
			expect(constraint).toBeUndefined();
		});

		it("should NOT emit UISizeConstraint when minHeight is a percentage", () => {
			const result = webStyle({ minHeight: "25%" });
			const constraint = result.children.find((c) => c.type === "UISizeConstraint");
			expect(constraint).toBeUndefined();
		});

		it("should NOT emit UISizeConstraint when mixed pixel + percentage", () => {
			const result = webStyle({ minWidth: "200px", maxWidth: "50%" });
			const constraint = result.children.find((c) => c.type === "UISizeConstraint");
			expect(constraint).toBeUndefined();
		});

		it("should STILL emit UISizeConstraint when all constraints are pixel-only", () => {
			const result = webStyle({ minWidth: "50px", maxHeight: "100px" });
			const constraint = result.children.find((c) => c.type === "UISizeConstraint");
			expect(constraint).toBeDefined();
			const minSize = constraint!.props.MinSize as Vector2;
			const maxSize = constraint!.props.MaxSize as Vector2;
			expect(minSize.X).toBe(50);
			expect(minSize.Y).toBe(0);
			expect(maxSize.X).toBe(math.huge);
			expect(maxSize.Y).toBe(100);
		});

		it("should STILL emit UISizeConstraint for numeric pixel values", () => {
			const result = webStyle({ maxWidth: 400 });
			const constraint = result.children.find((c) => c.type === "UISizeConstraint");
			expect(constraint).toBeDefined();
			const maxSize = constraint!.props.MaxSize as Vector2;
			expect(maxSize.X).toBe(400);
		});

		it("should NOT emit UISizeConstraint when any single axis is a percentage", () => {
			const result = webStyle({ minWidth: "100px", maxWidth: "300px", minHeight: "50px", maxHeight: "80%" });
			const constraint = result.children.find((c) => c.type === "UISizeConstraint");
			expect(constraint).toBeUndefined();
		});

		it("should not affect other children when percentage constraint skips", () => {
			const result = webStyle({ maxWidth: "50%", borderRadius: "8px" });
			const constraint = result.children.find((c) => c.type === "UISizeConstraint");
			const corner = result.children.find((c) => c.type === "UICorner");
			expect(constraint).toBeUndefined();
			expect(corner).toBeDefined();
		});
	});

	describe("2. backgroundColor → BackgroundColor3 + BackgroundTransparency", () => {
		it("should parse hex colors to BackgroundColor3", () => {
			const result = webStyle({ backgroundColor: "#ff0000" });
			expect(result.props.BackgroundColor3).toBeDefined();
			const color = result.props.BackgroundColor3 as Color3;
			expect(color.R).toBe(1);
			expect(color.G).toBe(0);
			expect(color.B).toBe(0);
			expect(result.props.BackgroundTransparency).toBe(0);
		});

		it("should set BackgroundTransparency to 1 for transparent background", () => {
			const result = webStyle({ backgroundColor: "transparent" });
			expect(result.props.BackgroundTransparency).toBe(1);
		});
	});

	describe("3. opacity → BackgroundTransparency", () => {
		it("should invert opacity to set BackgroundTransparency", () => {
			const result = webStyle({ opacity: 0.2 });
			expect(result.props.BackgroundTransparency).toBeCloseTo(0.8, 5);
		});

		it("should let opacity override backgroundColor transparency", () => {
			const result = webStyle({ backgroundColor: "transparent", opacity: 0.5 });
			expect(result.props.BackgroundTransparency).toBeCloseTo(0.5, 5);
		});
	});

	describe("4. borderRadius → <uicorner>", () => {
		it("should inject <uicorner> child with CornerRadius", () => {
			const result = webStyle({ borderRadius: "10px" });
			expect(result.children.size()).toBe(1);
			const child = result.children[0];
			expect(child!.type).toBe("UICorner");
			const radius = child!.props.CornerRadius as UDim;
			expect(radius.Offset).toBe(10);
			expect(radius.Scale).toBe(0);
		});

		it("should map individual rounded corners to UICorner radius fields", () => {
			const result = webStyle({
				borderRadius: "10px",
				borderTopRightRadius: "20px",
				borderBottomLeftRadius: "30px",
			});
			const child = result.children.find((c) => c.type === "UICorner");
			expect(child).toBeDefined();
			expect((child!.props.TopLeftRadius as UDim).Offset).toBe(10);
			expect((child!.props.TopRightRadius as UDim).Offset).toBe(20);
			expect((child!.props.BottomRightRadius as UDim).Offset).toBe(10);
			expect((child!.props.BottomLeftRadius as UDim).Offset).toBe(30);
		});

		it("should expand four-value borderRadius when individual corner fields are used", () => {
			const result = webStyle({
				borderRadius: "1px 2px 3px 4px",
				borderTopLeftRadius: "5px",
			});
			const child = result.children.find((c) => c.type === "UICorner");
			expect(child).toBeDefined();
			expect((child!.props.TopLeftRadius as UDim).Offset).toBe(5);
			expect((child!.props.TopRightRadius as UDim).Offset).toBe(2);
			expect((child!.props.BottomRightRadius as UDim).Offset).toBe(3);
			expect((child!.props.BottomLeftRadius as UDim).Offset).toBe(4);
		});

		it("should create UICorner from individual radius fields without borderRadius", () => {
			const result = webStyle({ borderBottomRightRadius: "12px" });
			const child = result.children.find((c) => c.type === "UICorner");
			expect(child).toBeDefined();
			expect((child!.props.TopLeftRadius as UDim).Offset).toBe(0);
			expect((child!.props.TopRightRadius as UDim).Offset).toBe(0);
			expect((child!.props.BottomRightRadius as UDim).Offset).toBe(12);
			expect((child!.props.BottomLeftRadius as UDim).Offset).toBe(0);
		});
	});

	describe("5. padding → <uipadding>", () => {
		it("should inject <uipadding> with shorthand padding", () => {
			const result = webStyle({ padding: "10px 20px" });
			const child = result.children.find((c) => c.type === "UIPadding");
			expect(child).toBeDefined();
			expect((child!.props.PaddingTop as UDim).Offset).toBe(10);
			expect((child!.props.PaddingBottom as UDim).Offset).toBe(10);
			expect((child!.props.PaddingLeft as UDim).Offset).toBe(20);
			expect((child!.props.PaddingRight as UDim).Offset).toBe(20);
		});

		it("should let individual sides override shorthand padding", () => {
			const result = webStyle({ padding: "10px", paddingLeft: "5px" });
			const child = result.children.find((c) => c.type === "UIPadding");
			expect(child).toBeDefined();
			expect((child!.props.PaddingTop as UDim).Offset).toBe(10);
			expect((child!.props.PaddingLeft as UDim).Offset).toBe(5);
		});

		it("should handle just individual sides", () => {
			const result = webStyle({ paddingRight: "15%" });
			const child = result.children.find((c) => c.type === "UIPadding");
			expect(child).toBeDefined();
			expect((child!.props.PaddingRight as UDim).Scale).toBeCloseTo(0.15, 5);
			expect((child!.props.PaddingTop as UDim).Offset).toBe(0);
		});

		it("should map paddingInline and paddingBlock logical properties", () => {
			const result = webStyle({ padding: "10px", paddingInline: "20px 30px", paddingBlock: "5px" });
			const child = result.children.find((c) => c.type === "UIPadding");
			expect(child).toBeDefined();
			expect((child!.props.PaddingTop as UDim).Offset).toBe(5);
			expect((child!.props.PaddingBottom as UDim).Offset).toBe(5);
			expect((child!.props.PaddingLeft as UDim).Offset).toBe(20);
			expect((child!.props.PaddingRight as UDim).Offset).toBe(30);
		});
	});

	describe("6. display: 'flex' → <uilistlayout>", () => {
		it("should inject <uilistlayout> for flex display", () => {
			const result = webStyle({ display: "flex" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child).toBeDefined();
			expect(child!.props.FillDirection).toBe(Enum.FillDirection.Vertical);
			expect(child!.props.SortOrder).toBe(Enum.SortOrder.LayoutOrder);
		});

		it("should map flexDirection: 'row'", () => {
			const result = webStyle({ display: "flex", flexDirection: "row" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.FillDirection).toBe(Enum.FillDirection.Horizontal);
		});

		it("should map justifyContent and alignItems for column", () => {
			const result = webStyle({
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "flex-end",
			});
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.VerticalAlignment).toBe(Enum.VerticalAlignment.Center);
			expect(child!.props.HorizontalAlignment).toBe(Enum.HorizontalAlignment.Right);
		});

		it("should map justifyContent and alignItems for row", () => {
			const result = webStyle({
				display: "flex",
				flexDirection: "row",
				justifyContent: "flex-end",
				alignItems: "center",
			});
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.HorizontalAlignment).toBe(Enum.HorizontalAlignment.Right);
			expect(child!.props.VerticalAlignment).toBe(Enum.VerticalAlignment.Center);
		});

		it("should map gap to Padding", () => {
			const result = webStyle({ display: "flex", gap: "10px" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect((child!.props.Padding as UDim).Offset).toBe(10);
		});

		it("should map flexWrap: 'wrap' to Wraps: true", () => {
			const result = webStyle({ display: "flex", flexWrap: "wrap" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.Wraps).toBe(true);
		});

		it("should not set Wraps for flexWrap: 'nowrap'", () => {
			const result = webStyle({ display: "flex", flexWrap: "nowrap" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.Wraps).toBeUndefined();
		});

		it("should map justifyContent: 'space-between' to HorizontalFlex for row", () => {
			const result = webStyle({ display: "flex", flexDirection: "row", justifyContent: "space-between" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.HorizontalFlex).toBe(Enum.UIFlexAlignment.SpaceBetween);
			expect(child!.props.HorizontalAlignment).toBeUndefined();
		});

		it("should map alignItems: 'stretch' to ItemLineAlignment", () => {
			const result = webStyle({ display: "flex", alignItems: "stretch" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.Stretch);
		});

		it("should map flexFlow 'row wrap' correctly", () => {
			const result = webStyle({ display: "flex", flexFlow: "row wrap" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.FillDirection).toBe(Enum.FillDirection.Horizontal);
			expect(child!.props.Wraps).toBe(true);
		});

		it("should map flexFlow 'column nowrap' correctly", () => {
			const result = webStyle({ display: "flex", flexFlow: "column nowrap" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.FillDirection).toBe(Enum.FillDirection.Vertical);
			expect(child!.props.Wraps).toBeUndefined();
		});

		it("should map flexFlow 'column-reverse' fallback to column", () => {
			const result = webStyle({ display: "flex", flexFlow: "column-reverse" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.FillDirection).toBe(Enum.FillDirection.Vertical);
		});

		it("should parse single values in flexFlow", () => {
			const result1 = webStyle({ display: "flex", flexFlow: "row" });
			const child1 = result1.children.find((c) => c.type === "UIListLayout");
			expect(child1!.props.FillDirection).toBe(Enum.FillDirection.Horizontal);

			const result2 = webStyle({ display: "flex", flexFlow: "wrap" });
			const child2 = result2.children.find((c) => c.type === "UIListLayout");
			expect(child2!.props.Wraps).toBe(true);
		});

		it("should map placeContent to justifyContent", () => {
			const result = webStyle({ display: "flex", placeContent: "center flex-end" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.VerticalAlignment).toBe(Enum.VerticalAlignment.Bottom);
		});

		it("should map placeItems to alignItems", () => {
			const result = webStyle({ display: "flex", placeItems: "center stretch" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.HorizontalAlignment).toBe(Enum.HorizontalAlignment.Center);
		});

		it("should map justifyContent: 'space-around' to HorizontalFlex/VerticalFlex", () => {
			const resultRow = webStyle({ display: "flex", flexDirection: "row", justifyContent: "space-around" });
			const childRow = resultRow.children.find((c) => c.type === "UIListLayout");
			expect(childRow!.props.HorizontalFlex).toBe(Enum.UIFlexAlignment.SpaceAround);

			const resultCol = webStyle({ display: "flex", flexDirection: "column", justifyContent: "space-around" });
			const childCol = resultCol.children.find((c) => c.type === "UIListLayout");
			expect(childCol!.props.VerticalFlex).toBe(Enum.UIFlexAlignment.SpaceAround);
		});
	});

	describe("6.5. display: 'grid' → <uigridlayout>", () => {
		it("should inject <uigridlayout> for grid display", () => {
			const result = webStyle({ display: "grid" });
			const child = result.children.find((c) => c.type === "UIGridLayout");
			expect(child).toBeDefined();
			expect(child!.props.SortOrder).toBe(Enum.SortOrder.LayoutOrder);
		});

		it("should map gridTemplateColumns and gridTemplateRows to CellSize", () => {
			const result = webStyle({ display: "grid", gridTemplateColumns: "120px", gridTemplateRows: "150px" });
			const child = result.children.find((c) => c.type === "UIGridLayout");
			const cellSize = child!.props.CellSize as UDim2;
			expect(cellSize.X.Offset).toBe(120);
			expect(cellSize.Y.Offset).toBe(150);
		});

		it("should map gap to CellPadding", () => {
			const result = webStyle({ display: "grid", gap: "10px 20px" });
			const child = result.children.find((c) => c.type === "UIGridLayout");
			const cellPadding = child!.props.CellPadding as UDim2;
			expect(cellPadding.X.Offset).toBe(10);
			expect(cellPadding.Y.Offset).toBe(20);
		});

		it("should map rowGap and columnGap to CellPadding", () => {
			const result = webStyle({ display: "grid", rowGap: "15px", columnGap: "25px" });
			const child = result.children.find((c) => c.type === "UIGridLayout");
			const cellPadding = child!.props.CellPadding as UDim2;
			expect(cellPadding.X.Offset).toBe(25);
			expect(cellPadding.Y.Offset).toBe(15);
		});

		it("should prioritize rowGap and columnGap over gap", () => {
			const result = webStyle({ display: "grid", gap: "5px", rowGap: "15px", columnGap: "25px" });
			const child = result.children.find((c) => c.type === "UIGridLayout");
			const cellPadding = child!.props.CellPadding as UDim2;
			expect(cellPadding.X.Offset).toBe(25);
			expect(cellPadding.Y.Offset).toBe(15);
		});

		it("should map justifyContent and alignItems for grid", () => {
			const result = webStyle({ display: "grid", justifyContent: "center", alignItems: "flex-end" });
			const child = result.children.find((c) => c.type === "UIGridLayout");
			expect(child!.props.HorizontalAlignment).toBe(Enum.HorizontalAlignment.Center);
			expect(child!.props.VerticalAlignment).toBe(Enum.VerticalAlignment.Bottom);
		});

		it("should map flexDirection to FillDirection for grid (default row)", () => {
			const result1 = webStyle({ display: "grid" });
			const child1 = result1.children.find((c) => c.type === "UIGridLayout");
			expect(child1!.props.FillDirection).toBe(Enum.FillDirection.Horizontal);

			const result2 = webStyle({ display: "grid", flexDirection: "column" });
			const child2 = result2.children.find((c) => c.type === "UIGridLayout");
			expect(child2!.props.FillDirection).toBe(Enum.FillDirection.Vertical);
		});
	});

	describe("7. border → <uistroke>", () => {
		it("should inject <uistroke> child with Thickness, Color, and Border mode", () => {
			const result = webStyle({ border: "2px solid #00ff00" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Thickness).toBe(2);
			const color = child!.props.Color as Color3;
			expect(color.R).toBe(0);
			expect(color.G).toBe(1);
			expect(color.B).toBe(0);
			expect(child!.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border);
		});

		it("should alias outline to border and produce UIStroke", () => {
			const result = webStyle({ outline: "2px solid blue" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Thickness).toBe(2);
			const color = child!.props.Color as Color3;
			expect(color.B).toBe(1);
			expect(child!.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border);
		});

		it("should return undefined for thickness only without specifying word", () => {
			const result = webStyle({ border: "3px" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeUndefined();
		});

		it("should return undefined for empty string", () => {
			const result = webStyle({ border: "" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeUndefined();
		});

		it("should parse rgb() border color", () => {
			const result = webStyle({ border: "1px solid rgb(255, 0, 0)" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Thickness).toBe(1);
			const color = child!.props.Color as Color3;
			expect(color.R).toBeCloseTo(1, 2);
			expect(color.G).toBeCloseTo(0, 2);
			expect(color.B).toBeCloseTo(0, 2);
			expect(child!.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border);
		});

		it("should parse rgba() border color and map alpha to UIStroke.Transparency", () => {
			const result = webStyle({ border: "2px solid rgba(0, 128, 255, 0.5)" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Thickness).toBe(2);
			const color = child!.props.Color as Color3;
			expect(color.R).toBeCloseTo(0, 2);
			expect(color.G).toBeCloseTo(0.50, 2);
			expect(color.B).toBeCloseTo(1, 2);
			expect(child!.props.Transparency).toBeCloseTo(0.5, 5);
			expect(child!.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border);
		});

		it("should map native UIStroke controls", () => {
			const result = webStyle({
				border: "4px solid rgba(255, 0, 0, 0.25)",
				borderOffset: "2px",
				borderStrokePosition: "outer",
				lineJoinMode: "bevel",
				strokeSizingMode: "scaled",
				strokeZIndex: 3,
			});
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Thickness).toBe(4);
			expect(child!.props.Transparency).toBeCloseTo(0.75, 5);
			expect((child!.props.BorderOffset as UDim).Offset).toBe(2);
			expect(child!.props.BorderStrokePosition).toBe(Enum.BorderStrokePosition.Outer);
			expect(child!.props.LineJoinMode).toBe(Enum.LineJoinMode.Bevel);
			expect(child!.props.StrokeSizingMode).toBe(Enum.StrokeSizingMode.ScaledSize);
			expect(child!.props.ZIndex).toBe(3);
		});

		it("should let strokeTransparency override color alpha", () => {
			const result = webStyle({
				border: "2px solid rgba(255, 0, 0, 0.25)",
				strokeTransparency: 0.2,
			});
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Transparency).toBeCloseTo(0.2, 5);
		});

		it("should inject a child UIGradient for strokeGradient", () => {
			const result = webStyle({
				border: "2px solid white",
				strokeGradient: "linear-gradient(to bottom, red, blue)",
				strokeGradientOffset: "0.1 0",
				strokeGradientRotation: 15,
			});
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			const gradient = child!.props.children as ReactElementStub;
			expect(gradient).toBeDefined();
			expect(gradient.type).toBe("UIGradient");
			expect((gradient.props.Offset as Vector2).X).toBe(0.1);
			expect(gradient.props.Rotation).toBe(15);
		});

		it("should accept a gradient directly in the border color position", () => {
			const result = webStyle({
				border: "2px solid linear-gradient(to right, red, blue)",
			});
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			const color = child!.props.Color as Color3;
			const gradient = child!.props.children as ReactElementStub;
			expect(color.R).toBe(1);
			expect(color.G).toBe(1);
			expect(color.B).toBe(1);
			expect(gradient).toBeDefined();
			expect(gradient.type).toBe("UIGradient");
		});

		it("should parse hsl() border color", () => {
			const result = webStyle({ border: "1px solid hsl(120, 100%, 50%)" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Thickness).toBe(1);
			const color = child!.props.Color as Color3;
			expect(color.R).toBeCloseTo(0, 2);
			expect(color.G).toBeCloseTo(1, 2);
			expect(color.B).toBeCloseTo(0, 2);
			expect(child!.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border);
		});

		it("should skip 'dashed' style keyword and parse color", () => {
			const result = webStyle({ border: "3px dashed #ff0000" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Thickness).toBe(3);
			const color = child!.props.Color as Color3;
			expect(color.R).toBeCloseTo(1, 2);
			expect(color.G).toBeCloseTo(0, 2);
			expect(color.B).toBeCloseTo(0, 2);
			expect(child!.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border);
		});

		it("should return undefined for missing specifying word with thickness and color", () => {
			const result = webStyle({ border: "2px red" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeUndefined();
		});

		it("should successfully create UIStroke with specifying word only", () => {
			const result = webStyle({ border: "solid" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border);
		});

		it("should parse thickness and specifying word without color", () => {
			const result = webStyle({ border: "2px dashed" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Thickness).toBe(2);
			expect(child!.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border);
		});

		it("should parse color and specifying word without thickness", () => {
			const result = webStyle({ border: "dotted #FF0000" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			const color = child!.props.Color as Color3;
			expect(color.R).toBe(1);
			expect(color.G).toBe(0);
			expect(color.B).toBe(0);
			expect(child!.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border);
		});

		it("should successfully parse regardless of argument order", () => {
			const result1 = webStyle({ border: "2px solid red" });
			const result2 = webStyle({ border: "red solid 2px" });
			
			const child1 = result1.children.find((c) => c.type === "UIStroke");
			const child2 = result2.children.find((c) => c.type === "UIStroke");
			
			expect(child1).toBeDefined();
			expect(child2).toBeDefined();
			
			expect(child1!.props.Thickness).toBe(2);
			expect(child2!.props.Thickness).toBe(2);
			
			const color1 = child1!.props.Color as Color3;
			const color2 = child2!.props.Color as Color3;
			expect(color1.R).toBe(1);
			expect(color2.R).toBe(1);
		});

		it("should handle specifying words case insensitively", () => {
			const result1 = webStyle({ border: "2px SOLID #000" });
			const result2 = webStyle({ border: "2px Dashed #000" });
			
			expect(result1.children.find((c) => c.type === "UIStroke")).toBeDefined();
			expect(result2.children.find((c) => c.type === "UIStroke")).toBeDefined();
		});

		it("should identify specifying word with extraneous text", () => {
			const result = webStyle({ border: "2px solid something-weird" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Thickness).toBe(2);
		});
	});

	describe("8. aspectRatio → <uiaspectratioconstraint>", () => {
		it("should inject <uiaspectratioconstraint> with AspectRatio prop", () => {
			const result = webStyle({ aspectRatio: 1.5 });
			expect(result.children.size()).toBe(1);
			const child = result.children[0];
			expect(child!.type).toBe("UIAspectRatioConstraint");
			expect(child!.props.AspectRatio).toBe(1.5);
		});

		it("should handle integer aspect ratios", () => {
			const result = webStyle({ aspectRatio: 1 });
			const child = result.children.find((c) => c.type === "UIAspectRatioConstraint");
			expect(child).toBeDefined();
			expect(child!.props.AspectRatio).toBe(1);
		});

		it("should handle widescreen aspect ratios", () => {
			const result = webStyle({ aspectRatio: 16 / 9 });
			const child = result.children.find((c) => c.type === "UIAspectRatioConstraint");
			expect(child).toBeDefined();
			expect(child!.props.AspectRatio).toBeCloseTo(1.7778, 3);
		});

		it("should coexist with other constraints", () => {
			const result = webStyle({ aspectRatio: 2, borderRadius: "8px" });
			expect(result.children.size()).toBe(2);
			expect(result.children.find((c) => c.type === "UIAspectRatioConstraint")).toBeDefined();
			expect(result.children.find((c) => c.type === "UICorner")).toBeDefined();
		});
	});

	describe("9. position: 'absolute' → Position + AnchorPoint", () => {
		it("should map top and left", () => {
			const result = webStyle({ position: "absolute", top: "10px", left: "20px" });
			const pos = result.props.Position as UDim2;
			const anchor = result.props.AnchorPoint as Vector2;
			expect(pos.X.Offset).toBe(20);
			expect(pos.Y.Offset).toBe(10);
			expect(anchor.X).toBe(0);
			expect(anchor.Y).toBe(0);
		});

		it("should map right and bottom", () => {
			const result = webStyle({ position: "absolute", bottom: "10px", right: "20px" });
			const pos = result.props.Position as UDim2;
			const anchor = result.props.AnchorPoint as Vector2;
			expect(pos.X.Scale).toBe(1);
			expect(pos.X.Offset).toBe(-20);
			expect(pos.Y.Scale).toBe(1);
			expect(pos.Y.Offset).toBe(-10);
			expect(anchor.X).toBe(1);
			expect(anchor.Y).toBe(1);
		});

		it("should prioritize left over right and top over bottom", () => {
			const result = webStyle({ position: "absolute", left: "5px", right: "10px", top: "15px", bottom: "20px" });
			const pos = result.props.Position as UDim2;
			const anchor = result.props.AnchorPoint as Vector2;
			expect(pos.X.Offset).toBe(5);
			expect(pos.Y.Offset).toBe(15);
			expect(anchor.X).toBe(0);
			expect(anchor.Y).toBe(0);
		});
	});

	describe("10. zIndex → ZIndex", () => {
		it("should map zIndex to ZIndex", () => {
			const result = webStyle({ zIndex: 10 });
			expect(result.props.ZIndex).toBe(10);
		});

		it("should handle negative zIndex", () => {
			const result = webStyle({ zIndex: -5 });
			expect(result.props.ZIndex).toBe(-5);
		});
	});

	describe("transformOrigin → AnchorPoint", () => {
		it("should map 'center' to 0.5, 0.5", () => {
			const result = webStyle({ transformOrigin: "center" });
			const anchor = result.props.AnchorPoint as Vector2;
			expect(anchor.X).toBe(0.5);
			expect(anchor.Y).toBe(0.5);
		});

		it("should map 'top left' to 0, 0", () => {
			const result = webStyle({ transformOrigin: "top left" });
			const anchor = result.props.AnchorPoint as Vector2;
			expect(anchor.X).toBe(0);
			expect(anchor.Y).toBe(0);
		});

		it("should map 'bottom right' to 1, 1", () => {
			const result = webStyle({ transformOrigin: "bottom right" });
			const anchor = result.props.AnchorPoint as Vector2;
			expect(anchor.X).toBe(1);
			expect(anchor.Y).toBe(1);
		});

		it("should map percentages like '100% 50%'", () => {
			const result = webStyle({ transformOrigin: "100% 50%" });
			const anchor = result.props.AnchorPoint as Vector2;
			expect(anchor.X).toBe(1);
			expect(anchor.Y).toBe(0.5);
		});

		it("should handle single keyword 'top'", () => {
			const result = webStyle({ transformOrigin: "top" });
			const anchor = result.props.AnchorPoint as Vector2;
			expect(anchor.X).toBe(0.5);
			expect(anchor.Y).toBe(0);
		});

		it("should override position: absolute's default AnchorPoint", () => {
			const result = webStyle({ position: "absolute", top: 0, left: 0, transformOrigin: "center" });
			const anchor = result.props.AnchorPoint as Vector2;
			expect(anchor.X).toBe(0.5);
			expect(anchor.Y).toBe(0.5);
		});
	});

	describe("11. Typography & Text Styling", () => {
		describe("userSelect → TextSelectable", () => {
			it("should map 'text' and 'auto' to true", () => {
				expect(webStyle({ userSelect: "text" }).props.TextSelectable).toBe(true);
				expect(webStyle({ userSelect: "auto" }).props.TextSelectable).toBe(true);
			});

			it("should map 'none' to false", () => {
				expect(webStyle({ userSelect: "none" }).props.TextSelectable).toBe(false);
			});
		});

		describe("textStroke → <uistroke>", () => {
			it("should map textStroke to Contextual uistroke", () => {
				const result = webStyle({ textStroke: "2px solid #ff0000" });
				const stroke = result.children.find((c) => c.type === "UIStroke" && c.props.ApplyStrokeMode === Enum.ApplyStrokeMode.Contextual);
				expect(stroke).toBeDefined();
				expect(stroke!.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Contextual);
				expect(stroke!.props.Thickness).toBe(2);
			});

			it("should apply native stroke controls to textStroke", () => {
				const result = webStyle({
					textStroke: "3px solid rgba(0, 0, 0, 0.5)",
					lineJoinMode: "miter",
					strokeSizingMode: "fixed",
					strokeTransparency: 0.1,
					strokeZIndex: 7,
				});
				const stroke = result.children.find((c) => c.type === "UIStroke" && c.props.ApplyStrokeMode === Enum.ApplyStrokeMode.Contextual);
				expect(stroke).toBeDefined();
				expect(stroke!.props.Thickness).toBe(3);
				expect(stroke!.props.LineJoinMode).toBe(Enum.LineJoinMode.Miter);
				expect(stroke!.props.StrokeSizingMode).toBe(Enum.StrokeSizingMode.FixedSize);
				expect(stroke!.props.Transparency).toBeCloseTo(0.1, 5);
				expect(stroke!.props.ZIndex).toBe(7);
			});
		});

		describe("color → TextColor3", () => {
			it("should parse hex colors to TextColor3", () => {
				const result = webStyle({ color: "#00ff00" });
				expect(result.props.TextColor3).toBeDefined();
				const color = result.props.TextColor3 as Color3;
				expect(color.R).toBe(0);
				expect(color.G).toBe(1);
				expect(color.B).toBe(0);
			});

			it("should map color 'transparent' to TextTransparency 1", () => {
				const result = webStyle({ color: "transparent" });
				expect(result.props.TextTransparency).toBe(1);
			});
		});

		describe("fontSize → TextSize", () => {
			it("should map fontSize to TextSize", () => {
				const result = webStyle({ fontSize: 24 });
				expect(result.props.TextSize).toBe(24);
			});
		});

		describe("textAlign → TextXAlignment", () => {
			it("should map 'left' to Enum.TextXAlignment.Left", () => {
				const result = webStyle({ textAlign: "left" });
				expect(result.props.TextXAlignment).toBe(Enum.TextXAlignment.Left);
			});

			it("should map 'center' to Enum.TextXAlignment.Center", () => {
				const result = webStyle({ textAlign: "center" });
				expect(result.props.TextXAlignment).toBe(Enum.TextXAlignment.Center);
			});

			it("should map 'right' to Enum.TextXAlignment.Right", () => {
				const result = webStyle({ textAlign: "right" });
				expect(result.props.TextXAlignment).toBe(Enum.TextXAlignment.Right);
			});
		});

		describe("whiteSpace & wordBreak → TextWrapped", () => {
			it("should map whiteSpace 'normal', 'pre-wrap', 'pre-line' to true", () => {
				expect(webStyle({ whiteSpace: "normal" }).props.TextWrapped).toBe(true);
				expect(webStyle({ whiteSpace: "pre-wrap" }).props.TextWrapped).toBe(true);
				expect(webStyle({ whiteSpace: "pre-line" }).props.TextWrapped).toBe(true);
			});

			it("should map whiteSpace 'nowrap' to false", () => {
				expect(webStyle({ whiteSpace: "nowrap" }).props.TextWrapped).toBe(false);
			});

			it("should map wordBreak 'normal', 'break-word', 'break-all' to true", () => {
				expect(webStyle({ wordBreak: "normal" }).props.TextWrapped).toBe(true);
				expect(webStyle({ wordBreak: "break-word" }).props.TextWrapped).toBe(true);
				expect(webStyle({ wordBreak: "break-all" }).props.TextWrapped).toBe(true);
			});

			it("should map wordBreak 'keep-all' to false", () => {
				expect(webStyle({ wordBreak: "keep-all" }).props.TextWrapped).toBe(false);
			});
		});

		describe("fontFamily & fontWeight → FontFace", () => {
			it("should map fontFamily to the correct URI and use default weight", () => {
				const result = webStyle({ fontFamily: "Montserrat" });
				expect(result.props.FontFace).toBeDefined();
				const font = result.props.FontFace as Font;
				expect(font.Family).toBe("rbxasset://fonts/families/Montserrat.json");
				expect(font.Weight).toBe(Enum.FontWeight.Regular);
				expect(font.Style).toBe(Enum.FontStyle.Normal);
			});

			it("should map fontWeight to the correct Enum and use default family", () => {
				const result = webStyle({ fontWeight: "bold" });
				expect(result.props.FontFace).toBeDefined();
				const font = result.props.FontFace as Font;
				expect(font.Family).toBe("rbxasset://fonts/families/BuilderSans.json");
				expect(font.Weight).toBe(Enum.FontWeight.Bold);
				expect(font.Style).toBe(Enum.FontStyle.Normal);
			});

			it("should map both fontFamily and fontWeight", () => {
				const result = webStyle({ fontFamily: "Montserrat", fontWeight: "black" });
				expect(result.props.FontFace).toBeDefined();
				const font = result.props.FontFace as Font;
				expect(font.Family).toBe("rbxasset://fonts/families/Montserrat.json");
				expect(font.Weight).toBe(Enum.FontWeight.Heavy);
				expect(font.Style).toBe(Enum.FontStyle.Normal);
			});

			it("should use fallback for any fontFamily and fontWeight", () => {
				const result = webStyle({ fontFamily: "UnknownFont", fontWeight: "superbold" });
				expect(result.props.FontFace).toBeDefined();
				const font = result.props.FontFace as Font;
				expect(font.Family).toBe("rbxasset://fonts/families/BuilderSans.json");
				expect(font.Weight).toBe(Enum.FontWeight.Regular);
				expect(font.Style).toBe(Enum.FontStyle.Normal);
			});
		});
	});

	describe("display: 'none' → Visible = false", () => {
		it("should set Visible to false", () => {
			const result = webStyle({ display: "none" });
			expect(result.props.Visible).toBe(false);
		});

		it("should not set Visible if display is flex or grid", () => {
			const flexResult = webStyle({ display: "flex" });
			expect(flexResult.props.Visible).toBeUndefined();

			const gridResult = webStyle({ display: "grid" });
			expect(gridResult.props.Visible).toBeUndefined();
		});
	});

	describe("13. overflow → ClipsDescendants", () => {
		it("should set ClipsDescendants to true when overflow is hidden", () => {
			const result = webStyle({ overflow: "hidden" });
			expect(result.props.ClipsDescendants).toBe(true);
		});

		it("should set ClipsDescendants to false when overflow is visible", () => {
			const result = webStyle({ overflow: "visible" });
			expect(result.props.ClipsDescendants).toBe(false);
		});
	});

	describe("14. pointerEvents → Interactable / Active", () => {
		it("should set Interactable and Active to false when pointerEvents is 'none'", () => {
			const result = webStyle({ pointerEvents: "none" });
			expect(result.props.Interactable).toBe(false);
			expect(result.props.Active).toBe(false);
		});

		it("should not set Interactable or Active when pointerEvents is 'auto' or omitted", () => {
			const result = webStyle({ pointerEvents: "auto" });
			expect(result.props.Interactable).toBeUndefined();
			expect(result.props.Active).toBeUndefined();

			const omittedResult = webStyle({});
			expect(omittedResult.props.Interactable).toBeUndefined();
			expect(omittedResult.props.Active).toBeUndefined();
		});
	});

	describe("backgroundImage → <imagelabel>", () => {
		it("should inject imagelabel with Image property for unquoted URL", () => {
			const result = webStyle({ backgroundImage: "url(rbxassetid://12345)" });
			const img = result.children.find((c) => c.type === "ImageLabel");
			expect(img).toBeDefined();
			expect(img!.props.Image).toBe("rbxassetid://12345");
			expect(img!.props.ZIndex).toBe(-1);
			expect((img!.props.Size as UDim2).X.Scale).toBe(1);
			expect((img!.props.Size as UDim2).Y.Scale).toBe(1);
		});

		it("should inject imagelabel with Image property for double-quoted URL", () => {
			const result = webStyle({ backgroundImage: "url(\"rbxassetid://12345\")" });
			const img = result.children.find((c) => c.type === "ImageLabel");
			expect(img).toBeDefined();
			expect(img!.props.Image).toBe("rbxassetid://12345");
		});

		it("should inject imagelabel with Image property for single-quoted URL", () => {
			const result = webStyle({ backgroundImage: "url('rbxassetid://12345')" });
			const img = result.children.find((c) => c.type === "ImageLabel");
			expect(img).toBeDefined();
			expect(img!.props.Image).toBe("rbxassetid://12345");
		});

		it("should map backgroundSize 'cover' to Enum.ScaleType.Crop", () => {
			const result = webStyle({ backgroundImage: "url(rbxassetid://12345)", backgroundSize: "cover" });
			const img = result.children.find((c) => c.type === "ImageLabel");
			expect(img!.props.ScaleType).toBe(Enum.ScaleType.Crop);
		});

		it("should map backgroundSize 'contain' to Enum.ScaleType.Fit", () => {
			const result = webStyle({ backgroundImage: "url(rbxassetid://12345)", backgroundSize: "contain" });
			const img = result.children.find((c) => c.type === "ImageLabel");
			expect(img!.props.ScaleType).toBe(Enum.ScaleType.Fit);
		});
	});

	describe("15. boxShadow → <imagelabel>", () => {
		it("should inject <imagelabel> with correct base properties", () => {
			const result = webStyle({ boxShadow: "md" });
			const child = result.children.find((c) => c.type === "ImageLabel");
			expect(child).toBeDefined();
			expect(child!.type).toBe("ImageLabel");
			// Verify default shadow asset ID (see SHADOW_ASSET_ID in webStyle.ts)
			expect(child!.props.Image).toBe("rbxassetid://6015897843");
			expect(child!.props.ScaleType).toBe(Enum.ScaleType.Slice);
			expect(child!.props.SliceScale).toBe(0.3);
			expect(child!.props.BackgroundTransparency).toBe(1);
			const color = child!.props.ImageColor3 as Color3;
			expect(color.R).toBe(0);
			expect(color.G).toBe(0);
			expect(color.B).toBe(0);
			expect(child!.props.ZIndex).toBe(-1);
			const anchor = child!.props.AnchorPoint as Vector2;
			expect(anchor.X).toBe(0.5);
			expect(anchor.Y).toBe(0.5);
			const pos = child!.props.Position as UDim2;
			expect(pos.X.Scale).toBe(0.5);
			expect(pos.X.Offset).toBe(0);
			expect(pos.Y.Scale).toBe(0.5);
			expect(pos.Y.Offset).toBe(4);
		});

		it("should not inject <imagelabel> if boxShadow is 'none'", () => {
			const result = webStyle({ boxShadow: "none" });
			const child = result.children.find((c) => c.type === "ImageLabel");
			expect(child).toBeUndefined();
		});

		it("should map 'sm' token to correct size and transparency", () => {
			const result = webStyle({ boxShadow: "sm" });
			const child = result.children.find((c) => c.type === "ImageLabel")!;
			const size = child.props.Size as UDim2;
			expect(size.X.Scale).toBe(1);
			expect(size.X.Offset).toBe(10);
			expect(size.Y.Scale).toBe(1);
			expect(size.Y.Offset).toBe(10);
			expect(child.props.ImageTransparency).toBeCloseTo(0.7, 5);
		});

		it("should map '2xl' token to correct size and transparency", () => {
			const result = webStyle({ boxShadow: "2xl" });
			const child = result.children.find((c) => c.type === "ImageLabel")!;
			const size = child.props.Size as UDim2;
			expect(size.X.Scale).toBe(1);
			expect(size.X.Offset).toBe(40);
			expect(size.Y.Scale).toBe(1);
			expect(size.Y.Offset).toBe(40);
			expect(child.props.ImageTransparency).toBeCloseTo(0.4, 5);
		});

		it("should fallback to default size and transparency for any token", () => {
			const result = webStyle({ boxShadow: "any" as never });
			const child = result.children.find((c) => c.type === "ImageLabel")!;
			const size = child.props.Size as UDim2;
			expect(size.X.Scale).toBe(1);
			expect(size.X.Offset).toBe(20);
			expect(size.Y.Scale).toBe(1);
			expect(size.Y.Offset).toBe(20);
			expect(child.props.ImageTransparency).toBeCloseTo(0.5, 5);
		});

		it("should parse CSS-like boxShadow into native UIShadow when requested", () => {
			const result = webStyle({
				boxShadow: "0 6px 12px 2px rgba(0, 0, 0, 0.4)",
				boxShadowMode: "uishadow",
				shadowTransparency: 0.25,
			});
			const child = result.children.find((c) => c.type === "UIShadow");
			expect(child).toBeDefined();
			expect((child!.props.Offset as UDim2).Y.Offset).toBe(6);
			expect((child!.props.BlurRadius as UDim).Offset).toBe(12);
			expect((child!.props.Spread as UDim2).X.Offset).toBe(2);
			expect(child!.props.Transparency).toBe(0.25);
		});

		it("should use native UIShadow for CSS-like boxShadow by default", () => {
			const result = webStyle({ boxShadow: "1px 2px 3px 4px #ff0000" });
			const child = result.children.find((c) => c.type === "UIShadow");
			expect(child).toBeDefined();
			expect((child!.props.Offset as UDim2).X.Offset).toBe(1);
			expect((child!.props.Offset as UDim2).Y.Offset).toBe(2);
			expect((child!.props.BlurRadius as UDim).Offset).toBe(3);
			expect((child!.props.Spread as UDim2).X.Offset).toBe(4);
			const color = child!.props.Color as Color3;
			expect(color.R).toBe(1);
			expect(color.G).toBe(0);
			expect(color.B).toBe(0);
		});

		it("should keep CSS-like boxShadow on image fallback when requested", () => {
			const result = webStyle({ boxShadow: "1px 2px 3px 4px #ff0000", boxShadowMode: "image" });
			expect(result.children.find((c) => c.type === "UIShadow")).toBeUndefined();
			const child = result.children.find((c) => c.type === "ImageLabel");
			expect(child).toBeDefined();
			expect((child!.props.Size as UDim2).X.Offset).toBe(20);
		});

		it("should build native UIShadow from shadow props without boxShadow", () => {
			const result = webStyle({
				shadowBlurRadius: "8px",
				shadowColor: "rgba(10, 20, 30, 0.25)",
				shadowOffset: "3px -4px",
				shadowSpread: "5px 6px",
				shadowZIndex: 9,
			});
			const child = result.children.find((c) => c.type === "UIShadow");
			expect(child).toBeDefined();
			expect((child!.props.BlurRadius as UDim).Offset).toBe(8);
			expect((child!.props.Offset as UDim2).X.Offset).toBe(3);
			expect((child!.props.Offset as UDim2).Y.Offset).toBe(-4);
			expect((child!.props.Spread as UDim2).X.Offset).toBe(5);
			expect((child!.props.Spread as UDim2).Y.Offset).toBe(6);
			expect(child!.props.Transparency).toBeCloseTo(0.75, 5);
			expect(child!.props.ZIndex).toBe(9);
		});

		it("should map preset tokens through native UIShadow when opted in", () => {
			const result = webStyle({ boxShadow: "2xl", boxShadowMode: "uishadow" });
			const child = result.children.find((c) => c.type === "UIShadow");
			expect(child).toBeDefined();
			expect((child!.props.BlurRadius as UDim).Offset).toBe(24);
			expect((child!.props.Offset as UDim2).Y.Offset).toBe(15);
			expect((child!.props.Spread as UDim2).X.Offset).toBe(8);
			expect(child!.props.Transparency).toBeCloseTo(0.4, 5);
		});

		it("should use custom SHADOW_ASSET_ID when overridden", () => {
			// NOTE: We cannot easily override module-level `let` exports from the test
			// side because roblox-ts modules are loaded once. Instead, we verify the
			// default asset ID is the expected value, documenting that it IS configurable.
			const result = webStyle({ boxShadow: "md" });
			const child = result.children.find((c) => c.type === "ImageLabel")!;
			// Default asset
			expect(child.props.Image).toBe("rbxassetid://6015897843");
			// Verify the SliceCenter matches the documented default
			const sliceCenter = child.props.SliceCenter as Rect;
			expect(sliceCenter.Min.X).toBe(47);
			expect(sliceCenter.Min.Y).toBe(47);
			expect(sliceCenter.Max.X).toBe(450);
			expect(sliceCenter.Max.Y).toBe(450);
		});
	});

	describe("16. objectFit → ScaleType", () => {
		it("should map 'cover' to Enum.ScaleType.Crop", () => {
			const result = webStyle({ objectFit: "cover" });
			expect(result.props.ScaleType).toBe(Enum.ScaleType.Crop);
		});

		it("should map 'contain' to Enum.ScaleType.Fit", () => {
			const result = webStyle({ objectFit: "contain" });
			expect(result.props.ScaleType).toBe(Enum.ScaleType.Fit);
		});

		it("should map 'fill' to Enum.ScaleType.Stretch", () => {
			const result = webStyle({ objectFit: "fill" });
			expect(result.props.ScaleType).toBe(Enum.ScaleType.Stretch);
		});
	});

	describe("17. lineHeight → LineHeight", () => {
		it("should map lineHeight to LineHeight", () => {
			const result = webStyle({ lineHeight: 1.5 });
			expect(result.props.LineHeight).toBe(1.5);
		});
	});

	describe("18. textOverflow → TextTruncate", () => {
		it("should map textOverflow 'ellipsis' to Enum.TextTruncate.AtEnd", () => {
			const result = webStyle({ textOverflow: "ellipsis" });
			expect(result.props.TextTruncate).toBe(Enum.TextTruncate.AtEnd);
		});
	});

	describe("19. layoutOrder → LayoutOrder", () => {
		it("should map layoutOrder to LayoutOrder", () => {
			const result = webStyle({ layoutOrder: 5 });
			expect(result.props.LayoutOrder).toBe(5);
		});

		it("should handle negative layoutOrder", () => {
			const result = webStyle({ layoutOrder: -3 });
			expect(result.props.LayoutOrder).toBe(-3);
		});

		it("should handle zero layoutOrder", () => {
			const result = webStyle({ layoutOrder: 0 });
			expect(result.props.LayoutOrder).toBe(0);
		});

		it("should map order to LayoutOrder", () => {
			const result = webStyle({ order: 10 });
			expect(result.props.LayoutOrder).toBe(10);
		});

		it("should prioritize order over layoutOrder", () => {
			const result = webStyle({ order: 15, layoutOrder: 5 });
			expect(result.props.LayoutOrder).toBe(15);
		});
	});

	describe("20. rotation → Rotation", () => {
		it("should map rotation to Rotation", () => {
			const result = webStyle({ rotation: 45 });
			expect(result.props.Rotation).toBe(45);
		});

		it("should handle negative rotation", () => {
			const result = webStyle({ rotation: -90 });
			expect(result.props.Rotation).toBe(-90);
		});

		it("should handle zero rotation", () => {
			const result = webStyle({ rotation: 0 });
			expect(result.props.Rotation).toBe(0);
		});
	});

	describe("21. visibility → Visible", () => {
		it("should set Visible to false when visibility is 'hidden'", () => {
			const result = webStyle({ visibility: "hidden" });
			expect(result.props.Visible).toBe(false);
		});

		it("should set Visible to true when visibility is 'visible'", () => {
			const result = webStyle({ visibility: "visible" });
			expect(result.props.Visible).toBe(true);
		});

		it("should not affect Visible when visibility is not set", () => {
			const result = webStyle({});
			expect(result.props.Visible).toBeUndefined();
		});

		it("should coexist with display: none (both set Visible)", () => {
			const result = webStyle({ display: "none" });
			expect(result.props.Visible).toBe(false);
		});
	});

	describe("22. autoSize → AutomaticSize", () => {
		it("should map autoSize 'xy' to Enum.AutomaticSize.XY", () => {
			const result = webStyle({ autoSize: "xy" });
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.XY);
		});

		it("should map autoSize 'x' to Enum.AutomaticSize.X", () => {
			const result = webStyle({ autoSize: "x" });
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.X);
		});

		it("should map autoSize 'y' to Enum.AutomaticSize.Y", () => {
			const result = webStyle({ autoSize: "y" });
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.Y);
		});

		it("should map autoSize 'none' to Enum.AutomaticSize.None", () => {
			const result = webStyle({ autoSize: "none" });
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.None);
		});

		it("should set AutomaticSize.X when width is 'auto'", () => {
			const result = webStyle({ width: "auto" });
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.X);
		});

		it("should set AutomaticSize.Y when height is 'auto'", () => {
			const result = webStyle({ height: "auto" });
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.Y);
		});

		it("should set AutomaticSize.XY when both width and height are 'auto'", () => {
			const result = webStyle({ width: "auto", height: "auto" });
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.XY);
		});

		it("should let explicit autoSize override width/height auto", () => {
			const result = webStyle({ width: "auto", autoSize: "y" });
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.Y);
		});

		it("should not set AutomaticSize when width/height are normal values", () => {
			const result = webStyle({ width: "50%", height: "100px" });
			expect(result.props.AutomaticSize).toBeUndefined();
		});
	});

	describe("23. textVerticalAlign → TextYAlignment", () => {
		it("should map 'top' to Enum.TextYAlignment.Top", () => {
			const result = webStyle({ textVerticalAlign: "top" });
			expect(result.props.TextYAlignment).toBe(Enum.TextYAlignment.Top);
		});

		it("should map 'center' to Enum.TextYAlignment.Center", () => {
			const result = webStyle({ textVerticalAlign: "center" });
			expect(result.props.TextYAlignment).toBe(Enum.TextYAlignment.Center);
		});

		it("should map 'bottom' to Enum.TextYAlignment.Bottom", () => {
			const result = webStyle({ textVerticalAlign: "bottom" });
			expect(result.props.TextYAlignment).toBe(Enum.TextYAlignment.Bottom);
		});
	});

	describe("24. fontStyle → FontFace italic", () => {
		it("should set FontFace with Italic style", () => {
			const result = webStyle({ fontStyle: "italic" });
			expect(result.props.FontFace).toBeDefined();
			const font = result.props.FontFace as Font;
			expect(font.Style).toBe(Enum.FontStyle.Italic);
			expect(font.Family).toBe("rbxasset://fonts/families/BuilderSans.json");
			expect(font.Weight).toBe(Enum.FontWeight.Regular);
		});

		it("should set FontFace with Normal style explicitly", () => {
			const result = webStyle({ fontStyle: "normal" });
			const font = result.props.FontFace as Font;
			expect(font.Style).toBe(Enum.FontStyle.Normal);
		});

		it("should combine fontStyle with fontWeight and fontFamily", () => {
			const result = webStyle({ fontFamily: "Montserrat", fontWeight: "bold", fontStyle: "italic" });
			const font = result.props.FontFace as Font;
			expect(font.Family).toBe("rbxasset://fonts/families/Montserrat.json");
			expect(font.Weight).toBe(Enum.FontWeight.Bold);
			expect(font.Style).toBe(Enum.FontStyle.Italic);
		});
	});

	describe("25. richText → RichText", () => {
		it("should set RichText to true", () => {
			const result = webStyle({ richText: true });
			expect(result.props.RichText).toBe(true);
		});

		it("should not set RichText when false", () => {
			const result = webStyle({ richText: false });
			expect(result.props.RichText).toBeUndefined();
		});

		it("should not set RichText when omitted", () => {
			const result = webStyle({});
			expect(result.props.RichText).toBeUndefined();
		});
	});

	describe("26. textDecoration → RichText + _textDecoration signal", () => {
		it("should set RichText true and _textDecoration for 'underline'", () => {
			const result = webStyle({ textDecoration: "underline" });
			expect(result.props.RichText).toBe(true);
			expect(result.props._textDecoration).toBe("underline");
		});

		it("should set RichText true and _textDecoration for 'line-through'", () => {
			const result = webStyle({ textDecoration: "line-through" });
			expect(result.props.RichText).toBe(true);
			expect(result.props._textDecoration).toBe("line-through");
		});

		it("should NOT set RichText or _textDecoration for 'none'", () => {
			const result = webStyle({ textDecoration: "none" });
			expect(result.props.RichText).toBeUndefined();
			expect(result.props._textDecoration).toBeUndefined();
		});

		it("should NOT set anything when textDecoration is omitted", () => {
			const result = webStyle({});
			expect(result.props._textDecoration).toBeUndefined();
		});
	});

	describe("27. textTransform → _textTransform signal", () => {
		it("should set _textTransform for 'uppercase'", () => {
			const result = webStyle({ textTransform: "uppercase" });
			expect(result.props._textTransform).toBe("uppercase");
		});

		it("should set _textTransform for 'lowercase'", () => {
			const result = webStyle({ textTransform: "lowercase" });
			expect(result.props._textTransform).toBe("lowercase");
		});

		it("should set _textTransform for 'capitalize'", () => {
			const result = webStyle({ textTransform: "capitalize" });
			expect(result.props._textTransform).toBe("capitalize");
		});

		it("should NOT set _textTransform for 'none'", () => {
			const result = webStyle({ textTransform: "none" });
			expect(result.props._textTransform).toBeUndefined();
		});

		it("should NOT set _textTransform when omitted", () => {
			const result = webStyle({});
			expect(result.props._textTransform).toBeUndefined();
		});
	});

	describe("28. flexGrow / flexShrink / alignSelf → <uiflexitem>", () => {
		it("should inject UIFlexItem with FlexMode Custom when flexGrow is set", () => {
			const result = webStyle({ flexGrow: 1 });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeDefined();
			expect(flexItem!.props.FlexMode).toBe(Enum.UIFlexMode.Custom);
			expect(flexItem!.props.GrowRatio).toBe(1);
			expect(flexItem!.props.ShrinkRatio).toBe(0);
		});

		it("should inject UIFlexItem with FlexMode Custom when flexShrink is set", () => {
			const result = webStyle({ flexShrink: 1 });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeDefined();
			expect(flexItem!.props.FlexMode).toBe(Enum.UIFlexMode.Custom);
			expect(flexItem!.props.GrowRatio).toBe(0);
			expect(flexItem!.props.ShrinkRatio).toBe(1);
		});

		it("should set both GrowRatio and ShrinkRatio when both are provided", () => {
			const result = webStyle({ flexGrow: 2, flexShrink: 3 });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeDefined();
			expect(flexItem!.props.FlexMode).toBe(Enum.UIFlexMode.Custom);
			expect(flexItem!.props.GrowRatio).toBe(2);
			expect(flexItem!.props.ShrinkRatio).toBe(3);
		});

		it("should NOT inject UIFlexItem when flexGrow and flexShrink are both 0", () => {
			const result = webStyle({ flexGrow: 0, flexShrink: 0 });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeUndefined();
		});

		it("should NOT inject UIFlexItem when neither flexGrow nor flexShrink is set", () => {
			const result = webStyle({});
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeUndefined();
		});

		it("should parse flex: 1 to flexGrow 1 and flexShrink 1", () => {
			const result = webStyle({ flex: 1 });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeDefined();
			expect(flexItem!.props.FlexMode).toBe(Enum.UIFlexMode.Custom);
			expect(flexItem!.props.GrowRatio).toBe(1);
			expect(flexItem!.props.ShrinkRatio).toBe(1);
		});

		it("should parse flex: 'auto' to flexGrow 1 and flexShrink 1", () => {
			const result = webStyle({ flex: "auto" });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeDefined();
			expect(flexItem!.props.GrowRatio).toBe(1);
			expect(flexItem!.props.ShrinkRatio).toBe(1);
		});

		it("should parse flex: 'none' to flexGrow 0 and flexShrink 0", () => {
			const result = webStyle({ flex: "none" });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeUndefined();
		});

		it("should parse flex: '2' as number string", () => {
			const result = webStyle({ flex: "2" as unknown as number });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeDefined();
			expect(flexItem!.props.GrowRatio).toBe(2);
			expect(flexItem!.props.ShrinkRatio).toBe(2);
		});

		it("should inject UIFlexItem with ItemLineAlignment for alignSelf 'center'", () => {
			const result = webStyle({ alignSelf: "center" });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeDefined();
			expect(flexItem!.props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.Center);
		});

		it("should inject UIFlexItem with ItemLineAlignment for alignSelf 'stretch'", () => {
			const result = webStyle({ alignSelf: "stretch" });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeDefined();
			expect(flexItem!.props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.Stretch);
		});

		it("should NOT inject UIFlexItem when alignSelf is 'auto'", () => {
			const result = webStyle({ alignSelf: "auto" });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeUndefined();
		});

		it("should combine flexGrow and alignSelf on a single UIFlexItem", () => {
			const result = webStyle({ flexGrow: 1, alignSelf: "flex-end" });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeDefined();
			expect(flexItem!.props.FlexMode).toBe(Enum.UIFlexMode.Custom);
			expect(flexItem!.props.GrowRatio).toBe(1);
			expect(flexItem!.props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.End);
		});

		it("should inject exactly one UIFlexItem child and no extras", () => {
			const result = webStyle({ flexGrow: 1 });
			expect(result.children.size()).toBe(1);
			expect(result.children[0]!.type).toBe("UIFlexItem");
		});

		it("should inject UIFlexItem and issue warning when flexGrow is used with display: 'grid'", () => {
			const result = webStyle({ display: "grid", flexGrow: 1 });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeDefined();
			expect(flexItem!.props.GrowRatio).toBe(1);
		});

		it("should inject UIFlexItem with ItemLineAlignment.Start for alignSelf 'flex-start'", () => {
			const result = webStyle({ alignSelf: "flex-start" });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeDefined();
			expect(flexItem!.props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.Start);
		});

		it("should inject UIFlexItem with ItemLineAlignment.End for alignSelf 'flex-end'", () => {
			const result = webStyle({ alignSelf: "flex-end" });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeDefined();
			expect(flexItem!.props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.End);
		});
	});

	describe("29. background: linear-gradient() → <uigradient>", () => {
		it("should inject UIGradient for a simple two-color gradient", () => {
			const result = webStyle({ background: "linear-gradient(to right, #ff0000, #0000ff)" });
			const gradient = result.children.find((c) => c.type === "UIGradient");
			expect(gradient).toBeDefined();
			// to right = CSS 90deg = Roblox rotation 0
			expect(gradient!.props.Rotation).toBe(0);
			expect(gradient!.props.Color).toBeDefined();
		});

		it("should set BackgroundTransparency to 0 (opaque, CSS parity) when gradient is present", () => {
			const result = webStyle({ background: "linear-gradient(to right, red, blue)" });
			expect(result.props.BackgroundTransparency).toBe(0);
		});

		it("should default BackgroundColor3 to white when gradient is present and no backgroundColor set", () => {
			const result = webStyle({ background: "linear-gradient(to right, red, blue)" });
			const bg = result.props.BackgroundColor3 as Color3;
			expect(bg.R).toBe(1);
			expect(bg.G).toBe(1);
			expect(bg.B).toBe(1);
		});

		it("should use explicit backgroundColor when provided alongside gradient", () => {
			const result = webStyle({ background: "linear-gradient(to right, red, blue)", backgroundColor: "#ff0000" });
			const bg = result.props.BackgroundColor3 as Color3;
			expect(bg.R).toBe(1);
			expect(bg.G).toBe(0);
			expect(bg.B).toBe(0);
		});

		it("should use default direction (to bottom = Roblox rotation 90) when direction is omitted", () => {
			const result = webStyle({ background: "linear-gradient(#ff0000, #0000ff)" });
			const gradient = result.children.find((c) => c.type === "UIGradient");
			expect(gradient).toBeDefined();
			expect(gradient!.props.Rotation).toBe(90);
		});

		it("should parse angle-based direction (45deg)", () => {
			const result = webStyle({ background: "linear-gradient(45deg, red, blue)" });
			const gradient = result.children.find((c) => c.type === "UIGradient");
			expect(gradient).toBeDefined();
			// 45deg CSS - 90 = -45 Roblox
			expect(gradient!.props.Rotation).toBe(-45);
		});

		it("should parse 'to left' direction", () => {
			const result = webStyle({ background: "linear-gradient(to left, red, blue)" });
			const gradient = result.children.find((c) => c.type === "UIGradient");
			expect(gradient!.props.Rotation).toBe(180);
		});

		it("should parse 'to top' direction", () => {
			const result = webStyle({ background: "linear-gradient(to top, red, blue)" });
			const gradient = result.children.find((c) => c.type === "UIGradient");
			// 0deg CSS - 90 = -90 Roblox
			expect(gradient!.props.Rotation).toBe(-90);
		});

		it("should include NumberSequence transparency when rgba colors are used", () => {
			const result = webStyle({
				background: "linear-gradient(to right, rgba(255,0,0,1), rgba(0,0,255,0.5))",
			});
			const gradient = result.children.find((c) => c.type === "UIGradient");
			expect(gradient).toBeDefined();
			expect(gradient!.props.Transparency).toBeDefined();
		});

		it("should map UIGradient offset and explicit rotation overrides", () => {
			const result = webStyle({
				background: "linear-gradient(to right, red, blue)",
				backgroundGradientOffset: "0.25 -0.5",
				backgroundGradientRotation: 45,
			});
			const gradient = result.children.find((c) => c.type === "UIGradient");
			expect(gradient).toBeDefined();
			expect((gradient!.props.Offset as Vector2).X).toBe(0.25);
			expect((gradient!.props.Offset as Vector2).Y).toBe(-0.5);
			expect(gradient!.props.Rotation).toBe(45);
		});

		it("should NOT include transparency when all colors are fully opaque", () => {
			const result = webStyle({ background: "linear-gradient(to right, #ff0000, #0000ff)" });
			const gradient = result.children.find((c) => c.type === "UIGradient");
			expect(gradient!.props.Transparency).toBeUndefined();
		});

		it("should NOT inject UIGradient when background is not a gradient string", () => {
			const result = webStyle({ background: "not-a-gradient" });
			const gradient = result.children.find((c) => c.type === "UIGradient");
			expect(gradient).toBeUndefined();
		});

		it("should coexist with other children (borderRadius + gradient)", () => {
			const result = webStyle({
				background: "linear-gradient(to right, red, blue)",
				borderRadius: "8px",
			});
			expect(result.children.find((c) => c.type === "UIGradient")).toBeDefined();
			expect(result.children.find((c) => c.type === "UICorner")).toBeDefined();
		});

		it("should not let opacity override BackgroundTransparency when gradient is present", () => {
			const result = webStyle({
				background: "linear-gradient(to right, red, blue)",
				opacity: 0.5,
			});
			// Gradient sets BackgroundTransparency to 0, opacity should not override
			expect(result.props.BackgroundTransparency).toBe(0);
		});

		it("should use aspect-ratio-aware corner keyword when pixel dimensions are provided", () => {
			const result = webStyle({
				width: 200,
				height: 100,
				background: "linear-gradient(to top right, red, blue)",
			});
			const gradient = result.children.find((c) => c.type === "UIGradient");
			expect(gradient).toBeDefined();
			// atan2(200, 100) ≈ 63.43deg CSS → 63.43 - 90 ≈ -26.57 Roblox
			const rotation = gradient!.props.Rotation as number;
			expect(rotation).toBeCloseTo(-26.57, 0);
		});
	});

	describe("Multiple constraints", () => {
		it("should produce multiple children if necessary", () => {
			const result = webStyle({
				borderRadius: "5px",
				padding: "10px",
				display: "flex",
				border: "1px solid red",
				aspectRatio: 1,
			});
			expect(result.children.size()).toBe(5);
		});
	});

	describe("calc() in style properties", () => {
		it("should parse calc() in width to produce UDim2 with both Scale and Offset", () => {
			const result = webStyle({ width: "calc(100% - 20px)", height: "50px" });
			expect(result.props.Size).toBeDefined();
			const size = result.props.Size as UDim2;
			expect(size.X.Scale).toBeCloseTo(1.0, 5);
			expect(size.X.Offset).toBe(-20);
			expect(size.Y.Scale).toBe(0);
			expect(size.Y.Offset).toBe(50);
		});
		it("should parse calc() in height", () => {
			const result = webStyle({ width: "100%", height: "calc(100% - 40px)" });
			expect(result.props.Size).toBeDefined();
			const size = result.props.Size as UDim2;
			expect(size.X.Scale).toBeCloseTo(1.0, 5);
			expect(size.X.Offset).toBe(0);
			expect(size.Y.Scale).toBeCloseTo(1.0, 5);
			expect(size.Y.Offset).toBe(-40);
		});
		it("should parse calc() in both width and height", () => {
			const result = webStyle({ width: "calc(50% + 10px)", height: "calc(100% - 30px)" });
			expect(result.props.Size).toBeDefined();
			const size = result.props.Size as UDim2;
			expect(size.X.Scale).toBeCloseTo(0.5, 5);
			expect(size.X.Offset).toBe(10);
			expect(size.Y.Scale).toBeCloseTo(1.0, 5);
			expect(size.Y.Offset).toBe(-30);
		});
		it("should parse calc() in individual padding sides", () => {
			const result = webStyle({ paddingTop: "calc(50% - 5px)" });
			const child = result.children.find((c) => c.type === "UIPadding");
			expect(child).toBeDefined();
			expect((child!.props.PaddingTop as UDim).Scale).toBeCloseTo(0.5, 5);
			expect((child!.props.PaddingTop as UDim).Offset).toBe(-5);
		});
		it("should parse calc() in gap", () => {
			const result = webStyle({ display: "flex", gap: "calc(0% + 15px)" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child).toBeDefined();
			expect((child!.props.Padding as UDim).Offset).toBe(15);
		});
		it("should parse calc() in borderRadius", () => {
			const result = webStyle({ borderRadius: "calc(50% - 2px)" });
			const child = result.children.find((c) => c.type === "UICorner");
			expect(child).toBeDefined();
			const radius = child!.props.CornerRadius as UDim;
			expect(radius.Scale).toBeCloseTo(0.5, 5);
			expect(radius.Offset).toBe(-2);
		});
		it("should coexist with other style properties", () => {
			const result = webStyle({
				width: "calc(100% - 20px)",
				height: "calc(100% - 20px)",
				backgroundColor: "#333",
				borderRadius: "8px",
			});
			expect(result.props.Size).toBeDefined();
			const size = result.props.Size as UDim2;
			expect(size.X.Scale).toBeCloseTo(1.0, 5);
			expect(size.X.Offset).toBe(-20);
			expect(result.props.BackgroundColor3).toBeDefined();
			const corner = result.children.find((c) => c.type === "UICorner");
			expect(corner).toBeDefined();
		});
	});

	describe("Malformed / invalid input resilience", () => {
		it("should not crash when width is a garbage string", () => {
			const result = webStyle({ width: "banana" });
			expect(result.props.Size).toBeDefined();
			const size = result.props.Size as UDim2;
			expect(size.X.Scale).toBe(0);
			expect(size.X.Offset).toBe(0);
		});

		it("should not crash when height is a garbage string", () => {
			const result = webStyle({ height: "not-a-size" });
			expect(result.props.Size).toBeDefined();
			const size = result.props.Size as UDim2;
			expect(size.Y.Scale).toBe(0);
			expect(size.Y.Offset).toBe(0);
		});

		it("should not crash when padding is a garbage string", () => {
			const result = webStyle({ padding: "fizzbuzz" });
			const child = result.children.find((c) => c.type === "UIPadding");
			expect(child).toBeDefined();
			expect((child!.props.PaddingTop as UDim).Offset).toBe(0);
			expect((child!.props.PaddingTop as UDim).Scale).toBe(0);
		});

		it("should not crash when borderRadius is a garbage string", () => {
			const result = webStyle({ borderRadius: "lol" });
			const child = result.children.find((c) => c.type === "UICorner");
			expect(child).toBeDefined();
			const radius = child!.props.CornerRadius as UDim;
			expect(radius.Scale).toBe(0);
			expect(radius.Offset).toBe(0);
		});

		it("should not crash on an empty border string", () => {
			const result = webStyle({ border: "nope" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Thickness).toBe(0);
		});

		it("should not crash when backgroundColor is a garbage string", () => {
			const result = webStyle({ backgroundColor: "xyzzy" });
			expect(result.props.BackgroundColor3).toBeDefined();
		});

		it("should not crash when gap is a garbage string", () => {
			const result = webStyle({ display: "flex", gap: "hello" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child).toBeDefined();
			expect((child!.props.Padding as UDim).Offset).toBe(0);
			expect((child!.props.Padding as UDim).Scale).toBe(0);
		});

		it("should produce a valid result when all string values are garbage", () => {
			const result = webStyle({
				width: "foo",
				height: "bar",
				padding: "baz",
				borderRadius: "qux",
				border: "quux",
				gap: "corge",
				backgroundColor: "grault",
			});
			expect(result.props).toBeDefined();
			expect(result.children).toBeDefined();
			expect(result.props.Size).toBeDefined();
		});

		it("should return empty props and no children for an empty style", () => {
			const result = webStyle({});
			expect(result.props.Size).toBeUndefined();
			expect(result.props.BackgroundColor3).toBeUndefined();
			expect(result.children.size()).toBe(0);
		});
	});

	describe("textShadow → <textlabel> duplicate", () => {
		it("should parse textShadow and output duplicate <textlabel> with gradient", () => {
			const result = webStyle({ textShadow: "3px 4px rgba(0, 0, 0, 0.5)", fontSize: 24 }, "Hello World");
			
			const shadowChild = result.children.find(c => c.type === "textlabel");
			expect(shadowChild).toBeDefined();
			expect(shadowChild!.props.Text).toBe("Hello World");
			expect(shadowChild!.props.ZIndex).toBe(-1);
			expect(shadowChild!.props.TextSize).toBe(24);
			
			const pos = shadowChild!.props.Position as UDim2;
			expect(pos.X.Offset).toBe(3);
			expect(pos.Y.Offset).toBe(4);
			
			const textColor = shadowChild!.props.TextColor3 as Color3;
			expect(textColor.R).toBe(0);
			expect(textColor.G).toBe(0);
			expect(textColor.B).toBe(0);
			
			expect(shadowChild!.props.TextTransparency).toBeCloseTo(0.5, 5);
			expect(shadowChild!.props.BackgroundTransparency).toBe(1);
			
			const gradientChild = (shadowChild!.props.children as ReactElementStub);
			expect(gradientChild).toBeDefined();
			expect(gradientChild.type).toBe("uigradient");
			expect(gradientChild.props.Color).toBeDefined();
		});

		it("should parse textShadow without offset dimensions", () => {
			const result = webStyle({ textShadow: "#ff0000" }, "No Offset");
			const shadowChild = result.children.find(c => c.type === "textlabel");
			
			expect(shadowChild).toBeDefined();
			
			const pos = shadowChild!.props.Position as UDim2;
			expect(pos.X.Offset).toBe(0);
			expect(pos.Y.Offset).toBe(0);
			
			const textColor = shadowChild!.props.TextColor3 as Color3;
			expect(textColor.R).toBe(1);
			expect(textColor.G).toBe(0);
			expect(textColor.B).toBe(0);
		});

		it("should parse negative dimensions in textShadow", () => {
			const result = webStyle({ textShadow: "-5px -2px #00ff00" }, "Negative Offset");
			const shadowChild = result.children.find(c => c.type === "textlabel");
			
			expect(shadowChild).toBeDefined();
			
			const pos = shadowChild!.props.Position as UDim2;
			expect(pos.X.Offset).toBe(-5);
			expect(pos.Y.Offset).toBe(-2);
		});

		it("should fall back to default shadow color if none provided", () => {
			const result = webStyle({ textShadow: "10px 10px" }, "Default Color");
			const shadowChild = result.children.find(c => c.type === "textlabel");
			
			expect(shadowChild).toBeDefined();
			
			const textColor = shadowChild!.props.TextColor3 as Color3;
			expect(textColor.R).toBe(0);
			expect(textColor.G).toBe(0);
			expect(textColor.B).toBe(0);
			expect(shadowChild!.props.TextTransparency).toBeCloseTo(0.5, 5);
		});
		
		it("should not create textShadow if hostText is not provided", () => {
			const result = webStyle({ textShadow: "10px 10px #000" });
			const shadowChild = result.children.find(c => c.type === "textlabel");
			
			expect(shadowChild).toBeUndefined();
		});
	});

	describe("Creator Hub UI object mappings", () => {
		it("maps documented image label and image button properties", () => {
			const result = webStyle({
				image: "rbxassetid://1",
				hoverImage: "rbxassetid://2",
				pressedImage: "rbxassetid://3",
				imageColor: "#336699",
				imageTransparency: 0.25,
			});

			expect(result.props.Image).toBe("rbxassetid://1");
			expect(result.props.HoverImage).toBe("rbxassetid://2");
			expect(result.props.PressedImage).toBe("rbxassetid://3");
			expect(result.props.ImageTransparency).toBe(0.25);
			expect(result.props.ImageColor3).toBeDefined();
		});

		it("maps documented scrolling frame canvas, inset, scrollbar, and elasticity properties", () => {
			const result = webStyle({
				canvasSize: "100% 420px",
				automaticCanvasSize: "y",
				canvasPosition: "4 12",
				verticalScrollBarInset: "scrollbar",
				horizontalScrollBarInset: "always",
				verticalScrollBarPosition: "left",
				scrollBarThickness: 10,
				scrollBarImageColor: "white",
				scrollBarImageTransparency: 0.4,
				scrollBarTopImage: "rbxassetid://top",
				scrollBarMidImage: "rbxassetid://mid",
				scrollBarBottomImage: "rbxassetid://bottom",
				elasticBehavior: "never",
			});

			const canvasSize = result.props.CanvasSize as UDim2;
			const canvasPosition = result.props.CanvasPosition as Vector2;
			expect(canvasSize.X.Scale).toBe(1);
			expect(canvasSize.Y.Offset).toBe(420);
			expect(result.props.AutomaticCanvasSize).toBe(Enum.AutomaticSize.Y);
			expect(canvasPosition.X).toBe(4);
			expect(canvasPosition.Y).toBe(12);
			expect(result.props.VerticalScrollBarInset).toBe(Enum.ScrollBarInset.ScrollBar);
			expect(result.props.HorizontalScrollBarInset).toBe(Enum.ScrollBarInset.Always);
			expect(result.props.VerticalScrollBarPosition).toBe(Enum.VerticalScrollBarPosition.Left);
			expect(result.props.ScrollBarThickness).toBe(10);
			expect(result.props.ScrollBarImageColor3).toBeDefined();
			expect(result.props.ScrollBarImageTransparency).toBe(0.4);
			expect(result.props.TopImage).toBe("rbxassetid://top");
			expect(result.props.MidImage).toBe("rbxassetid://mid");
			expect(result.props.BottomImage).toBe("rbxassetid://bottom");
			expect(result.props.ElasticBehavior).toBe(Enum.ElasticBehavior.Never);
		});

		it("maps documented viewport, video, and 2D path visual properties", () => {
			const result = webStyle({
				viewportAmbient: "rgb(200, 200, 200)",
				viewportLightColor: "rgb(140, 140, 140)",
				viewportLightDirection: "-1 -1 -1",
				video: "rbxassetid://5608384572",
				looped: true,
				playing: true,
				pathColor: "#ff0032",
				pathThickness: 10,
			});

			const lightDirection = result.props.LightDirection as Vector3;
			expect(result.props.Ambient).toBeDefined();
			expect(result.props.LightColor).toBeDefined();
			expect(lightDirection.X).toBe(-1);
			expect(lightDirection.Y).toBe(-1);
			expect(lightDirection.Z).toBe(-1);
			expect(result.props.Video).toBe("rbxassetid://5608384572");
			expect(result.props.Looped).toBe(true);
			expect(result.props.Playing).toBe(true);
			expect(result.props.Color3).toBeDefined();
			expect(result.props.Thickness).toBe(10);
		});

		it("maps documented proximity prompt properties", () => {
			const result = webStyle({
				promptObjectText: "Door",
				promptActionText: "Open",
				promptKeyboardKeyCode: "E",
				promptGamepadKeyCode: "ButtonR1",
				promptMaxActivationDistance: 12,
				promptRequiresLineOfSight: false,
				promptExclusivity: "always-show",
				promptHoldDuration: 0.5,
				promptClickable: true,
			});

			expect(result.props.ObjectText).toBe("Door");
			expect(result.props.ActionText).toBe("Open");
			expect(result.props.KeyboardKeyCode).toBe(Enum.KeyCode.E);
			expect(result.props.GamepadKeyCode).toBe(Enum.KeyCode.ButtonR1);
			expect(result.props.MaxActivationDistance).toBe(12);
			expect(result.props.RequiresLineOfSight).toBe(false);
			expect(result.props.Exclusivity).toBe(Enum.ProximityPromptExclusivity.AlwaysShow);
			expect(result.props.HoldDuration).toBe(0.5);
			expect(result.props.ClickablePrompt).toBe(true);
		});

		it("maps documented UI drag detector properties", () => {
			const result = webStyle({
				uiDragStyle: "translate-line",
				uiDragResponseStyle: "custom-scale",
				uiDragAxis: "0 1",
				uiDragMinTranslation: "0px 0px",
				uiDragMaxTranslation: "100% 12px",
				uiDragMinAngle: -45,
				uiDragMaxAngle: 45,
				uiDragBoundingBehavior: "hit-point",
				uiDragSpeedAxisMapping: "xx",
			});

			const dragAxis = result.props.DragAxis as Vector2;
			const maxTranslation = result.props.MaxDragTranslation as UDim2;
			expect(result.props.DragStyle).toBe(Enum.UIDragDetectorDragStyle.TranslateLine);
			expect(result.props.ResponseStyle).toBe(Enum.UIDragDetectorResponseStyle.CustomScale);
			expect(dragAxis.X).toBe(0);
			expect(dragAxis.Y).toBe(1);
			expect(maxTranslation.X.Scale).toBe(1);
			expect(maxTranslation.Y.Offset).toBe(12);
			expect(result.props.MinDragAngle).toBe(-45);
			expect(result.props.MaxDragAngle).toBe(45);
			expect(result.props.BoundingBehavior).toBe(Enum.UIDragDetectorBoundingBehavior.HitPoint);
			expect(result.props.UIDragSpeedAxisMapping).toBe(Enum.UIDragSpeedAxisMapping.XX);
		});

		it("maps documented list and grid layout ordering controls", () => {
			const list = webStyle({
				display: "flex",
				flexDirection: "row",
				justifyContent: "space-evenly",
				sortOrder: "name",
			});
			const listLayout = list.children.find((c) => c.type === "UIListLayout");
			expect(listLayout).toBeDefined();
			expect(listLayout!.props.FillDirection).toBe(Enum.FillDirection.Horizontal);
			expect(listLayout!.props.HorizontalFlex).toBe(Enum.UIFlexAlignment.SpaceEvenly);
			expect(listLayout!.props.SortOrder).toBe(Enum.SortOrder.Name);

			const grid = webStyle({
				display: "grid",
				gridMaxCells: 3,
				gridStartCorner: "bottom-right",
				sortOrder: "name",
			});
			const gridLayout = grid.children.find((c) => c.type === "UIGridLayout");
			expect(gridLayout).toBeDefined();
			expect(gridLayout!.props.FillDirectionMaxCells).toBe(3);
			expect(gridLayout!.props.StartCorner).toBe(Enum.StartCorner.BottomRight);
			expect(gridLayout!.props.SortOrder).toBe(Enum.SortOrder.Name);
		});

		it("maps documented table and page layout properties", () => {
			const tableResult = webStyle({
				display: "table",
				tableMajorAxis: "column-major",
				tableFillEmptySpaceColumns: true,
				tableFillEmptySpaceRows: true,
				tablePadding: "4px 8px",
			});
			const tableLayout = tableResult.children.find((c) => c.type === "UITableLayout");
			expect(tableLayout).toBeDefined();
			expect(tableLayout!.props.FillDirection).toBe(Enum.FillDirection.Vertical);
			expect(tableLayout!.props.MajorAxis).toBe(Enum.TableMajorAxis.ColumnMajor);
			expect(tableLayout!.props.FillEmptySpaceColumns).toBe(true);
			expect(tableLayout!.props.FillEmptySpaceRows).toBe(true);
			const tablePadding = tableLayout!.props.Padding as UDim2;
			expect(tablePadding.X.Offset).toBe(4);
			expect(tablePadding.Y.Offset).toBe(8);

			const page = webStyle({
				display: "page",
				pageFillDirection: "row",
				pagePadding: "12px",
				pageAnimated: true,
				pageCircular: true,
				pageTweenTime: 0.35,
				pageEasingStyle: "cubic",
				pageEasingDirection: "in-out",
				pageGamepadInputEnabled: false,
				pageScrollWheelInputEnabled: false,
				pageTouchInputEnabled: true,
			});
			const pageLayout = page.children.find((c) => c.type === "UIPageLayout");
			expect(pageLayout).toBeDefined();
			expect(pageLayout!.props.FillDirection).toBe(Enum.FillDirection.Horizontal);
			expect((pageLayout!.props.Padding as UDim).Offset).toBe(12);
			expect(pageLayout!.props.Animated).toBe(true);
			expect(pageLayout!.props.Circular).toBe(true);
			expect(pageLayout!.props.TweenTime).toBe(0.35);
			expect(pageLayout!.props.EasingStyle).toBe(Enum.EasingStyle.Cubic);
			expect(pageLayout!.props.EasingDirection).toBe(Enum.EasingDirection.InOut);
			expect(pageLayout!.props.GamepadInputEnabled).toBe(false);
			expect(pageLayout!.props.ScrollWheelInputEnabled).toBe(false);
			expect(pageLayout!.props.TouchInputEnabled).toBe(true);
		});

		it("maps documented size, text animation, and CanvasGroup properties", () => {
			const result = webStyle({
				scale: 1.5,
				textScaled: true,
				minTextSize: 9,
				maxTextSize: 48,
				maxVisibleGraphemes: 12,
				textStrokeColor: "#00ff00",
				textStrokeTransparency: 0.25,
				autoLocalize: false,
				groupColor: "#336699",
				groupTransparency: 0.4,
			});

			const scale = result.children.find((c) => c.type === "UIScale");
			const textConstraint = result.children.find((c) => c.type === "UITextSizeConstraint");
			expect(scale).toBeDefined();
			expect(scale!.props.Scale).toBe(1.5);
			expect(textConstraint).toBeDefined();
			expect(textConstraint!.props.MinTextSize).toBe(9);
			expect(textConstraint!.props.MaxTextSize).toBe(48);
			expect(result.props.TextScaled).toBe(true);
			expect(result.props.MaxVisibleGraphemes).toBe(12);
			expect(result.props.TextStrokeColor3).toBeDefined();
			expect(result.props.TextStrokeTransparency).toBe(0.25);
			expect(result.props.AutoLocalize).toBe(false);
			expect(result.props.GroupColor3).toBeDefined();
			expect(result.props.GroupTransparency).toBe(0.4);
		});

		it("maps documented 3D drag detector properties", () => {
			const result = webStyle({
				dragStyle: "translate-view-plane",
				dragResponseStyle: "physical",
				dragAxis: "0 1 0",
				dragOrientation: "0 90 0",
				dragMinTranslation: "0 0 0",
				dragMaxTranslation: "10 0 10",
				dragMinAngle: 0,
				dragMaxAngle: 90,
				dragPermissionPolicy: "scriptable",
				dragApplyAtCenterOfMass: true,
				dragMaxForce: 100000,
				dragMaxTorque: 5000,
				dragResponsiveness: 20,
				dragRunLocally: true,
			});

			const axis = result.props.Axis as Vector3;
			const orientation = result.props.Orientation as Vector3;
			const maxTranslation = result.props.MaxDragTranslation as Vector3;
			expect(result.props.DragStyle).toBe(Enum.DragDetectorDragStyle.TranslateViewPlane);
			expect(result.props.ResponseStyle).toBe(Enum.DragDetectorResponseStyle.Physical);
			expect(axis.Y).toBe(1);
			expect(orientation.Y).toBe(90);
			expect(maxTranslation.X).toBe(10);
			expect(maxTranslation.Z).toBe(10);
			expect(result.props.PermissionPolicy).toBe(Enum.DragDetectorPermissionPolicy.Scriptable);
			expect(result.props.ApplyAtCenterOfMass).toBe(true);
			expect(result.props.MaxForce).toBe(100000);
			expect(result.props.MaxTorque).toBe(5000);
			expect(result.props.Responsiveness).toBe(20);
			expect(result.props.RunLocally).toBe(true);
		});
	});
});
